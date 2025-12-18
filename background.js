// Background service worker for the extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Email Analyzer extension installed!');
    
    // Open welcome page or instructions
    chrome.tabs.create({
      url: 'https://mail.google.com'
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAnalysis') {
    // Save analysis to chrome.storage
    chrome.storage.local.set({ 
      lastAnalysis: request.data,
      timestamp: Date.now()
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getLastAnalysis') {
    // Retrieve last analysis
    chrome.storage.local.get(['lastAnalysis', 'timestamp'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

// Optional: Add context menu item
try {
  chrome.contextMenus.create({
    id: 'analyzeEmail',
    title: 'Analyze this email',
    contexts: ['selection'],
    documentUrlPatterns: ['https://mail.google.com/*']
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeEmail') {
      // Send message to content script to analyze selected text
      chrome.tabs.sendMessage(tab.id, { 
        action: 'analyzeSelection', 
        text: info.selectionText 
      });
    }
  });
} catch (error) {
  console.log('Context menus not available:', error);
}
