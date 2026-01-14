import { useState } from 'react'

export default function QueryInput({ onSubmit, disabled, isReady }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && !disabled) {
      onSubmit(query)
      setQuery('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
        background: 'linear-gradient(to top, rgb(15, 23, 42), rgb(30, 41, 59))',
        padding: '16px',
        boxShadow: '0 -20px 25px -5px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          transition: 'all 0.2s',
          borderRadius: '8px',
          outline: isFocused ? '2px solid rgba(59, 130, 246, 0.5)' : 'none'
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about the video..."
            disabled={disabled}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
              color: 'rgb(226, 232, 240)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              border: '1px solid rgb(71, 85, 105)',
              outline: 'none',
              transition: 'all 0.2s',
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'text',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => !disabled && (e.target.style.background = 'linear-gradient(to right, rgb(51, 65, 85), rgb(71, 85, 105))')}
            onMouseLeave={(e) => !disabled && (e.target.style.background = 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))')}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          style={{
            background: disabled || !query.trim() ? 'rgb(71, 85, 105)' : 'linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            cursor: disabled || !query.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: disabled || !query.trim() ? 0.5 : 1,
            boxShadow: disabled || !query.trim() ? 'none' : '0 20px 25px -5px rgba(37, 99, 235, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => !disabled && !query.trim() === false && (e.target.style.boxShadow = '0 25px 30px -5px rgba(37, 99, 235, 0.7)')}
          onMouseLeave={(e) => !disabled && !query.trim() === false && (e.target.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.5)')}
        >
          <span>Send</span>
          
        </button>
      </div>
    </form>
  )
}
