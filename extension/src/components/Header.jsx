export default function Header({ state, onClearChat }) {
  return (
    <div style={{
      background: 'linear-gradient(to right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
      borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      padding: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, rgb(96, 165, 250), rgb(167, 139, 250), rgb(244, 114, 182))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0
        }}>
          {state.title || 'YouTube Video'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {state.status === 'indexed' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'linear-gradient(to right, rgba(20, 83, 45, 0.3), rgba(5, 122, 85, 0.3))',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                backgroundColor: 'rgb(74, 222, 128)',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                boxShadow: '0 0 8px rgb(74, 222, 128)'
              }}></div>
              <span style={{ color: 'rgb(134, 239, 172)', fontSize: '12px', fontWeight: 600 }}>Ready to ask</span>
            </div>
          )}
          {state.status === 'indexing' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'linear-gradient(to right, rgba(120, 53, 15, 0.3), rgba(154, 52, 18, 0.3))',
              border: '1px solid rgba(217, 119, 6, 0.5)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                backgroundColor: 'rgb(251, 191, 36)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ color: 'rgb(253, 224, 71)', fontSize: '12px', fontWeight: 600 }}>Processing video...</span>
            </div>
          )}
          {state.status === 'idle' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(51, 65, 85, 0.3)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'rgb(148, 163, 184)',
                borderRadius: '50%'
              }}></div>
              <span style={{ color: 'rgb(148, 163, 184)', fontSize: '12px', fontWeight: 600 }}>Load a YouTube video</span>
            </div>
          )}
          <button
            onClick={onClearChat}
            style={{
              background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(to right, rgb(220, 38, 38), rgb(185, 28, 28))'
              e.target.style.boxShadow = '0 6px 8px -1px rgba(239, 68, 68, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))'
              e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.5)'
            }}
          >
            <span>🗑️</span>
            <span>Clear Chat</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
