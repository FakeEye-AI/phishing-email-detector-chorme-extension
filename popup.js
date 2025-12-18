document.addEventListener('DOMContentLoaded', function() {
  const scanInboxBtn = document.getElementById('scanInboxBtn');
  const inboxResultsDiv = document.getElementById('inboxResults');
  const statusDiv = document.getElementById('status');

  scanInboxBtn.addEventListener('click', scanInbox);

  // Check if we're on Gmail and load auto-scan results
  checkGmailTab();
  loadAutoScanResults();

  async function loadAutoScanResults() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url && tab.url.includes('mail.google.com')) {
        const results = await chrome.tabs.sendMessage(tab.id, { action: 'getAutoScanResults' });
        
        if (results && results.success && !results.error) {
          const scanTime = results.timestamp ? new Date(results.timestamp).toLocaleTimeString() : 'Unknown';
          displayInboxResults(results);
          inboxResultsDiv.classList.remove('hidden');
          statusDiv.innerHTML = `<p style="color: #28a745;">✓ Auto-scanned at ${scanTime}</p>`;
        }
      }
    } catch (error) {
      // No auto-scan results available yet
      console.log('No auto-scan results available');
    }
  }

  async function checkGmailTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes('mail.google.com')) {
      statusDiv.innerHTML = '<p style="color: #28a745;">✓ Gmail detected. Ready to scan!</p>';
      scanInboxBtn.disabled = false;
    } else {
      statusDiv.innerHTML = '<p style="color: #dc3545;">⚠ Please open Gmail inbox first</p>';
      scanInboxBtn.disabled = true;
    }
  }

  async function scanInbox() {
    scanInboxBtn.disabled = true;
    scanInboxBtn.textContent = 'Scanning...';
    inboxResultsDiv.classList.add('hidden');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.tabs.sendMessage(tab.id, { action: 'scanInbox' });
      
      if (results.error) {
        throw new Error(results.error);
      }

      displayInboxResults(results);
      inboxResultsDiv.classList.remove('hidden');
      statusDiv.innerHTML = `<p style="color: #28a745;">✓ Scanned ${results.totalScanned} emails!</p>`;
      
    } catch (error) {
      console.error('Scan error:', error);
      statusDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    } finally {
      scanInboxBtn.disabled = false;
      scanInboxBtn.textContent = 'Re-scan Inbox';
    }
  }

  function displayInboxResults(data) {
    // Summary
    const phishingPercent = data.totalScanned > 0 ? Math.round((data.phishingCount / data.totalScanned) * 100) : 0;
    document.getElementById('inboxSummary').innerHTML = `
      <div class="summary-card">
        <h3>Scan Summary</h3>
        <div class="summary-stats">
          <div class="stat">
            <div class="stat-value">${data.totalScanned}</div>
            <div class="stat-label">Scanned</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.phishingCount}</div>
            <div class="stat-label">Suspicious</div>
          </div>
          <div class="stat">
            <div class="stat-value">${phishingPercent}%</div>
            <div class="stat-label">Risk Rate</div>
          </div>
        </div>
      </div>
    `;

    // Email list
    const suspiciousEmails = data.emails.filter(e => e.phishing.isSuspicious);
    const safeEmails = data.emails.filter(e => !e.phishing.isSuspicious);
    
    let emailsHtml = '';
    
    if (suspiciousEmails.length > 0) {
      emailsHtml += '<h3 style="color: #dc3545; margin-top: 15px;">⚠️ Suspicious Emails</h3>';
      suspiciousEmails.forEach(email => {
        emailsHtml += generateEmailCard(email);
      });
    }
    
    if (safeEmails.length > 0 && safeEmails.length <= 10) {
      emailsHtml += '<h3 style="color: #28a745; margin-top: 15px;">✓ Safe Emails</h3>';
      safeEmails.slice(0, 5).forEach(email => {
        emailsHtml += generateEmailCard(email);
      });
    }

    document.getElementById('inboxEmails').innerHTML = emailsHtml || '<div class="empty-state">No emails to display</div>';
  }

  function generateEmailCard(email) {
    const riskClass = `phishing-${email.phishing.riskLevel.toLowerCase()}`;
    const riskBadgeClass = `risk-${email.phishing.riskLevel.toLowerCase()}`;
    
    let flagsHtml = '';
    if (email.phishing.flags.length > 0) {
      flagsHtml = '<div class="phishing-flags">' + 
        email.phishing.flags.map(flag => `<div>${flag}</div>`).join('') + 
        '</div>';
    }

    return `
      <div class="email-card ${riskClass}">
        <div class="email-subject">${email.subject}</div>
        <div class="email-sender">From: ${email.sender}</div>
        <div class="email-preview">${email.preview || 'No preview'}</div>
        <span class="risk-badge ${riskBadgeClass}">${email.phishing.riskLevel} Risk (Score: ${email.phishing.score})</span>
        ${flagsHtml}
      </div>
    `;
  }

});
