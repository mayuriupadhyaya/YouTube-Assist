function enableChat(){
    document.getElementById("input").disabled = false;
    document.getElementById("input").placeholder = "Type your message here";
    document.getElementById("button").disabled = false;
}
function disableChat(reason){
    document.getElementById("input").disabled = true;
    document.getElementById("input").placeholder = reason;
    document.getElementById("button").disabled = true;
}

var url;
var caption;
var metadata;

async function getCaptions(url){
  const response = await fetch(url);
  const html = await response.text();
  const ytInitialPlayerResponse = JSON.parse(html.split('ytInitialPlayerResponse = ')[1].split(`;var meta = document.createElement('meta')`)[0]);
  if (ytInitialPlayerResponse && ytInitialPlayerResponse.captions) {
    let captionTracks = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
    if (captionTracks.length > 0) {
      // Get the first caption track object
      let captionTrack = captionTracks[0];
      // Get the base URL of the caption track
      let baseUrl = captionTrack.baseUrl;
      // Fetch the caption track XML file
      await fetch(baseUrl)
        .then((response) => response.text())
        .then((xml) => {
          // Parse the XML file
          let parser = new DOMParser();
          let xmlDoc = parser.parseFromString(xml, "text/xml");
          // Get the text nodes from the XML file
          let textNodes = xmlDoc.getElementsByTagName("text");
          // Initialize an empty array to store the preprocessed captions
          let preprocessedCaptions = [
            "You are given this context which is the timestamped transcript of the video. Each line is formatted like this: (<timestamp>) <transcript segment>\n",
            "There are two types of questions the user may ask you:\n",
            "1. Summarization - Questions about the main or key points in the transcript. (Examples: Q: Summarize the video. A: <Summary of the video>, Q: What is this video about? A: <Main points of the video> )\n",
            "2. Information retrieval - Questions about the location or ideas of specific pieces of information or some text. Try to search the transcript for find what the user is asking for. (Examples: Q: What is X? A: <Summary of all information about X>, Q: At what point in the video is Y mentioned? A: Y is mentioned at <timestamp>., Q: When did the speaker mention Z? A: Z is mentioned at <timestamp> )",
            "Video Transcript:\n"
          ];
          for (let textNode of textNodes) {
            let start = textNode.getAttribute("start");
            // Convert the start attribute to a number
            let startNum = Number(start);
            // Check if the start attribute is a valid number
            if (!isNaN(startNum)) {
              // Convert the start attribute to a timestamp in mm:ss format
              let minutes = Math.floor(startNum / 60);
              let seconds = Math.floor(startNum % 60);
              let timestamp = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
              // Get the text content of the text node
              let text = textNode.textContent;
              // Replace any HTML entities with their actual characters
              let textDecoded = text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
              // Format the caption segment as (<timestamp>) <text>
              let captionSegment = `(${timestamp}) ${textDecoded}`;
              // Push the caption segment to the preprocessed captions array
              preprocessedCaptions.push(captionSegment);
            }
          }
          // Join the preprocessed captions array with newlines
          let preprocessedCaptionsString = preprocessedCaptions.join("\n");
          //console.log(preprocessedCaptionsString);
          
          // Send the preprocessed captions string to the background service worker 
          caption = preprocessedCaptionsString;

          metadata = {
            title: ytInitialPlayerResponse.videoDetails.title,
            channel: ytInitialPlayerResponse.videoDetails.author,
            viewCount: ytInitialPlayerResponse.videoDetails.viewCount,
            description: ytInitialPlayerResponse.videoDetails.shortDescription
          }

        })
        .catch((error) => {
          // Handle any errors
          console.error(error);
        });
    }
  }
}



chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse){
  switch (request.type) {
    case "initializeChat":
      //console.log("background is done",request)
      // Get the current history from the response
      var chat = document.getElementById("chat");
      if (request.chatHistory != undefined) {
        for (var i = 0; i < request.chatHistory.length; i++) {
          if (request.chatHistory[i].from == "user") {
            // Create a new div element for the user message
            var userDiv = document.createElement("div");

            // Set the class name and the inner text of the user div
            userDiv.className = "user";
            userDiv.innerText = request.chatHistory[i].message;

            // Append the user div to the chat container
            chat.appendChild(userDiv);
          } else {
            // Create a new div element for the bot message
            var botDiv = document.createElement("div");

            // Set the class name and the inner text of the bot div
            botDiv.className = "bot";
            botDiv.innerText = request.chatHistory[i].message;

            // Append the bot div to the chat container
            chat.appendChild(botDiv);
          }
        }
      }
      // Scroll to the bottom of the chat container
      chat.scrollTop = chat.scrollHeight;
      enableChat();
      
      //console.log("load complete")
      break;

    case "reply":
      //console.log("receieved answer", request.result)
      var chat = document.getElementById("chat");
      // Parse the response as JSON
      var ans = request.result;
      // Create a new div element for the Flask message
      var botDiv = document.createElement("div");
    
      // Set the class name and the inner text of the Flask div
      botDiv.className = "bot";
      botDiv.innerText = ans;

      // Append the Flask div to the chat container
      chat.appendChild(botDiv);

      // Scroll to the bottom of the chat container
      chat.scrollTop = chat.scrollHeight;
      enableChat();

      break;

    default:
      //console.log("Received unknown message from background.js");
      sendResponse({error: "Invalid message type"});
  }
  return true;
})
// Get the current tab URL and display it in the title
chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
    url = tabs[0].url;
    var isYoutubeVideo = url.startsWith("https://www.youtube.com/watch?v=");
    if (url.startsWith("https://www.youtube.com/shorts")){
      url = url.replace("shorts/", "watch?v=");
      isYoutubeVideo = true;
    }
    
    if (!isYoutubeVideo){
      disableChat("Current page is not a YouTube video.");
    }
    else{
      var apikey = document.getElementById("apikey-input").value  || "";
      var model = document.getElementById("model-input").value  || "gpt-3.5-turbo";
      chrome.storage.sync.get(["apikey", "model"], function(items) {
        // Set the vars with stored values or default values if not found
        apikey = items.apikey || "";
        model = items.model || "gpt-3.5-turbo";
        if (apikey == ""){
          document.getElementById("settings-button").click();
          alert("Please insert your API key.");
        }  
      });
      
      disableChat("Loading...");
      //console.log("send load request"); 
      await getCaptions(url);
      //console.log(caption)
      if (caption == ""){
        disableChat("Current video is not supported.");
      } 
      chrome.runtime.sendMessage({ type: "load", url: url, caption: caption, metadata: metadata })

      
    }

  });
  
  // Get the input field and the send button
  var input = document.getElementById("input");
  var button = document.getElementById("button");
  
  // Add a click event listener to the send button
  button.addEventListener("click", function() {
    // Get the text from the input field
    var text = input.value;
    if (text != ''){
      // Clear the input field
      input.value = "";
    
      // Create a new div element for the user message
      var userDiv = document.createElement("div");
    
      // Set the class name and the inner text of the user div
      userDiv.className = "user";
      userDiv.innerText = text;
    
      // Append the user div to the chat container
      var chat = document.getElementById("chat");
      chat.appendChild(userDiv);
    
      // Scroll to the bottom of the chat container
      chat.scrollTop = chat.scrollHeight;
      disableChat("Loading...");
      // Send a POST request to the bot backend with only the text as data
      chrome.runtime.sendMessage({type:"query", message: text});
      
      
    }
    
  });

// Get the tab buttons and tab contents
var tabButtons = document.getElementsByClassName("tab-button");
var tabContents = document.getElementsByClassName("tab-content");

// Add a click event listener to each tab button
for (let i = 0; i < tabButtons.length; i++) {
  tabButtons[i].addEventListener("click", function() {
    // Remove the active class from all tab buttons and tab contents
    for (let j = 0; j < tabButtons.length; j++) {
      tabButtons[j].classList.remove("active");
      tabContents[j].classList.remove("active");
    }
    
    // Add the active class to the clicked tab button and its corresponding tab content
    this.classList.add("active");
    tabContents[i].classList.add("active");
  });
}

// Get the settings input fields and save button
var apikeyInput = document.getElementById("apikey-input");
var modelInput = document.getElementById("model-input");
var saveButton = document.getElementById("save-button");


// Load the user values from chrome storage when popup is opened or reloaded
chrome.storage.sync.get(["apikey", "model"], function(items) {
  // Set the input fields with stored values or default values if not found
  apikeyInput.value = items.apikey || "";
  modelInput.value = items.model || "gpt-3.5-turbo";
  // Disable or enable chat tab based on apikey value
  var input = document.getElementById("input");
  var button = document.getElementById("button");
  if (items.apikey) {
    input.disabled = false;
    button.disabled = false;
  } else {
    input.disabled = true;
    button.disabled = true;
  }
});


saveButton.addEventListener("click", function() {
  // Get the input values from settings fields
  var apikeyValue = apikeyInput.value;
  var modelValue = modelInput.value;
  // Store them in chrome storage with keys "apikey", "model", "server" and "whisper"
  chrome.storage.sync.set({"apikey": apikeyValue, "model": modelValue}, async function() {
    if (apikeyValue == ""){
      alert("Please insert your API key.");
      document.getElementById("settings-button").click();
    }else{
      document.getElementById("chat-button").click();
      // Show a confirmation message
      alert("Settings saved!");
      disableChat("Loading...");
      // Reload the chatbot in app.py
      chat.innerHTML = "";
      //console.log("send load request");
      await getCaptions(url);
      chrome.runtime.sendMessage({ type: "load", url: url, caption: caption, metadata: metadata })
      //console.log("Reloaded");
    }
  });
  // Disable or enable chat tab based on apikey value
  var input = document.getElementById("input");
  var button = document.getElementById("button");
  if (apikeyValue) {
    input.disabled = false;
    button.disabled = false;
  } else {
    input.disabled = true;
    button.disabled = true;
  }
});

