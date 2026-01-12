import React from 'react'
import TimestampChip from './TimestampChip.jsx'

function ChatPanel({ conversation, onJump }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-800/50">
      {conversation.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <p className="text-sm">No messages yet. Ask a question to get started!</p>
          </div>
        </div>
      ) : (
        conversation.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'user' ? (
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg max-w-xs">
                <p className="text-sm">{msg.content}</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-4 py-3 rounded-lg max-w-lg">
                <p className="text-sm mb-3">{msg.content}</p>
                {msg.blocks && msg.blocks.length > 0 && (
                  <div className="space-y-3">
                    {msg.blocks.map((block, blockIdx) => (
                      <div key={blockIdx} className="bg-slate-800/50 p-3 rounded">
                        <p className="text-xs text-gray-300 mb-2">{block.text}</p>
                        {block.timestamps && block.timestamps.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {block.timestamps.map((time, timeIdx) => (
                              <TimestampChip key={timeIdx} seconds={time} onClick={onJump} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default ChatPanel
