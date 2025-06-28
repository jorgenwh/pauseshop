# API Integration Guide: Session Management

This guide provides instructions for integrating the new session management functionality into the PauseShop Chrome Extension and website.

## Overview

The session management feature allows the extension to initiate an analysis session, storing the screenshot on the server. The website can then retrieve this screenshot using a unique session ID, which is passed via a URL parameter.

---

## 1. Chrome Extension Implementation

The extension is responsible for initiating the session and opening the product page on the website.

### Step 1: Generate a Session ID

Before sending the analysis request, the extension must generate a unique session ID. A UUID (v4) is a good choice for this.

```javascript
// Example using the 'uuid' library or a similar method
import { v4 as uuidv4 } from 'uuid';

const sessionId = uuidv4(); 
```

### Step 2: Send the Analysis Request

When the user pauses a video, send the analysis request to the `/analyze/stream` endpoint. The request body must now include the `sessionId`.

```javascript
// Example fetch request from the extension's background script
const response = await fetch('https://your-server.com/analyze/stream', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        image: 'data:image/png;base64,...', // The base64 screenshot
        sessionId: sessionId // The generated session ID
    })
});
```

### Step 3: Open the Product Page

When the user clicks on a product thumbnail in the extension's sidebar, open the product page on the website. The `sessionId` must be passed as a URL query parameter.

```javascript
// Example URL to open
const productUrl = `https://pauseshop.net/product-details?session=${sessionId}`;
window.open(productUrl, '_blank');
```

### Step 4: End the Session (Optional)

When the user resumes the video, send a request to the `/session/:sessionId/end` endpoint to clear the session data from the server.

```javascript
// Example fetch request to end the session
await fetch(`https://your-server.com/session/${sessionId}/end`, {
    method: 'POST'
});
```

---

## 2. Website Implementation

The website is responsible for retrieving the screenshot from the server using the session ID from the URL.

### Step 1: Get the Session ID from the URL

On the product details page, extract the `sessionId` from the URL query parameters.

```javascript
// Example in a React component
import { useSearchParams } from 'react-router-dom';

const ProductDetailsPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');

    // ...
};
```

### Step 2: Fetch the Screenshot from the Server

Use the `sessionId` to make a request to the `/session/:sessionId/screenshot` endpoint.

```javascript
// Example fetch request from the website's frontend
useEffect(() => {
    if (sessionId) {
        fetch(`https://your-server.com/session/${sessionId}/screenshot`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // The screenshot is in data.screenshot
                    const screenshotImage = document.getElementById('screenshot');
                    screenshotImage.src = data.screenshot;
                }
            });
    }
}, [sessionId]);
```

The server will respond with a JSON object containing the base64 data URL of the screenshot:

```json
{
    "success": true,
    "screenshot": "data:image/png;base64,..."
}
```

The website can then use this data URL directly as the `src` for an `<img>` tag.
