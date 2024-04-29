# Conversator - Mini YouTube Chatbot in your browser

Conversator is a lightweight Chrome extension AI Chatbot for YouTube videos, built with TypeScript and JavaScript. It allows you to chat with an AI assistant while watching YouTube videos. You can ask the chatbot any question about the video, and it will respond with reference to the information contained within the video transcript.


## Features

- Chat with any GPT model or Google's Gemini Pro in a pop-up window on any YouTube video page, only requires an API key
- Runs entirely inside the browser, no backend needed
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

To use Conversator, follow these steps:
- In the Settings tab, Choose an AI model and enter your API Key, then click "Save"
- Go to any YouTube video page
- On the top right of the browser window, open the Extensions menu click on the red icon with a white speech bubble at the middle of it (can also pin it for convenience)
- A pop-up window will appear with a chat interface
- Type your message in the input box and click on the send button
- The assistant will reply to your message and start a conversation with you

## Known Issues

- (Gemini Pro) Sometimes the AI refuses to answer the question when asked about something which appears rarely in the video transcript. (E.g. I don't have enough information from the context provided to answer the question.)
- As of right now I still don't have access to an OpenAI API key, so I have not tested using the extension with GPT-4 or GPT-3.5 Turbo (pls tell me if it works lmao)
- Bug reports are greatly appreciated!

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
- pls help


## References used

- LangChain.js Documentation
- Get the view count of YouTube Video (without api key) and title and anything else (https://dev.to/wimdenherder/get-the-view-count-of-youtube-video-without-api-key-3gp0)
