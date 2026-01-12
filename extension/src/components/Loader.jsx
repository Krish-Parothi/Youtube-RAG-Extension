import React from 'react'

function Loader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-800/50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6 shadow-lg"></div>
        <p className="text-gray-300 text-lg font-medium">Processing your query...</p>
        <p className="text-gray-400 text-sm mt-2">Searching the transcript</p>
      </div>
    </div>
  )
}

export default Loader