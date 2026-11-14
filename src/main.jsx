import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { pruneStoredSessions } from './lib/storage.js'
import './styles.css'

// Shrink/clean previously saved sessions before any screen reads them.
pruneStoredSessions()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
