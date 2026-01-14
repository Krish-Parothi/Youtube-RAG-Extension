import  AnswerBlock  from './AnswerBlock'
import { useEffect, useRef } from 'react'

export default function AnswerPanel({ conversation, onSeek }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current
      // Use requestAnimationFrame for better performance and reliability
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight
      })
    }
  }, [conversation])

  return (
    <div
      ref={scrollRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px 16px',
        background: 'linear-gradient(to bottom, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
      }}
    >
      {conversation.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <div style={{ fontSize: '48px' }}>💬</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'rgb(226, 232, 240)', fontSize: '14px', fontWeight: 600, margin: 0 }}>No messages yet</p>
              <p style={{ color: 'rgb(148, 163, 184)', fontSize: '12px', margin: 0 }}>Ask a question about the video</p>
            </div>
            <div style={{
              height: '4px',
              width: '48px',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(139, 92, 246), rgb(236, 72, 153))',
              borderRadius: '9999px',
              marginLeft: 'auto',
              marginRight: 'auto',
              opacity: 0.5
            }}></div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minHeight: '100%'
        }}>
          {conversation.map((msg, i) => <AnswerBlock key={i} message={msg} onSeek={onSeek} />)}
        </div>
      )}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
