import React from 'react'

function Header({ title, status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-400'
      case 'indexing': return 'text-yellow-400 animate-pulse'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg px-6 py-4">
      <h1 className="text-xl font-bold text-white truncate">{title}</h1>
      <p className={`text-sm ${getStatusColor(status)} mt-1`}>
        Status: {status}
      </p>
    </div>
  )
}

export default Header