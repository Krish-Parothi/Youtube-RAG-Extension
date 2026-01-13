chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.includes('youtube.com')) {
    await chrome.sidePanel.open({ tabId: tab.id })
    
    const videoId = new URL(tab.url).searchParams.get('v')
    if (videoId) {
      chrome.storage.local.set({
        url: tab.url,
        title: tab.title || 'YouTube Video',
        status: 'indexing'
      })

      fetch('http://localhost:8000/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url })
      })
        .then((res) => res.json())
        .then((data) => {
          chrome.storage.local.set({ status: 'indexed', title: data.title || 'Video' })
        })
        .catch(() => {
          chrome.storage.local.set({ status: 'idle', title: 'Error indexing' })
        })
    }
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATE') {
    chrome.storage.local.get(['url', 'title', 'status'], (result) => {
      sendResponse({
        url: result.url || '',
        title: result.title || '',
        status: result.status || 'idle'
      })
    })
    return true
  }

  if (request.type === 'URL_CHANGE') {
    const newUrl = request.url
    const newTitle = request.title
    chrome.storage.local.set({ url: newUrl, title: newTitle })
    return true
  }

  if (request.type === 'GET_CURRENT_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('youtube.com/watch')) {
        const url = tabs[0].url
        const title = tabs[0].title
        chrome.storage.local.set({ url, title })
        sendResponse({ url, title, status: 'idle' })
      } else {
        sendResponse({ url: '', title: '', status: 'idle' })
      }
    })
    return true
  }

  if (request.type === 'ASK') {
    chrome.storage.local.get(['url', 'sessions'], (result) => {
      const url = result.url || ''
      const videoId = url ? new URL(url).searchParams.get('v') : ''
      const sessions = result.sessions || {}
      const session = sessions[videoId] || { conversation: [] }

      fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: request.query, video_id: videoId, session_id: videoId })
      })
        .then((res) => res.json())
        .then((data) => {
          const updatedConversation = [
            ...session.conversation,
            {
              type: 'assistant',
              content: data.answer,
              timestamps: data.references?.map((r) => r.start) || []
            }
          ]
          const updatedSessions = {
            ...sessions,
            [videoId]: { ...session, conversation: updatedConversation }
          }
          chrome.storage.local.set({ sessions: updatedSessions })
          sendResponse()
        })
        .catch((error) => {
          sendResponse({ error: 'Failed to get answer' })
        })
    })
    return true
  }
})
