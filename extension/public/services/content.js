let lastUrl = location.href;

setInterval(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    chrome.runtime.sendMessage({
      type: "URL_CHANGED",
      url: currentUrl
    });
  }
}, 1000);
