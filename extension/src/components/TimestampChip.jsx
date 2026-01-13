export default function TimestampChip({ timestamp }) {
  const minutes = Math.floor(timestamp / 60)
  const seconds = Math.floor(timestamp % 60)
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <button
      type="button"
      style={{
        background: 'linear-gradient(to right, rgb(71, 85, 105), rgb(107, 114, 128))',
        color: 'rgb(203, 213, 225)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: 'scale(1)',
        boxShadow: 'none',
        backdropFilter: 'blur(4px)'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'linear-gradient(to right, rgb(107, 114, 128), rgb(148, 163, 184))'
        e.target.style.transform = 'scale(1.1)'
        e.target.style.boxShadow = '0 10px 15px -3px rgba(107, 114, 128, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'linear-gradient(to right, rgb(71, 85, 105), rgb(107, 114, 128))'
        e.target.style.transform = 'scale(1)'
        e.target.style.boxShadow = 'none'
      }}
      onMouseDown={(e) => {
        e.target.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        e.target.style.transform = 'scale(1.1)'
      }}
    >
      ⏱ {formatted}
    </button>
  )
}
