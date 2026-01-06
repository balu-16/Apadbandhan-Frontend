// Add message event handler at initial evaluation to prevent warning
self.addEventListener('message', (event) => {
  // Handle messages from the page
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
