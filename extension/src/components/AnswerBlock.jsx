import React from 'react'
import TimestampChip from './TimestampChip.jsx'

function AnswerBlock({ block, onJump }) {
  return (
    <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl shadow-xl border border-slate-500 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <p className="text-gray-100 mb-4 leading-relaxed text-lg">{block.text}</p>
      {block.timestamps && block.timestamps.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {block.timestamps.map((time, index) => (
            <TimestampChip key={index} seconds={time} onClick={onJump} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AnswerBlock