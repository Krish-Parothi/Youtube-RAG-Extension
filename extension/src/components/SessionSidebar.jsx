export default function SessionSidebar({ sessions, activeSessionId, onSwitchSession }) {
  const sessionList = Object.entries(sessions)

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#1e293b',
      borderRight: '1px solid rgba(51, 65, 85, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        fontSize: '14px',
        fontWeight: 600,
        color: '#e2e8f0'
      }}>
        Chat Sessions
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {sessionList.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '12px'
          }}>
            No sessions yet
          </div>
        ) : (
          sessionList.map(([sessionId, session]) => (
            <div
              key={sessionId}
              onClick={() => onSwitchSession(sessionId)}
              style={{
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '6px',
                backgroundColor: activeSessionId === sessionId ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: activeSessionId === sessionId ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#e2e8f0'
              }}
              onMouseEnter={(e) => {
                if (activeSessionId !== sessionId) {
                  e.target.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSessionId !== sessionId) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.title}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.url}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
