import json
import glob
import os
from collections import defaultdict

EXDIR = os.path.dirname(os.path.abspath(__file__))
chunk_files = sorted(glob.glob(os.path.join(EXDIR, "chunk_*.json")))

all_entries = []
for f in chunk_files:
    with open(f, encoding="utf-8") as fh:
        data = json.load(fh)
    for e in data:
        e["_src"] = os.path.basename(f)
        all_entries.append(e)

print(f"Loaded {len(all_entries)} raw entries from {len(chunk_files)} chunk files")

# dedupe by (day, no, sense) -- keep first, record conflicts
seen = {}
deduped = []
conflicts = []
dupes_exact = 0
for e in all_entries:
    key = (e["day"], e["no"], e.get("sense", 1))
    if key not in seen:
        seen[key] = e
        deduped.append(e)
    else:
        prev = seen[key]
        if prev.get("word", "").lower() == e.get("word", "").lower() and prev.get("meaning") == e.get("meaning"):
            dupes_exact += 1
        else:
            conflicts.append((key, prev, e))

print(f"Exact duplicate entries skipped: {dupes_exact}")
print(f"Conflicting entries (same day/no/sense, different content): {len(conflicts)}")
for key, prev, e in conflicts:
    print(f"  CONFLICT day={key[0]} no={key[1]} sense={key[2]}: "
          f"[{prev['_src']}] {prev.get('word')} / {prev.get('meaning')}  vs  "
          f"[{e['_src']}] {e.get('word')} / {e.get('meaning')}")

deduped.sort(key=lambda e: (e["day"], e["no"], e.get("sense", 1)))

# strip internal _src field for final output
final = []
for e in deduped:
    e2 = {k: v for k, v in e.items() if k != "_src"}
    final.append(e2)

# gap analysis per day: which "no" numbers are missing within observed 1..max range
by_day = defaultdict(set)
synonyms_by_day = defaultdict(int)
headwords_by_day = defaultdict(set)
senses_by_day = defaultdict(int)
uncertain_list = []

for e in final:
    d = e["day"]
    by_day[d].add(e["no"])
    headwords_by_day[d].add(e["no"])
    senses_by_day[d] += 1
    synonyms_by_day[d] += len(e.get("synonyms", []))
    if e.get("uncertain"):
        uncertain_list.append((d, e["no"], e.get("sense", 1), e.get("word")))

print("\n=== Per-Day Report ===")
print(f"{'Day':<5}{'Headwords':<11}{'Senses':<8}{'Synonyms':<10}{'MissingNo(gaps in 1..max)'}")
total_headwords = 0
total_synonyms = 0
for d in range(1, 31):
    nos = by_day.get(d, set())
    if not nos:
        print(f"{d:<5}{'0':<11}{'0':<8}{'0':<10}DAY MISSING ENTIRELY")
        continue
    maxno = max(nos)
    missing = [n for n in range(1, maxno + 1) if n not in nos]
    hw = len(nos)
    syn = synonyms_by_day[d]
    senses = senses_by_day[d]
    total_headwords += hw
    total_synonyms += syn
    gap_str = ",".join(map(str, missing)) if missing else "-"
    print(f"{d:<5}{hw:<11}{senses:<8}{syn:<10}{gap_str}")

print(f"\nTOTAL headwords(no-count): {total_headwords}")
print(f"TOTAL sense-entries: {len(final)}")
print(f"TOTAL synonyms: {total_synonyms}")
print(f"\nUncertain entries ({len(uncertain_list)}):")
for u in uncertain_list:
    print(f"  day={u[0]} no={u[1]} sense={u[2]} word={u[3]}")

out_path = os.path.join(EXDIR, "..", "src", "data", "words.json")
out_path = os.path.abspath(out_path)
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(final, fh, ensure_ascii=False, indent=2)
print(f"\nWrote merged file: {out_path}")
print(f"Final entry count: {len(final)}")
