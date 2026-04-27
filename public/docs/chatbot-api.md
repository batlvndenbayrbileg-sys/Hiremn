# hire.mn Chatbot API Documentation

## Overview

The hire.mn chatbot widget provides a JavaScript API that allows you to control the chatbot programmatically from your website. This is useful for triggering AI analysis when users click buttons on report pages.

## Installation

Add the embed script to your page:

```html
<script src="https://your-chatbot-domain.vercel.app/embed.js"></script>
```

## API Reference

### `window.HireMnChat`

The global `HireMnChat` object is available after the embed script loads.

---

### `HireMnChat.open()`

Opens the chatbot widget.

```javascript
window.HireMnChat.open();
```

---

### `HireMnChat.close()`

Closes the chatbot widget.

```javascript
window.HireMnChat.close();
```

---

### `HireMnChat.isOpen()`

Returns `true` if the chatbot is currently open.

```javascript
if (window.HireMnChat.isOpen()) {
  console.log("Chatbot is open");
}
```

---

### `HireMnChat.sendMessage(message)`

Sends a message to the chatbot as if the user typed it.

```javascript
window.HireMnChat.sendMessage("Миний тестийн үр дүнг тайлбарлана уу");
```

---

### `HireMnChat.openWithAnalysis(data)`

**This is the main method for AI analysis.** Opens the chatbot and sends report data for AI analysis.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportTitle` | string | No | The name/title of the report or test |
| `reportData` | object | No | The raw report data/content |
| `userInfo` | object | No | User information (name, email, etc.) |
| `analysisResults` | object | No | Pre-computed analysis results |
| `prompt` | string | No | Custom prompt for the AI (default: "Миний тестийн үр дүнг задлан шинжилж, надад зөвлөгөө өгнө үү.") |

#### Example

```javascript
// When user clicks "AI analysis хийх" button
document.getElementById('ai-analysis-btn').addEventListener('click', function() {
  window.HireMnChat.openWithAnalysis({
    reportTitle: "Багийн дүр тодорхойлох тест",
    
    reportData: {
      testId: "team-role-test",
      completedAt: "2024-01-15T10:30:00Z",
      answers: [
        { questionId: 1, answer: "A" },
        { questionId: 2, answer: "C" },
        // ... more answers
      ]
    },
    
    userInfo: {
      name: "Батболд",
      email: "batbold@example.com",
      userId: "user-123"
    },
    
    analysisResults: {
      "Удирдагч (Leader)": 85,
      "Бүтээлч (Creative)": 72,
      "Гүйцэтгэгч (Implementer)": 65,
      "Шинжээч (Analyst)": 58,
      "Зохицуулагч (Coordinator)": 45
    },
    
    prompt: "Миний багийн дүрийн тестийн үр дүнг дэлгэрэнгүй тайлбарлаж, ажлын байранд хэрхэн ашиглах талаар зөвлөгөө өгнө үү."
  });
});
```

---

## Complete Integration Example

### HTML Button

```html
<button id="ai-analysis-btn" class="btn btn-primary">
  🤖 AI analysis хийх
</button>
```

### JavaScript

```javascript
// Wait for the chatbot script to load
function initChatbotAnalysis() {
  const analysisBtn = document.getElementById('ai-analysis-btn');
  
  if (!analysisBtn) return;
  
  analysisBtn.addEventListener('click', function() {
    // Get your report data from your page/state
    const reportData = getReportData(); // Your function to get report data
    const userInfo = getCurrentUser();   // Your function to get user info
    const results = getTestResults();    // Your function to get test results
    
    // Check if HireMnChat is available
    if (typeof window.HireMnChat === 'undefined') {
      console.error('Chatbot not loaded yet');
      alert('Chatbot ачаалагдаж байна, түр хүлээнэ үү...');
      return;
    }
    
    // Trigger AI analysis
    window.HireMnChat.openWithAnalysis({
      reportTitle: document.querySelector('.report-title')?.textContent || 'Тестийн тайлан',
      reportData: reportData,
      userInfo: userInfo,
      analysisResults: results,
      prompt: "Энэ тестийн үр дүнг задлан шинжилж, надад дэлгэрэнгүй зөвлөгөө өгнө үү."
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbotAnalysis);
} else {
  initChatbotAnalysis();
}
```

---

## React/Next.js Integration

```tsx
import { useEffect } from 'react';

// Declare global type
declare global {
  interface Window {
    HireMnChat?: {
      open: () => void;
      close: () => void;
      isOpen: () => boolean;
      sendMessage: (message: string) => void;
      openWithAnalysis: (data: {
        reportTitle?: string;
        reportData?: Record<string, any>;
        userInfo?: Record<string, any>;
        analysisResults?: Record<string, any>;
        prompt?: string;
      }) => void;
    };
  }
}

export function ReportPage({ reportData, user, results }) {
  const handleAIAnalysis = () => {
    if (!window.HireMnChat) {
      alert('Chatbot ачаалагдаж байна...');
      return;
    }
    
    window.HireMnChat.openWithAnalysis({
      reportTitle: reportData.title,
      reportData: reportData,
      userInfo: {
        name: user.name,
        email: user.email,
      },
      analysisResults: results,
    });
  };
  
  return (
    <div>
      <h1>{reportData.title}</h1>
      {/* ... report content ... */}
      
      <button 
        onClick={handleAIAnalysis}
        className="ai-analysis-btn"
      >
        🤖 AI analysis хийх
      </button>
    </div>
  );
}
```

---

## Notes

1. **Data Privacy**: The data you pass to the chatbot is processed by the AI. Make sure you have user consent.

2. **Loading State**: The chatbot script loads asynchronously. Always check if `window.HireMnChat` exists before calling methods.

3. **Mobile Support**: The chatbot is responsive and works on mobile devices.

4. **Customization**: Contact the development team if you need custom prompts or analysis formats.

---

## Support

For technical support or questions, contact the hire.mn development team.
