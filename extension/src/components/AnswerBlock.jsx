import  TimestampChip  from './TimestampChip'

export default function AnswerBlock({ message }) {
  const isUser = message.type === 'user'

  if (isUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px',
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(to bottom right, rgb(37, 99, 235), rgb(59, 130, 246))',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '16px',
          borderTopRightRadius: '0',
          maxWidth: '80%',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.5)',
          transition: 'all 0.2s',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(4px)'
        }}>
          <p style={{ fontSize: '14px', lineHeight: '1.5', fontWeight: 500, margin: 0 }}>{message.content}</p>
        </div>
      </div>
    )
  }

  const timestamps = message.timestamps || []

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '16px',
      animation: 'slideInLeft 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(to bottom right, rgb(55, 65, 81), rgb(71, 85, 105))',
        color: 'rgb(226, 232, 240)',
        padding: '12px 16px',
        borderRadius: '16px',
        borderTopLeftRadius: '0',
        maxWidth: '80%',
        boxShadow: '0 10px 15px -3px rgba(71, 85, 105, 0.5)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        backdropFilter: 'blur(4px)'
      }}>
        <p style={{ fontSize: '14px', lineHeight: '1.5', fontWeight: 500, margin: 0, marginBottom: '12px' }}>{message.content}</p>
        {timestamps.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(71, 85, 105, 0.5)'
          }}>
            {timestamps.map((ts, i) => (
              <TimestampChip key={i} timestamp={ts} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


