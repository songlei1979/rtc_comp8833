# 🎥 WebRTC Video Chat Application

A real-time peer-to-peer video chat application built with React and WebRTC technology. This application enables seamless video communication between two users through direct browser-to-browser connections.

## ✨ Features

- **Real-time Video Chat**: Direct peer-to-peer video communication using WebRTC
- **Audio & Video Support**: Full duplex audio and video streaming
- **Cross-Platform**: Works on desktop and mobile browsers
- **Secure Context Handling**: Intelligent error handling for media device access
- **Simple UI**: Clean and intuitive user interface
- **Network Flexibility**: Supports both localhost and network access

## 🏗️ Architecture

The application consists of two main components:

- **Frontend**: React application handling the user interface and WebRTC peer connections
- **Signaling Server**: Node.js WebSocket server facilitating the initial connection handshake

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Browser A     │◄─────────────────►│ Signaling Server│
│                 │                  │  (Socket.io)    │
└─────────────────┘                  └─────────────────┘
         │                                    ▲
         │                                    │
         │          WebRTC P2P               │
         │         Direct Connection          │
         ▼                                    │
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Browser B     │◄─────────────────►│                 │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Modern web browser** with WebRTC support
- **Camera and microphone** permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webrtc-video-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the signaling server**
   ```bash
   # In a separate terminal window
   cd server
   node index.js
   ```
   The signaling server will start on `http://localhost:5001`

4. **Start the React application**

   **For localhost access:**
   ```bash
   npm start
   ```
   Access the app at: `http://localhost:3000`

   **For network access (HTTPS required):**
   ```bash
   HTTPS=true npm start
   ```
   Access the app at: `https://your-ip-address:3000`

## 🔐 Security & HTTPS Mode

### Why HTTPS is Required

Modern browsers require a **secure context** (HTTPS) to access camera and microphone for security reasons. The only exception is `localhost`, which is treated as secure.

### When to Use HTTPS Mode

Use `HTTPS=true npm start` when:

- ✅ Testing across multiple devices on the same network
- ✅ Accessing via IP address (e.g., `172.25.1.129:3000`)
- ✅ Testing on mobile devices
- ✅ Simulating production environment

### HTTPS Setup

1. **Start with HTTPS**
   ```bash
   HTTPS=true npm start
   ```

2. **Accept the security certificate**
   - Browser will show a security warning
   - Click "Advanced" → "Proceed to [your-ip] (unsafe)"
   - This is safe for development purposes

3. **Alternative: Use Chrome with insecure origins flag**
   ```bash
   # Windows
   chrome.exe --unsafely-treat-insecure-origin-as-secure=http://your-ip:3000 --user-data-dir=c:/temp/chrome-dev
   
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure=http://your-ip:3000 --user-data-dir=/tmp/chrome-dev
   
   # Linux
   google-chrome --unsafely-treat-insecure-origin-as-secure=http://your-ip:3000 --user-data-dir=/tmp/chrome-dev
   ```

## 📱 Usage

1. **Start the application** using the appropriate mode (HTTP for localhost, HTTPS for network)

2. **Grant permissions** when prompted for camera and microphone access

3. **Enter your name** in the input field

4. **Click "Join Call"** to initiate the connection

5. **Share the URL** with another user to start the video chat

6. **Enjoy real-time video communication!**

## 🛠️ Configuration

### Signaling Server Configuration

Update the WebSocket server URL in `src/components/VideoChat.js`:

```javascript
const socket = io('http://your-signaling-server:5001');
```

### STUN Server Configuration

The application uses Google's public STUN server by default. You can modify this in the WebRTC configuration:

```javascript
const peer = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add more STUN/TURN servers as needed
  ]
});
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Media devices require secure context"** | Use `HTTPS=true npm start` or access via `localhost` |
| **Camera/microphone not working** | Check browser permissions and device availability |
| **Connection fails** | Ensure signaling server is running and firewall allows connections |
| **No video from remote user** | Check network connectivity and NAT traversal |

### Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 58+ | ✅ Full support |
| Firefox | 52+ | ✅ Full support |
| Safari | 12+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |

### Network Requirements

- **WebRTC**: Requires modern browser support
- **Ports**: Ensure port 5001 is accessible for signaling
- **Firewall**: May need TURN server for restrictive networks
- **NAT**: Works with most home routers, corporate networks may need configuration

## 📁 Project Structure

```
webrtc-video-chat/
├── public/
│   ├── index.html          # Main HTML template
│   └── manifest.json       # PWA configuration
├── server/
│   └── index.js           # WebSocket signaling server
├── src/
│   ├── components/
│   │   ├── VideoChat.js   # Main video chat component
│   │   └── rtc.js         # RTC wrapper component
│   ├── App.js             # Main application component
│   ├── App.css            # Application styles
│   └── index.js           # Application entry point
├── package.json           # Project dependencies
└── README.md              # This file
```

## 🔧 Development

### Adding Features

The application is designed to be easily extensible:

- **Screen sharing**: Add `getDisplayMedia()` support
- **Chat messages**: Implement data channels
- **Multiple users**: Extend signaling for group calls
- **Recording**: Add MediaRecorder API integration

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Development Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy signaling server**
   ```bash
   # Use PM2 or similar process manager
   npm install -g pm2
   pm2 start server/index.js --name "video-chat-signaling"
   ```

3. **Serve the built files** using your preferred web server

### Production Considerations

- **HTTPS Certificate**: Use proper SSL certificates (Let's Encrypt, etc.)
- **TURN Server**: Set up TURN server for NAT traversal
- **Load Balancing**: Scale signaling servers for multiple users
- **Monitoring**: Add logging and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebRTC Community** for the excellent documentation and examples
- **Socket.io** for reliable WebSocket communication
- **React Team** for the amazing framework
- **Google** for providing free STUN servers

## 📚 Additional Resources

- [WebRTC Documentation](https://webrtc.org/)
- [Socket.io Documentation](https://socket.io/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

**Made with ❤️ using WebRTC, React, and Socket.io**
