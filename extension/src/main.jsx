import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App'

const root = document.getElementById('root')
if (root) {
  root.style.width = '100%'
  root.style.height = '100%'
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
