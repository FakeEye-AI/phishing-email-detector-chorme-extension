// Content script that runs on Gmail pages

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanInbox') {
    // Return cached results if available and recent (less than 1 minute old)
    if (autoScanResults && autoScanResults.timestamp && 
        (Date.now() - autoScanResults.timestamp) < 60000) {
      sendResponse(autoScanResults);
    } else {
      const result = scanInboxForPhishing();
      result.timestamp = Date.now();
      autoScanResults = result;
      sendResponse(result);
    }
  } else if (request.action === 'getAutoScanResults') {
    sendResponse(autoScanResults || { error: 'No scan results available' });
  }
  return true;
});

function scanInboxForPhishing() {
  try {
    // Get all email rows from inbox
    const emailRows = document.querySelectorAll('tr.zA') || document.querySelectorAll('div[role="row"]');
    
    if (!emailRows || emailRows.length === 0) {
      return { error: 'No emails found. Make sure you are in the inbox view.' };
    }

    const scannedEmails = [];
    let phishingCount = 0;

    // Clear previous highlighting
    clearPhishingHighlights();

    emailRows.forEach((row, index) => {
      if (index >= 50) return; // Limit to first 50 emails

      // Extract subject and preview
      const subjectElement = row.querySelector('span.bog') || row.querySelector('[data-thread-id]');
      const subject = subjectElement ? subjectElement.textContent.trim() : '';
      
      // Get sender
      const senderElement = row.querySelector('span.yW span') || row.querySelector('span[email]') || row.querySelector('.yP,.zF');
      const sender = senderElement ? senderElement.textContent.trim() : '';
      
      // Get preview text
      const previewElement = row.querySelector('span.y2') || row.querySelector('.Zt');
      const preview = previewElement ? previewElement.textContent.trim() : '';

      if (subject || preview) {
        const combinedText = `${subject} ${preview}`;
        const phishingAnalysis = detectPhishing(subject, preview, sender);
        
        if (phishingAnalysis.isSuspicious) {
          phishingCount++;
          // Apply visual highlighting to the email row
          highlightPhishingEmail(row, phishingAnalysis, subject);
        }

        scannedEmails.push({
          subject: subject || '(No subject)',
          sender: sender || 'Unknown',
          preview: preview.substring(0, 100),
          phishing: phishingAnalysis
        });
      }
    });

    return {
      success: true,
      totalScanned: scannedEmails.length,
      phishingCount: phishingCount,
      emails: scannedEmails,
      timestamp: Date.now(),
      autoScanned: true
    };
  } catch (error) {
    console.error('Error scanning inbox:', error);
    return { error: error.message };
  }
}

function detectPhishing(subject, preview, sender) {
  const combinedText = `${subject} ${preview} ${sender}`.toLowerCase();
  let suspicionScore = 0;
  const flags = [];

  // Phishing indicators
  const urgentWords = ['urgent', 'immediate', 'act now', 'expire', 'suspended', 'verify', 'confirm', 'limited time', 'click here', 'update now'];
  const moneyWords = ['prize', 'winner', 'claim', 'lottery', 'inheritance', 'million', 'refund', 'tax', 'payment'];
  const threatWords = ['suspend', 'lock', 'security', 'alert', 'warning', 'compromised', 'unauthorized', 'blocked'];
  const actionWords = ['click here', 'verify now', 'update', 'confirm identity', 'reset password', 'download'];

  // Check for urgent language
  urgentWords.forEach(word => {
    if (combinedText.includes(word)) {
      suspicionScore += 2;
      flags.push(`Urgent language: "${word}"`);
    }
  });

  // Check for money/prize mentions
  moneyWords.forEach(word => {
    if (combinedText.includes(word)) {
      suspicionScore += 3;
      flags.push(`Money-related: "${word}"`);
    }
  });

  // Check for threats
  threatWords.forEach(word => {
    if (combinedText.includes(word)) {
      suspicionScore += 2;
      flags.push(`Threat language: "${word}"`);
    }
  });

  // Check for action demands
  actionWords.forEach(word => {
    if (combinedText.includes(word)) {
      suspicionScore += 1;
      flags.push(`Action demand: "${word}"`);
    }
  });

  // Check for suspicious sender patterns
  if (sender && !sender.includes('@')) {
    // Sender name without visible email - less reliable
  } else if (sender) {
    // Check for mismatched domains
    if (/paypal|amazon|microsoft|apple|google|bank|irs|fedex|ups|dhl/i.test(sender)) {
      const legitimateDomains = ['paypal.com', 'amazon.com', 'microsoft.com', 'apple.com', 'google.com'];
      const hasLegitDomain = legitimateDomains.some(domain => sender.toLowerCase().includes(domain));
      if (!hasLegitDomain) {
        suspicionScore += 5;
        flags.push('Suspicious sender (impersonation)');
      }
    }
  }

  // Check for excessive punctuation
  const exclamationCount = (combinedText.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    suspicionScore += 1;
    flags.push('Excessive punctuation');
  }

  // Check for all caps words
  const words = subject.split(/\s+/);
  const allCapsWords = words.filter(word => word.length > 3 && word === word.toUpperCase());
  if (allCapsWords.length > 1) {
    suspicionScore += 1;
    flags.push('Excessive capitalization');
  }

  const isSuspicious = suspicionScore >= 5;
  const riskLevel = suspicionScore >= 8 ? 'High' : suspicionScore >= 5 ? 'Medium' : 'Low';

  return {
    isSuspicious,
    riskLevel,
    score: suspicionScore,
    flags: flags.slice(0, 5) // Limit to top 5 flags
  };
}

// Clear all phishing highlights
function clearPhishingHighlights() {
  const highlightedRows = document.querySelectorAll('.phishing-high, .phishing-medium');
  highlightedRows.forEach(row => {
    row.classList.remove('phishing-high', 'phishing-medium');
    row.removeAttribute('data-phishing-score');
    row.removeAttribute('data-phishing-flags');
  });
  
  // Remove all badges
  const badges = document.querySelectorAll('.phishing-badge');
  badges.forEach(badge => badge.remove());
}

// Highlight a phishing email row
function highlightPhishingEmail(row, phishingAnalysis, subject) {
  const riskClass = phishingAnalysis.riskLevel === 'High' ? 'phishing-high' : 'phishing-medium';
  row.classList.add(riskClass);
  row.setAttribute('data-phishing-score', phishingAnalysis.score);
  row.setAttribute('data-phishing-flags', phishingAnalysis.flags.join(', '));
  
  // Add warning badge
  const subjectElement = row.querySelector('span.bog') || row.querySelector('[data-thread-id]');
  if (subjectElement && !subjectElement.querySelector('.phishing-badge')) {
    const badge = document.createElement('span');
    badge.className = `phishing-badge ${phishingAnalysis.riskLevel.toLowerCase()}-risk`;
    badge.textContent = `⚠ ${phishingAnalysis.riskLevel} Risk`;
    badge.title = `Risk Score: ${phishingAnalysis.score}\nFlags: ${phishingAnalysis.flags.join(', ')}`;
    
    // Add tooltip on hover
    badge.addEventListener('mouseenter', (e) => {
      showPhishingTooltip(e, phishingAnalysis);
    });
    badge.addEventListener('mouseleave', hidePhishingTooltip);
    
    // Insert badge after subject
    subjectElement.appendChild(badge);
  }
}

// Show tooltip with phishing details
function showPhishingTooltip(event, analysis) {
  hidePhishingTooltip(); // Remove any existing tooltip
  
  const tooltip = document.createElement('div');
  tooltip.className = 'phishing-tooltip';
  tooltip.id = 'phishing-detail-tooltip';
  
  let flagsList = '';
  if (analysis.flags && analysis.flags.length > 0) {
    flagsList = '<ul>' + analysis.flags.map(flag => `<li>${flag}</li>`).join('') + '</ul>';
  }
  
  tooltip.innerHTML = `
    <strong>⚠ ${analysis.riskLevel} Risk Detected</strong>
    <div>Risk Score: ${analysis.score}/10</div>
    ${flagsList ? '<div style="margin-top: 8px;">Suspicious indicators:</div>' + flagsList : ''}
  `;
  
  document.body.appendChild(tooltip);
  
  // Position tooltip near the badge
  const rect = event.target.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = (rect.bottom + 5) + 'px';
  tooltip.style.left = rect.left + 'px';
}

// Hide tooltip
function hidePhishingTooltip() {
  const tooltip = document.getElementById('phishing-detail-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Auto-scan functionality
let autoScanResults = null;
let isScanning = false;

// Check if we're in inbox view (not in sent, drafts, spam, etc.)
function isInboxView() {
  const url = window.location.href;
  
  // Must be on Gmail
  if (!url.includes('mail.google.com')) {
    return false;
  }
  
  // Explicitly check for inbox
  const isInInbox = url.includes('#inbox') || url.includes('/inbox');
  
  // Exclude other views (sent, drafts, spam, trash, etc.)
  const isInOtherView = url.includes('#sent') || url.includes('/sent') ||
                        url.includes('#drafts') || url.includes('/drafts') ||
                        url.includes('#spam') || url.includes('/spam') ||
                        url.includes('#trash') || url.includes('/trash') ||
                        url.includes('#all') || url.includes('/all') ||
                        url.includes('#starred') || url.includes('/starred') ||
                        url.includes('#important') || url.includes('/important') ||
                        url.includes('#label/') || url.includes('/label/') ||
                        url.includes('#category/') || url.includes('/category/');
  
  // Only return true if explicitly in inbox and not in other views
  return isInInbox && !isInOtherView;
}

// Auto-scan when page loads
function performAutoScan() {
  if (isScanning) return;
  
  isScanning = true;
  showScanningIndicator();
  
  setTimeout(() => {
    const result = scanInboxForPhishing();
    autoScanResults = result;
    isScanning = false;
    
    if (result.success && result.phishingCount > 0) {
      showPhishingAlert(result);
    } else if (result.success) {
      showSafeIndicator();
    }
  }, 2000); // Wait 2 seconds for Gmail to load
}

// Show scanning indicator
function showScanningIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'phishing-scan-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;
  indicator.innerHTML = '🔍 Scanning inbox for phishing...';
  document.body.appendChild(indicator);
}

// Show phishing alert
function showPhishingAlert(result) {
  const existing = document.getElementById('phishing-scan-indicator');
  if (existing) existing.remove();
  
  const alert = document.createElement('div');
  alert.id = 'phishing-scan-indicator';
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
  `;
  alert.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;">
      <span>WARNING: Phishing Detected!</span>
      <button id="dismiss-alert" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: 10px;">&times;</button>
    </div>
    <div style="font-size: 12px;">
      Found ${result.phishingCount} suspicious email(s) out of ${result.totalScanned} scanned.
      <br><br>
      <strong>Click the extension icon in your toolbar to see details</strong>
    </div>
  `;
  
  document.body.appendChild(alert);
  
  // Auto-hide after 15 seconds
  const autoHideTimeout = setTimeout(() => {
    alert.style.transition = 'opacity 0.5s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 500);
  }, 15000);
  
  // Manual dismiss button
  const dismissBtn = alert.querySelector('#dismiss-alert');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      clearTimeout(autoHideTimeout);
      alert.style.transition = 'opacity 0.3s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 300);
    });
  }
}

// Show safe indicator
function showSafeIndicator() {
  const existing = document.getElementById('phishing-scan-indicator');
  if (existing) existing.remove();
  
  const indicator = document.createElement('div');
  indicator.id = 'phishing-scan-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  indicator.innerHTML = '✅ No phishing detected in inbox';
  document.body.appendChild(indicator);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    indicator.style.transition = 'opacity 0.5s';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 500);
  }, 5000);
}

// Initial scan when content script loads
if (isInboxView()) {
  // Wait for Gmail to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performAutoScan);
  } else {
    performAutoScan();
  }
}

// Listen for navigation changes in Gmail (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isInboxView() && !isScanning) {
      performAutoScan();
    }
  }
}).observe(document, { subtree: true, childList: true });
