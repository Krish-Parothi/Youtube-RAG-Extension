export default function Loader() {
  return (
    <>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.5))',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '64px',
            height: '64px'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(139, 92, 246), rgb(236, 72, 153))',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              filter: 'blur(2px)',
              opacity: 0.75
            }}></div>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(139, 92, 246))',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite reverse'
            }}></div>
            <div style={{
              position: 'absolute',
              inset: '4px',
              backgroundColor: 'rgb(15, 23, 42)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(139, 92, 246))',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                filter: 'blur(1px)'
              }}></div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{
              color: 'rgb(226, 232, 240)',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              margin: 0
            }}>
              Processing your question
            </p>
            <p style={{
              color: 'rgb(148, 163, 184)',
              fontSize: '12px',
              opacity: 0.8,
              margin: 0
            }}>
              ✨ Getting answer from video...
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: 'rgb(59, 130, 246)',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0s'
            }}></div>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: 'rgb(139, 92, 246)',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s'
            }}></div>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: 'rgb(236, 72, 153)',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s'
            }}></div>
          </div>
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
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-8px);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  )
}
