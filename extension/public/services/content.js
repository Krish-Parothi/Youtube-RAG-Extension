let lastUrl = window.location.href

function sendUrlChange(currentUrl, currentTitle) {
  chrome.runtime.sendMessage({
    type: 'URL_CHANGE',
    url: currentUrl,
    title: currentTitle
  })
}

function checkUrlChange() {
  const currentUrl = window.location.href
  const currentTitle = document.title
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    sendUrlChange(currentUrl, currentTitle)
  }
}

// Send initial URL
sendUrlChange(window.location.href, document.title)

// Check for URL changes using History API
window.addEventListener('popstate', checkUrlChange)

// Check for URL changes using MutationObserver on title changes (YouTube SPA)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.target.nodeName === 'TITLE') {
      checkUrlChange()
    }
  })
})

observer.observe(document.querySelector('title'), { childList: true })

// Override history methods to detect SPA navigation
const originalPushState = history.pushState
history.pushState = function(state, title, url) {
  const result = originalPushState.apply(this, arguments)
  checkUrlChange()
  return result
}

const originalReplaceState = history.replaceState
history.replaceState = function(state, title, url) {
  const result = originalReplaceState.apply(this, arguments)
  checkUrlChange()
  return result
}
