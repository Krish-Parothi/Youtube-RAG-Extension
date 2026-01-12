import React from 'react'

function TimestampChip({ seconds, onClick }) {
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60)
    const remainingSeconds = secs % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={() => onClick(seconds)}
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-xl"
    >
      {formatTime(seconds)}
    </button>
  )
}

export default TimestampChip