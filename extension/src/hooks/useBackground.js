import { useState, useEffect, useRef, useCallback } from 'react'

export function useBackground() {
  const [state, setState] = useState({ url: '', title: '', status: 'idle' })
  const [sessions, setSessions] = useState({})
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const prevUrlRef = useRef('')

  const getCurrentTabUrl = useCallback(() => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_URL' }, (response) => {
        if (!chrome.runtime.lastError && response && response.url) {
          resolve(response)
        } else {
          resolve({ url: '', title: '', status: 'idle' })
        }
      })
    })
  }, [])

  const loadSessions = useCallback((currentState) => {
    chrome.storage.local.get(['conversation', 'sessions', 'lastError'], (result) => {
      const currentVideoId = currentState.url ? new URL(currentState.url).searchParams.get('v') : null

      if (result.conversation && !result.sessions) {
        // Migrate old single conversation to sessions
        if (currentVideoId) {
          const migratedSessions = {
            [currentVideoId]: { conversation: result.conversation, title: currentState.title || 'YouTube Video', url: currentState.url }
          }
          setSessions(migratedSessions)
          setActiveSessionId(currentVideoId)
          chrome.storage.local.set({ sessions: migratedSessions })
          chrome.storage.local.remove('conversation')
        }
      } else {
        let updatedSessions = result.sessions || {}

        // Ensure current video has a session
        if (currentVideoId && !updatedSessions[currentVideoId]) {
          updatedSessions[currentVideoId] = { conversation: [], title: currentState.title || 'YouTube Video', url: currentState.url }
          chrome.storage.local.set({ sessions: updatedSessions })
        }

        setSessions(updatedSessions)
        if (currentVideoId) {
          setActiveSessionId(currentVideoId)
        }
      }
      if (result.lastError) setError(result.lastError)
    })
  }, [])

  useEffect(() => {
    // Initialize with stored state
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (!chrome.runtime.lastError && response) {
        setState(response)
        prevUrlRef.current = response.url
        loadSessions(response)
      }
    })

    const storageListener = (changes) => {
      if (changes.url) {
        const newUrl = changes.url.newValue
        setState((prev) => ({ ...prev, url: newUrl }))
        if (newUrl && newUrl !== prevUrlRef.current) {
          prevUrlRef.current = newUrl
          const videoId = new URL(newUrl).searchParams.get('v')
          if (videoId) {
            setSessions(prev => {
              const updated = { ...prev }
              if (!updated[videoId]) {
                updated[videoId] = { conversation: [], title: changes.title?.newValue || 'YouTube Video', url: newUrl }
              }
              chrome.storage.local.set({ sessions: updated })
              return updated
            })
            setActiveSessionId(videoId)
          }
        }
      }

      if (changes.sessions) {
        setSessions(changes.sessions.newValue || {})
      }

      if (changes.status) {
        setState((prev) => ({ ...prev, status: changes.status.newValue }))
        if (changes.status.newValue === 'indexing' && activeSessionId) {
          setSessions(prev => {
            const updated = {
              ...prev,
              [activeSessionId]: { ...prev[activeSessionId], conversation: [] }
            }
            chrome.storage.local.set({ sessions: updated })
            return updated
          })
        }
      }

      if (changes.title) {
        setState((prev) => ({ ...prev, title: changes.title.newValue }))
        if (activeSessionId) {
          setSessions(prev => {
            const updated = {
              ...prev,
              [activeSessionId]: { ...prev[activeSessionId], title: changes.title.newValue }
            }
            chrome.storage.local.set({ sessions: updated })
            return updated
          })
        }
      }

      if (changes.lastError) {
        setError(changes.lastError.newValue)
        setLoading(false)
      }
    }

    chrome.storage.onChanged.addListener(storageListener)

    const statusInterval = setInterval(() => {
      chrome.storage.local.get(['url', 'status'], (result) => {
        if (result.url && result.status === 'indexing') {
          const videoId = new URL(result.url).searchParams.get('v')
          if (videoId) {
            fetch(`http://localhost:8000/status/${videoId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.indexed) {
                  chrome.storage.local.set({ status: 'indexed' })
                }
              })
              .catch(() => {})
          }
        }
      })
    }, 2000)

    const urlPollInterval = setInterval(async () => {
      const tabResponse = await getCurrentTabUrl()
      if (tabResponse.url && tabResponse.url.includes('youtube.com/watch')) {
        const videoId = new URL(tabResponse.url).searchParams.get('v')
        if (videoId) {
          chrome.storage.local.set({ url: tabResponse.url, title: tabResponse.title, lastError: null })
        }
      } else {
        chrome.storage.local.set({ url: '', title: '', lastError: 'No video URL detected' })
      }
    }, 1000)

    return () => {
      chrome.storage.onChanged.removeListener(storageListener)
      clearInterval(statusInterval)
      clearInterval(urlPollInterval)
    }
  }, [activeSessionId, loadSessions])

  const ask = useCallback(async (query) => {
    // Always get fresh current tab URL
    const tabResponse = await getCurrentTabUrl()
    if (!tabResponse.url || !tabResponse.url.includes('youtube.com/watch')) {
      return
    }

    const videoId = new URL(tabResponse.url).searchParams.get('v')
    if (!videoId) {
      return
    }

    // Update state and session if needed
    if (state.url !== tabResponse.url) {
      setState(tabResponse)
      prevUrlRef.current = tabResponse.url
      loadSessions(tabResponse)
    }
    if (activeSessionId !== videoId) {
      setActiveSessionId(videoId)
    }

    const newMessage = { type: 'user', content: query }
    const updatedConversation = [...(sessions[videoId]?.conversation || []), newMessage]
    const updatedSessions = {
      ...sessions,
      [videoId]: { ...sessions[videoId], conversation: updatedConversation, url: tabResponse.url, title: tabResponse.title }
    }
    setSessions(updatedSessions)
    chrome.storage.local.set({ sessions: updatedSessions })

    setLoading(true)
    setError(null)

    chrome.runtime.sendMessage({ type: 'ASK', query }, (response) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message)
        setLoading(false)
      } else if (response && response.error) {
        setError(response.error)
        setLoading(false)
      } else {
        setLoading(false)
      }
    })
  }, [state.url, activeSessionId, sessions, getCurrentTabUrl, loadSessions])

  const clearConversation = useCallback(() => {
    if (activeSessionId) {
      setSessions(prev => {
        const updated = {
          ...prev,
          [activeSessionId]: { ...prev[activeSessionId], conversation: [] }
        }
        chrome.storage.local.set({ sessions: updated })
        return updated
      })
    }
  }, [activeSessionId])

  const switchSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId)
  }, [])

  const conversation = activeSessionId ? sessions[activeSessionId]?.conversation || [] : []

  return { state, conversation, sessions, activeSessionId, loading, error, ask, clearConversation, switchSession }
}
