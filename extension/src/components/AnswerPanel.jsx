import React from 'react'
import AnswerBlock from './AnswerBlock.jsx'

function AnswerPanel({ answers, onJump }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-800/50">
      {answers.map((block, index) => (
        <AnswerBlock key={index} block={block} onJump={onJump} />
      ))}
    </div>
  )
}

export default AnswerPanel