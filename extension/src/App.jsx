import { useBackground } from './hooks/useBackground'
import Header from './components/Header'
import AnswerPanel from './components/AnswerPanel'
import QueryInput from './components/QueryInput'
import Loader from './components/Loader'
import SessionSidebar from './components/SessionSidebar'
import './App.css'

export default function App() {
  const {
    state,
    conversation,
    sessions,
    activeSessionId,
    loading,
    error,
    ask,
    clearConversation,
    switchSession
  } = useBackground()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={switchSession}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexShrink: 0 }}>
          <Header state={state} onClearChat={clearConversation} />

          {error === 'No video URL detected' && !activeSessionId && (
            <div style={{
              background: 'linear-gradient(to right, rgba(127, 29, 29, 0.9), rgba(120, 53, 15, 0.9))',
              borderBottom: '1px solid rgba(127, 29, 29, 0.5)',
              padding: '12px 16px',
              color: '#fecaca',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <AnswerPanel conversation={conversation} />
          {loading && <Loader />}
        </div>

        <div style={{ flexShrink: 0 }}>
          <QueryInput onSubmit={ask} disabled={loading} />
        </div>
      </div>
    </div>
  )
}


// import { useBackground } from './hooks/useBackground'
// import { Header } from './components/Header'
// import { AnswerPanel } from './components/AnswerPanel'
// import { QueryInput } from './components/QueryInput'
// import { Loader } from './components/Loader'
// import { SessionSidebar } from './components/SessionSidebar'
// import './App.css'

// export default function App() {
//   const { state, conversation, sessions, activeSessionId, loading, error, ask, clearConversation, switchSession } = useBackground()

//   return (
//     <div style={{
//       display: 'flex',
//       flexDirection: 'row',
//       height: '100vh',
//       width: '100%',
//       backgroundColor: '#0f172a',
//       color: '#f1f5f9',
//       fontFamily: 'system-ui, -apple-system, sans-serif',
//       overflow: 'hidden'
//     }}>
//       <SessionSidebar sessions={sessions} activeSessionId={activeSessionId} onSwitchSession={switchSession} />
//       <div style={{
//         flex: 1,
//         display: 'flex',
//         flexDirection: 'column'
//       }}>
//         <div style={{ flexShrink: 0 }}>
//           <Header state={state} onClearChat={clearConversation} />
//           {error === 'No video URL detected' && !activeSessionId && (
//             <div style={{
//               background: 'linear-gradient(to right, rgba(127, 29, 29, 0.9), rgba(120, 53, 15, 0.9))',
//               borderBottom: '1px solid rgba(127, 29, 29, 0.5)',
//               padding: '12px 16px',
//               color: '#fecaca',
//               fontSize: '14px',
//               fontWeight: 600,
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//               animation: 'fadeIn 0.3s ease-in-out'
//             }}>
//               <span style={{ fontSize: '18px' }}>⚠️</span>
//               <span>{error}</span>
//             </div>
//           )}
//         </div>

//         <div style={{
//           flex: 1,
//           position: 'relative',
//           minHeight: 0
//         }}>
//           <AnswerPanel conversation={conversation} />
//           {loading && <Loader />}
//         </div>

//         <div style={{ flexShrink: 0 }}>
//           <QueryInput onSubmit={ask} disabled={loading} />
//         </div>
//       </div>
//     </div>
//   )
// }
