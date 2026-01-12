import { useState, useEffect } from 'react'

export function useBackground() {
  const [state, setState] = useState({ url: '', status: 'idle' })
  const [conversation, setConversation] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial state
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting state:', chrome.runtime.lastError)
        return
      }
      if (response) {
        console.log('State received:', response)
        setState(response)
        
        // Trigger indexing if on YouTube
        if (response.url && response.url.includes('youtube.com')) {
          console.log('Triggering indexing for:', response.url)
          chrome.runtime.sendMessage({
            type: 'URL_CHANGED',
            url: response.url
          })
        }
      }
    })

    // Load stored conversation on mount
    chrome.storage.local.get(['conversation', 'lastError'], (result) => {
      console.log('Loaded from storage:', result)
      if (result.conversation) {
        setConversation(result.conversation)
      }
      if (result.lastError) {
        setError(result.lastError)
      }
    })

    // Listen for storage changes
    const storageListener = (changes, area) => {
      if (area === 'local') {
        if (changes.conversation) {
          console.log('Conversation updated:', changes.conversation.newValue)
          setConversation(changes.conversation.newValue || [])
          setLoading(false)
          setError(null)
        }
        if (changes.lastError) {
          console.log('Error updated:', changes.lastError.newValue)
          setError(changes.lastError.newValue)
          setLoading(false)
        }
      }
    }

    chrome.storage.onChanged.addListener(storageListener)

    return () => chrome.storage.onChanged.removeListener(storageListener)
  }, [])

  const extractVideoId = (url) => {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const ask = (query) => {
    const videoId = extractVideoId(state.url)
    if (!videoId) {
      const err = 'No valid YouTube video URL detected'
      console.error(err)
      setError(err)
      setLoading(false)
      return
    }
    
    // Check if video is indexed first
    console.log('Checking indexing status for:', videoId)
    fetch(`http://localhost:8000/status/${videoId}`)
      .then(res => res.json())
      .then(status => {
        console.log('Video status:', status)
        
        if (status.status === 'failed') {
          setError(`Failed to index video: ${status.video_id}. Does the video have captions?`)
          setLoading(false)
          return
        }
        
        if (!status.indexed) {
          if (status.status === 'indexing') {
            setError(`Video is being indexed (${status.chunk_count} chunks loaded so far). Please wait...`)
          } else {
            setError('Video not indexed yet. Please wait a moment and try again.')
          }
          setLoading(false)
          return
        }
        
        console.log(`✅ Video indexed with ${status.chunk_count} chunks`)
        
        // Add user query to conversation immediately
        const newMessage = { type: 'user', content: query, timestamp: Date.now() }
        const updatedConversation = [...conversation, newMessage]
        setConversation(updatedConversation)
        chrome.storage.local.set({ conversation: updatedConversation })
        
        console.log('Asking question for video:', videoId, 'Query:', query)
        setLoading(true)
        setError(null)
        
        chrome.runtime.sendMessage({ type: 'ASK', query, sessionId: videoId }, (response) => {
          if (chrome.runtime.lastError) {
            const err = 'Failed to send query: ' + chrome.runtime.lastError.message
            console.error(err)
            setError(err)
            setLoading(false)
          }
        })
      })
      .catch(err => {
        console.error('Status check error:', err)
        setError('Could not check video status. Make sure backend is running on http://localhost:8000')
        setLoading(false)
      })
  }

  const jumpToTime = (seconds) => {
    chrome.runtime.sendMessage({ type: 'JUMP_TO_TIME', seconds }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error jumping to time:', chrome.runtime.lastError)
      }
    })
  }

  return { state, conversation, loading, error, ask, jumpToTime }
}