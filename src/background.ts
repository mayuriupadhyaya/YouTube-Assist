import { ChatOpenAI, ChatOpenAICallOptions } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings  } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ConversationalRetrievalQAChain} from "langchain/chains";
import { InMemoryStore } from "langchain/storage/in_memory";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { BaseLanguageModelInterface, BaseLanguageModelCallOptions } from "langchain/base_language";
import { EmbeddingsInterface } from "langchain/embeddings/base";





var prevUrl = "";
//var url;
var caption = "";
var metadata = {}
var llm: BaseLanguageModelInterface<any, BaseLanguageModelCallOptions> | ChatOpenAI<ChatOpenAICallOptions>;
var embeddings: EmbeddingsInterface;
var chunkSize: number;
var vectorstore: MemoryVectorStore;
var memory: ConversationSummaryBufferMemory;
var qa: ConversationalRetrievalQAChain;
var chatHistory: { from: string; message: any; }[] = [];

function setLLM(model: string, apikey: string){
  if (model == "gpt-3.5-turbo" || model == "gpt-3.5-turbo-1106" || model == "gpt-3.5-turbo-16k" || model == "gpt-4" || model == "gpt-4-0613" || model == "gpt-4-1106-preview" || model == "gpt-4-32k" || model == "gpt-4-32k-0613"){
    llm = new ChatOpenAI({
      modelName:model, 
      temperature:0, 
      streaming:false, 
      openAIApiKey:apikey
    });

    embeddings = new OpenAIEmbeddings({
      openAIApiKey: apikey,
    });
    
    if (model == "gpt-3.5-turbo"){
      chunkSize = 4096;
    }
    if (model == "gpt-3.5-turbo-1106" || model == "gpt-3.5-turbo-16k"){
      chunkSize = 16384;
    }
    if (model == "gpt-4" || model == "gpt-4-0613"){
      chunkSize = 8192
    }
    if (model == "gpt-4-32k" || model == "gpt-4-32k-0613"){
      chunkSize = 32768;
    }
    if (model == "gpt-4-1106-preview"){
      chunkSize = 128000;
    }

  }
  if (model == "gemini-pro"){
    llm = new ChatGoogleGenerativeAI({
        modelName: model,
        apiKey: apikey,
        temperature: 0,
        maxOutputTokens: 2048,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
        ],
      });

    embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: apikey,
      stripNewLines: true
    });

    chunkSize = 32768;
  }

}


async function initialize(model: string, apikey: string){
  chatHistory = [];
  setLLM(model, apikey);
  //console.log("llm initialized")
  vectorstore = new MemoryVectorStore(embeddings);
  const docstore = new InMemoryStore();
  const retriever = new ParentDocumentRetriever({
    vectorstore,
    docstore,
    parentSplitter: new RecursiveCharacterTextSplitter({
      chunkOverlap: chunkSize/100,
      chunkSize: chunkSize,
    }),
    childSplitter: new RecursiveCharacterTextSplitter({
      chunkOverlap: chunkSize/10/100,
      chunkSize: chunkSize/10,
    }),
  });
  
  await retriever.addDocuments([new Document({ pageContent: caption, metadata: metadata })]);
  memory = new ConversationSummaryBufferMemory({llm:llm, memoryKey:"chat_history", returnMessages:true});
  qa = ConversationalRetrievalQAChain.fromLLM(llm,retriever, {memory:memory});
  //console.log("chain initialized")
}


async function onUrlChange(url: string) {
  //console.log("The url of the active tab is: " + url);
  const items = await chrome.storage.sync.get(["apikey", "model"]);
  const apikey = items.apikey || "";
  const model = items.model || "gpt-3.5-turbo";
  await initialize(model,apikey);
  //console.log("initialized bot")
  prevUrl = url;      
  return true;
}

async function query(message: string){
  //console.log(qa.retriever.getRelevantDocuments(message));
  chatHistory.push({from: "user", message: message});
  const result = await qa.call({question: message});
  chatHistory.push({from: "bot", message: result.text});
  return result.text;
}

// Listen for a message from popup.js
chrome.runtime.onMessage.addListener(async function(request, _sender, sendResponse) {
  switch (request.type) {
    case "load":
      //console.log("Received load request from popup.js");
      caption = request.caption;
      metadata = request.metadata;
      //console.log(caption);
      if (prevUrl != request.url){
        //console.log("start initializing")
        await onUrlChange(request.url);
      }
      chrome.runtime.sendMessage({type: "initializeChat", chatHistory: chatHistory})
      //console.log("load complete");
      break;
    case "query":
      //console.log("Received data message from popup.js");
      const reply = await query(request.message);
      //console.log(reply)
      chrome.runtime.sendMessage({type: "reply", result: reply})
      break;
    default:
      //console.log("Received unknown message from popup.js");
      sendResponse({error: "Invalid message type"});
  }
  return true;
  
});

