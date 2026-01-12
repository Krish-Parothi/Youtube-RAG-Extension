import React from 'react'
import Header from './components/Header.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import QueryInput from './components/QueryInput.jsx'
import Loader from './components/Loader.jsx'
import { useBackground } from './hooks/useBackground.js'

function App() {
  const { state, conversation, loading, error, ask, jumpToTime } = useBackground()

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header title={state.url ? `Video: ${extractTitle(state.url)}` : 'YouTube RAG Reader'} status={state.status} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {error && (
          <div className="bg-red-600/20 border border-red-500 text-red-200 p-4 m-4 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}
        {loading && (
          <div className="bg-blue-600/20 border border-blue-500 text-blue-200 p-4 m-4 rounded-lg text-sm">
            ⏳ Searching your video...
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ChatPanel conversation={conversation} onJump={jumpToTime} />
        </div>
      </div>
      <QueryInput onSubmit={ask} />
    </div>
  )
}

function extractTitle(url) {
  // Dummy title extraction
  return 'Sample YouTube Video'
}

export default App
