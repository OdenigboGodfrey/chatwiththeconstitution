# Chat With The Constitution

A lightweight web-based chat application that allows users to ask questions about the Constitution and Electoral Act through a conversational interface. The frontend communicates with a NestJS + Mastra AI backend, which uses a Retrieval-Augmented Generation (RAG) agent to provide contextual legal responses.

## Features

* Simple chat interface
* Light and dark mode support
* In-memory chat history
* Context-aware conversations
* Integration with Mastra AI agents
* REST API-based communication

---

## Architecture

```text
┌─────────────────┐
│  HTML Frontend  │
└────────┬────────┘
         │
         │ POST /chat/with-history
         ▼
┌─────────────────┐
│ NestJS Backend  │
│  Chat Service   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mastra Agent    │
│ RAG Retrieval   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM Provider    │
└─────────────────┘
```

---

## Frontend

The frontend is a standalone HTML application that:

* Displays a conversational chat interface
* Maintains chat history in memory
* Sends messages to the backend API
* Displays AI-generated responses

### API Endpoint

```javascript
POST /chat/with-history
```

### Request Payload

```json
{
  "text": "What is the minimum age to vote?",
  "history": [
    {
      "role": "user",
      "content": "Is there any law mandating real time transmission of election result when voting begins?"
    },
    {
      "role": "bot",
      "content": "According to the Electoral Act (2026),..."
    }
  ]
}
```

### Response

```json
{
  "status": true,
  "message": "Chat processed successfully",
  "data": "According to the Constitution..."
}
```

---

## Backend

### Technology Stack

* NestJS
* Mastra AI
* TypeScript
* OpenAI Compatible Models (could be via Nvidia NIM or Ollama models running locally)
* RAG (Retrieval Augmented Generation)

### Chat Service

The backend provides two methods:

| Method                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `handleChat()`            | Processes a single standalone message         |
| `handleChatWithHistory()` | Processes a message with conversation history |

---

## How Conversation History Works

When a user sends a message:

1. Existing chat history is retrieved from the browser memory.
2. History is converted into Mastra-compatible message format.
3. The latest user message is appended.
4. The complete message list is sent to the agent.
5. The agent generates a contextual response.

Example message stack:

```typescript
[
  {
    role: "user",
    content: "Is there any law mandating real time transmission of election result when voting begins?"
  },
  {
    role: "assistant",
    content: "According to the Electoral Act (2026),..."
  },
  {
    role: "user",
    content: "What is the age requirement to vote?"
  }
]
```

---

## Retry Mechanism

To improve reliability, the backend retries AI generation up to three times before returning an error.

```typescript
const MAX_RETRIES = 3;
```

This helps handle:

* Temporary LLM failures
* Network interruptions
* Rate limit issues
* Empty model responses

---

## Environment Variables

Create a `.env` file using the example env from the project:

Note: There's support for both Ollama or an OpenAI Compatible Endpoints.
To run fully local use:
```env
USE_OLLAMA=true
EMBEDDING_MODEL="all-minilm"
```
To run with NIM (OpenAi Compatible)
```env
USE_OLLAMA=false
EMBEDDING_MODEL="nvidia/nv-embedqa-e5-v5"
```

---

## Running The Backend

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run start:dev
```

Run production build:

```bash
npm run build
npm run start:prod
```

---

## Running The Frontend

### Option 1: Open Directly

Open the HTML file in a browser.

When opened locally:

```text
file://
```


### Option 2: Serve Via Web Server

```bash
npx serve .
```

or

```bash
python -m http.server 8080
```

Then access:

```text
http://localhost:8080
```

---

## Example Usage

### User

```text
Is there any law mandating real time transmission of election result when voting begins
```

### Assistant

```text
According to the Electoral Act (2026),...
```

### Follow-up Question

```text
What is the minimum age requirement to vote?
```

The previous response remains in context, allowing the AI to understand the follow-up question without requiring the user to restate the topic.

---

## Error Handling

The application handles:

* Empty messages
* Failed API requests
* AI generation failures
* Invalid responses
* Network errors

Errors are displayed as toast notifications and system messages in the chat interface.

---

## Project Structure

```text
project/
│
├── static/
│   ├── ui/index.html
│   └── documents/
│
├── src/
│   ├── chat/      
│   │
│   ├── shared/
│   │   ├── dtos/
│   │   ├── enums/
│   │   └── helpers/
│   │
│   └── main.ts
│
└── README.md
```

---

## Future Enhancements

* Persistent conversation storage
* Conversation export
* Streaming responses
* Real-time updates via WebSockets
