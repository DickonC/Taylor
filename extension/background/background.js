// Listen for messages from the website
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (request.type === 'AUTH_TOKEN') {
        chrome.storage.local.set({ authToken: request.token }, () => {
          console.log('Token stored in extension');
          sendResponse({ success: true });
        });
        return true; // Required to use sendResponse asynchronously
      }
    }
);