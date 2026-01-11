let lastSentUrl = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "URL_CHANGED") return;

  if (message.url === lastSentUrl) return;
  lastSentUrl = message.url;

  fetch("http://localhost:8000/ingest-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: message.url })
  }).catch(err => console.error("Backend error", err));
});
