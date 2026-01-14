import React from 'react'

export default function SessionSidebar({ sessions, activeSessionId, onSwitchSession, onDeleteSession }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [selectedSessionId, setSelectedSessionId] = React.useState(null)

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation()
    setSelectedSessionId(sessionId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (selectedSessionId) {
      onDeleteSession(selectedSessionId)
    }
    setShowDeleteConfirm(false)
    setSelectedSessionId(null)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setSelectedSessionId(null)
  }

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
                color: '#e2e8f0',
                position: 'relative'
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
              <button
                onClick={(e) => handleDeleteClick(e, sessionId)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '2px'
                }}
                onMouseEnter={(e) => e.target.style.color = '#f87171'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
              >
                ×
              </button>
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

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            color: '#e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
              Are You Sure You Want to Delete this?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#374151',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
