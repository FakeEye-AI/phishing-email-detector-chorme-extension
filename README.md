# Phishing Email Detector Chrome Extension

A powerful Chrome extension that automatically scans your Gmail inbox to detect phishing and suspicious emails in real-time.

## Features

- **Auto-Scan on Load**: Automatically scans your inbox when you open Gmail
- **Real-time Alerts**: Shows notifications when phishing emails are detected
- **Risk Assessment**: Categorizes emails as High, Medium, or Low risk
- **Smart Detection**: Identifies multiple phishing indicators including:
  - Urgent/threatening language
  - Money and prize scams
  - Suspicious sender impersonation
  - Action demand patterns
  - Excessive punctuation and caps
- **Detailed Reports**: View comprehensive scan results with flagged reasons
- **Visual Dashboard**: See statistics and risk percentages at a glance

## Installation

### Step 1: Create Extension Icons

Before installing, you need to create icon files:

1. Open `generate-icons.html` in your browser
2. Right-click each generated icon and save to the `icons/` folder:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### Step 2: Load Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`

2. **Enable Developer Mode** (toggle in the top-right corner)

3. **Click "Load unpacked"**

4. **Select the `Email Analyzer` folder** (this folder with all the extension files)

5. The extension should now appear in your Chrome toolbar!

### Alternative: Create Icons Manually

Before installing, you need to create icon files. Use any tool to create three PNG files:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

You can create simple icons or use online tools like:
- https://www.favicon-generator.org/
- https://www.canva.com/

## How to Use

### Automatic Mode (Default)

1. **Open Gmail inbox** (https://mail.google.com)

2. **Wait 2 seconds** - The extension automatically scans your inbox

3. **View notifications**:
   - Red alert if phishing emails detected
   - Green checkmark if inbox is safe

4. **Click the extension icon** to see detailed scan results

### Manual Re-scan

1. **Click the extension icon** in your Chrome toolbar

2. **Click "Re-scan Inbox"** button to scan again

3. **View detailed results** including:
   - Total emails scanned
   - Number of suspicious emails
   - Risk percentage
   - Individual email cards with risk levels
   - Specific phishing indicators for each email

## Technical Details

### Files Structure

```
Email Analyzer/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── content.js            # Gmail page interaction
├── content.css           # Content script styles
├── background.js         # Background service worker
├── README.md             # This file
└── icons/               # Extension icons (create these)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### How It Works

1. **Auto-Scan on Load**: When Gmail loads, the extension automatically scans the inbox
2. **Content Script** (`content.js`): Runs on Gmail pages and extracts email subjects and preview text
3. **Phishing Detection Engine**: Analyzes emails using pattern matching and keyword detection
4. **Popup Interface** (`popup.html/js`): Displays scan results and detailed reports
5. **Background Worker** (`background.js`): Handles extension lifecycle and storage
6. **Real-time Notifications**: Shows alerts directly in Gmail when threats are detected

### Phishing Detection Indicators

#### Urgent Language Detection
- "urgent", "immediate", "act now", "expire", "suspended"
- "verify", "confirm", "limited time", "update now"

#### Money/Prize Scams
- "prize", "winner", "claim", "lottery", "inheritance"
- "million", "refund", "tax", "payment"

#### Threat Language
- "suspend", "lock", "security alert", "warning"
- "compromised", "unauthorized", "blocked"

#### Action Demands
- "click here", "verify now", "update", "confirm identity"
- "reset password", "download"

#### Sender Impersonation
- Detects fake sender addresses mimicking:
  - PayPal, Amazon, Microsoft, Apple, Google
  - Banks, IRS, shipping companies (FedEx, UPS, DHL)

#### Visual Red Flags
- Excessive punctuation (multiple exclamation marks)
- ALL CAPS words
- Suspicious formatting patterns

## Troubleshooting

### Extension Not Working?

1. **Refresh Gmail**: After loading the extension, refresh your Gmail tab
2. **Check Console**: Open Chrome DevTools (F12) and check for errors
3. **Verify Permissions**: Make sure the extension has permission to access Gmail
4. **Reload Extension**: Go to `chrome://extensions/` and click the reload button

### No Email Content Detected?

- Make sure you've opened an email (not just the inbox)
- Gmail's layout may have changed - the extension uses DOM selectors that might need updates
- Try opening a different email

### Analysis Not Accurate?

- The analysis uses pattern matching and keyword detection
- For better results, ensure emails have clear language
- The sentiment analysis is basic - complex emotions may not be detected accurately

## Privacy & Security

- **No Data Collection**: This extension does NOT send any data to external servers
- **Local Processing**: All analysis happens locally in your browser
- **No Storage of Email Content**: Email content is analyzed in real-time and not stored permanently
- **Cached Results**: Scan results are cached for 1 minute only for performance
- **Gmail Only**: Extension only works on Gmail (mail.google.com)
- **No Personal Information**: The extension never accesses or stores your login credentials
- **Open Source**: You can review all code to verify security and privacy

## Future Enhancements

Possible features to add:
- [ ] AI-powered phishing detection using ML models (see API integration guide below)
- [ ] Support for other email providers (Outlook, Yahoo, etc.)
- [ ] Custom phishing pattern configuration
- [ ] Whitelist/blacklist sender management
- [ ] Export scan reports to CSV/PDF
- [ ] Historical scan data and trends
- [ ] Integration with threat intelligence databases
- [ ] Browser notification system

## API Integration for AI-Powered Detection

The extension is ready for REST API integration. You can connect it to:

- **OpenAI GPT** for advanced NLP-based phishing detection
- **Custom ML Models** hosted on your server
- **Google Cloud Natural Language API**
- **Azure Cognitive Services**

To enable API integration:
1. Update `manifest.json` with your API domain in `host_permissions`
2. Add API endpoint and key configuration
3. The extension will call your API for each email analysis
4. Falls back to rule-based detection if API is unavailable

## Development

To modify the extension:

1. Edit the source files as needed
2. Go to `chrome://extensions/`
3. Click the reload button for the extension
4. Refresh your Gmail page
5. Test your changes

### Key Technologies

- **JavaScript**: Core logic and analysis
- **Chrome Extension Manifest V3**: Latest extension format
- **DOM Manipulation**: Extract content from Gmail's HTML
- **Regular Expressions**: Pattern matching for dates, emails, phones, etc.

## License

This project is open source and available for personal and educational use.

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the console for error messages
3. Verify Gmail hasn't changed its layout (which may require selector updates)

---

**Happy Email Analyzing! 📧✨**
