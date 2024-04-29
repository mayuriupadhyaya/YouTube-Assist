# YouTube Assit - Chatbot for YouTube on your browser

YouTube Assit is a Chrome extension AI Chatbot for YouTube videos, built with TypeScript and JavaScript and powered by Gemini 1.5 pro. It allows you to chat with an AI assistant while watching YouTube videos. You can ask the chatbot any question about the video, and it will respond with reference to the information contained within the video transcript.


## Features

- Chat with Google's Gemini 1.5 Pro in a pop-up window on any YouTube video page
- Runs entirely inside the browser
- Simple chat interface inspired by instant messaging apps.
- Use any prompt
- Works on very long videos

### Installation

Coming soon on Chrome Web Store.
Please see **Build** section below.


## Build

- After cloning this repo, simply run:
```npm install```
- Then build with:
```npm run build```
- Open Chrome and go to `chrome://extensions`
- Enable developer mode by toggling the switch on the top right corner
- Click on `Load unpacked` and select the "dist" folder to load the extension


## Usage

To use YouTube Assist, follow these steps:
- Go to any YouTube video page
- On the top right of the browser window, open the Extensions menu click on the gemini icon (can also pin it for convenience)
- A pop-up window will appear with a chat interface
- Type your message in the input box and click on the send button
- The assistant will reply to your message and start a conversation with you


## Future Work

- Coming soon on Chrome Web Store
- Support for other browsers
- Speech-to-text for videos with captions
- Support for more LLM providers
- Error handling
- Adjust UI
- Bug fixing and code optimization
- Continue improving my web development skills
- Appreciate any feedback or suggestions!


## References used

- LangChain.js Documentation
- Get the view count of YouTube Video (without api key) and title and anything else (https://dev.to/wimdenherder/get-the-view-count-of-youtube-video-without-api-key-3gp0)
