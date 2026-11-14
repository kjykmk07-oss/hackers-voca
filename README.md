# Hackers TOEFL Voca Quiz

Hackers TOEFL Vocabulary (Day 1~30) 표제어/유의어를 영단어 → 한글 뜻 6지선다로 학습하는 반응형 PWA입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

터미널에 뜨는 `http://localhost:5173` 주소를 브라우저(노트북/스마트폰 모두)에서 열면 됩니다. 스마트폰은 같은 Wi‑Fi에 연결한 뒤 PC의 IP로 접속하면 됩니다(`npm run dev -- --host` 로 실행하면 접속 주소가 함께 표시됩니다).

운영용으로 빌드해서 미리보기하려면:

```bash
npm run build
npm run preview
```

> Windows에 Node.js가 없다면 먼저 설치해야 합니다: `winget install OpenJS.NodeJS.LTS`

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소로 푸시합니다 (저장소 이름은 아무거나 상관없습니다 — `vite.config.js`의 `base: './'` 설정 덕분에 상대 경로로 동작합니다).

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. GitHub 저장소 설정에서 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
3. `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 자동으로 빌드 후 Pages에 배포합니다. Actions 탭에서 진행 상황을 볼 수 있고, 완료되면 `https://<username>.github.io/<repo-name>/` 주소로 접속할 수 있습니다.

배포된 주소를 스마트폰 브라우저로 열고 "홈 화면에 추가"를 하면 PWA로 설치되어 오프라인에서도 사용할 수 있습니다.

## 데이터

`src/data/words.json`에 Day 1~30 전체 표제어/유의어 데이터가 들어 있습니다. 단어집 사진에서 추출한 것으로, 추출에 사용한 스크립트는 `extraction/` 폴더에 참고용으로 남겨두었습니다(앱 빌드에는 포함되지 않습니다).

## 학습 기록

Day별 세션 진행 상황과 점수는 브라우저의 localStorage에 저장됩니다. 브라우저 데이터/캐시를 지우면 기록도 함께 사라지니 주의하세요.
