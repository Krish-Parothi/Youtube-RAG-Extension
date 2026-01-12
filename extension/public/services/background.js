let lastSentUrl = null;

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id, tab.url)
  chrome.sidePanel.open({ tabId: tab.id });
  
  // Immediately trigger indexing for this video
  if (tab.url && tab.url.includes('youtube.com')) {
    console.log('YouTube video detected, triggering indexing:', tab.url)
    chrome.runtime.sendMessage({
      type: 'URL_CHANGED',
      url: tab.url
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      sendResponse({ url: url, status: 'ready' });
    });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'ASK') {
    fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: message.sessionId, question: message.query, session_id: message.sessionId })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Backend response:', data)
      // Get current conversation and add assistant response
      chrome.storage.local.get(['conversation'], (result) => {
        const conversation = result.conversation || []
        const assistantMessage = {
          type: 'assistant',
          content: data.answer || 'No response',
          blocks: data.blocks || [],
          timestamp: Date.now()
        }
        const updatedConversation = [...conversation, assistantMessage]
        chrome.storage.local.set({ 
          conversation: updatedConversation,
          lastError: null 
        })
        console.log('Conversation updated:', updatedConversation)
      })
    })
    .catch(err => {
      console.error("Ask error", err)
      const errorMsg = 'Failed to get answer: ' + err.message
      chrome.storage.local.set({ lastError: errorMsg })
    })
  } else if (message.type === 'URL_CHANGED') {
    if (message.url === lastSentUrl) {
      console.log('URL already sent, skipping:', message.url)
      return
    }
    lastSentUrl = message.url;
    console.log('URL changed, indexing video:', message.url)

    fetch("http://localhost:8000/ingest-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: message.url })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Ingest response:', data)
    })
    .catch(err => console.error("Ingest error", err))
  }
});
