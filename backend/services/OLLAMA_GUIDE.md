# Ollama Service - Enhanced Features Guide

## What's New

Your Ollama service now includes these powerful improvements based on the official Ollama documentation:

### 1. **JSON Format Enforcement** ✨
Guarantees valid JSON responses without manual parsing:

```javascript
// Old way - manual JSON extraction
const response = await generate(prompt);
const jsonMatch = response.match(/\{[\s\S]*\}/);

// New way - automatic JSON
const response = await generate(prompt, { format: 'json' });
const data = JSON.parse(response); // Always valid!
```

### 2. **Keep-Alive Management** ⚡
Control how long models stay loaded in memory:

```javascript
// Keep model loaded for quick successive calls
await parseEvent(text, { keep_alive: '10m' }); // 10 minutes
await parseEvent(text2, { keep_alive: '10m' }); // Fast second call!

// Or use seconds
await generate(prompt, { keep_alive: 300 }); // 5 minutes
```

### 3. **Enhanced Error Handling** 🛡️
Automatically handles missing models:

```javascript
try {
  await parseEvent('Meeting tomorrow at 2pm');
} catch (error) {
  if (error instanceof ResponseError && error.status_code === 404) {
    // Service automatically attempts to pull the model!
  }
}
```

### 4. **Streaming Support** 🌊
Stream responses for long operations:

```javascript
const messages = [
  { role: 'system', content: 'You are a calendar assistant' },
  { role: 'user', content: 'Analyze my week' }
];

await chatStream(messages, (chunk) => {
  process.stdout.write(chunk); // Real-time output!
});
```

### 5. **Embeddings for Semantic Search** 🔍
Generate embeddings for intelligent search:

```javascript
// Single text
const embedding = await embed('Team standup meeting');

// Batch embeddings
const embeddings = await embed([
  'Team standup meeting',
  'Doctor appointment',
  'Lunch with Sarah'
]);

// Use for similarity search in events
```

### 6. **Cloud Model Support** ☁️
Use larger cloud models for complex tasks:

```javascript
// Set environment variables
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_API_KEY=your_api_key

// Service automatically detects and uses cloud models
```

### 7. **Abort Streaming** 🛑
Cancel long-running operations:

```javascript
const service = getInstance();

// Start a long operation
const promise = service.chatStream(messages, onChunk);

// Cancel if needed
service.abort();
```

## Configuration

### Environment Variables

```bash
# Basic configuration
OLLAMA_HOST=http://127.0.0.1:11434  # Default: local
OLLAMA_MODEL=phi                     # Default: phi (2.3GB)

# Cloud configuration (optional)
OLLAMA_HOST=https://ollama.com       # Point to cloud
OLLAMA_API_KEY=your_api_key_here     # Required for cloud

# Recommended local models
OLLAMA_MODEL=phi           # 2.3GB - Best balance
OLLAMA_MODEL=tinyllama     # 637MB - Fastest, lowest RAM
OLLAMA_MODEL=qwen2:1.5b    # 934MB - Great for parsing
OLLAMA_MODEL=mistral       # 4GB - Most powerful local

# Cloud models (requires API key)
OLLAMA_MODEL=gpt-oss:120b-cloud      # Large model, cloud-hosted
OLLAMA_MODEL=deepseek-v3.1:671b-cloud # Very large, slow
```

## Usage Examples

### Event Parsing (with JSON enforcement)

```javascript
const service = getInstance();

// Automatic JSON parsing
const event = await service.parseEvent('Team standup tomorrow at 10am', {
  format: 'json',
  keep_alive: '10m'
});

console.log(event);
// {
//   title: 'Team standup',
//   date: '2026-02-26',
//   time: '10:00',
//   aiParsed: true,
//   confidence: 'high'
// }
```

### Event Organization (with JSON enforcement)

```javascript
const organized = await service.organizeEvents(events, {
  format: 'json',
  keep_alive: '10m'
});

console.log(organized);
// {
//   categories: {
//     Work: ['Team standup', 'Client meeting'],
//     Personal: ['Dentist', 'Gym'],
//     Social: ['Dinner with friends']
//   },
//   aiOrganized: true
// }
```

### Streaming Chat with Real-time Updates

```javascript
const messages = [
  { role: 'system', content: 'You are a helpful calendar assistant' },
  { role: 'user', content: 'What are the pros and cons of my schedule this week?' }
];

let fullResponse = '';
const response = await service.chatStream(
  messages,
  (chunk) => {
    fullResponse += chunk;
    console.log('Received:', chunk);
    // Update UI in real-time
  },
  { temperature: 0.7, max_tokens: 1000 }
);

console.log('Complete response:', response);
```

### Semantic Event Search with Embeddings

```javascript
// Generate embeddings for all events
const eventEmbeddings = await service.embed(
  events.map(e => `${e.title} ${e.description}`),
  { truncate: true }
);

// Generate embedding for search query
const queryEmbedding = await service.embed('health activities');

// Calculate similarity (cosine similarity)
const similarities = eventEmbeddings.map((embedding, i) => ({
  event: events[i],
  similarity: cosineSimilarity(queryEmbedding[0], embedding)
}));

// Get most similar events
const relevant = similarities
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 5);
```

## Performance Tips

1. **Use `keep_alive` smartly**: Set it longer (`10m` or `15m`) when you know you'll make multiple requests
2. **JSON format**: Always use `format: 'json'` when expecting structured data
3. **Temperature settings**:
   - `0.2` - Very focused, deterministic (parsing, extraction)
   - `0.5` - Balanced (analysis, categorization)
   - `0.7` - Creative (conversation, suggestions)
4. **Model selection**:
   - `tinyllama` - Quick responses, limited context
   - `phi` - Best balance (recommended)
   - `mistral` - More complex reasoning
   - Cloud models - Use only for very complex tasks

## Error Handling

The service now handles common errors automatically:

```javascript
try {
  const result = await service.parseEvent(text);
} catch (error) {
  if (error instanceof ResponseError) {
    switch (error.status_code) {
      case 404:
        // Model automatically pulled, request retried
        break;
      case 500:
        // Server error, falls back to basic parsing
        break;
    }
  }
  // Service handles fallback automatically
}
```

## Testing the Improvements

```bash
# 1. Make sure Ollama is running
ollama serve

# 2. Pull a model if needed
ollama pull phi

# 3. Test the enhanced service
node backend/server.js

# 4. Try some API endpoints:
curl -X POST http://localhost:3001/api/ai/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Team meeting tomorrow at 2pm"}'
```

## What Changed in the Code

1. **Import**: Added `ResponseError` from ollama package
2. **Constructor**: Added cloud model support and API key handling
3. **Error Handling**: All methods now handle `ResponseError` specifically
4. **Format Enforcement**: `format: 'json'` added to parsing methods
5. **Keep-Alive**: Memory management optimized
6. **New Methods**: `chatStream()`, `embed()`, `abort()`
7. **Auto-Pull**: Automatically pulls missing models

## Benefits

✅ More reliable JSON parsing (no regex needed)  
✅ Faster successive requests (models stay loaded)  
✅ Better error recovery (auto-pull missing models)  
✅ Real-time streaming for long operations  
✅ Semantic search capabilities  
✅ Cloud model support for complex tasks  
✅ Better resource management  

---

**Note**: All existing code continues to work! These are enhancements that make the service more robust and feature-rich.
