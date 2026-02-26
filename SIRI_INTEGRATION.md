# Siri Integration Guide

## TL;DR: Three Approaches

| Option | Difficulty | Cost | Timeline | What You Get |
|--------|-----------|------|----------|--------------|
| **Siri Shortcuts** | Easy ⭐ | Free | 1-2 days | Voice commands call your API |
| **iOS App Clip** | Medium ⭐⭐ | $99/year | 1-2 weeks | Lightweight native experience |
| **Native iOS App** | Hard ⭐⭐⭐ | $99/year | 4-8 weeks | Full SiriKit integration |

**Recommendation:** Start with **Siri Shortcuts** (Option 1) - zero cost, works with your existing web app.

---

## Option 1: Siri Shortcuts (Easiest, FREE)

### What this gives you:
- Users say: *"Hey Siri, add event"*
- Siri prompts for event details
- Shortcut POSTs to your API: `POST /api/events`
- Works with existing web app, no native code needed

### Implementation Steps:

#### 1. Create API endpoint for Siri (already exists!)
Your current API at `/api/events/parse` already supports this:

```bash
# User says: "Dentist tomorrow at 2pm"
# Shortcut POSTs to:
curl -X POST https://your-api.com/api/events/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Dentist tomorrow at 2pm", "userId": "user123"}'
```

#### 2. Create a Siri Shortcut template

**File:** `shortcuts/AddEvent.shortcut`

```json
{
  "WFWorkflowActions": [
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.ask",
      "WFWorkflowActionParameters": {
        "WFAskActionPrompt": "What's the event?",
        "WFInputType": "Text"
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
      "WFWorkflowActionParameters": {
        "WFTextActionText": "Provided Input"
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.url",
      "WFWorkflowActionParameters": {
        "WFURLActionURL": "https://your-backend.railway.app/api/events/parse"
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
      "WFWorkflowActionParameters": {
        "WFHTTPMethod": "POST",
        "WFHTTPBodyType": "JSON",
        "WFJSONValues": {
          "text": "Provided Input",
          "userId": "user123",
          "useAI": true
        }
      }
    },
    {
      "WFWorkflowActionIdentifier": "is.workflow.actions.notification",
      "WFWorkflowActionParameters": {
        "WFNotificationActionBody": "Event added!"
      }
    }
  ]
}
```

#### 3. Distribution

**Option A:** Manual instructions (users create their own)
- Provide step-by-step guide in your docs
- Users open Shortcuts app → Create → API Request → Configure

**Option B:** Distributable shortcut link
```bash
# Host a .shortcut file
https://date-track.app/shortcuts/add-event.shortcut

# Users tap link → "Add Shortcut" → Done
```

#### 4. Voice Phrases Users Can Set

Users can customize their phrase:
- "Hey Siri, add to calendar"
- "Hey Siri, new event"
- "Hey Siri, schedule something"

**Cost:** $0  
**Time to implement:** 1-2 days  
**Works with:** Your existing web app

---

## Option 2: iOS App Clip (Better UX)

### What this gives you:
- Lightweight iOS experience (< 10MB)
- Siri says: *"Opening Date Track..."*
- Native event creation form appears
- Can still use your backend API
- Appears in App Library, can be added to Home Screen

### Requirements:
- Apple Developer account ($99/year)
- Swift/SwiftUI knowledge (or hire contractor for $500-1500)
- Code signing and provisioning

### Implementation Overview:

```swift
// DateTrackClip/ContentView.swift
import SwiftUI
import Intents

struct ContentView: View {
    @State private var eventText = ""
    
    var body: some View {
        VStack {
            Text("Quick Event")
                .font(.title)
            
            TextField("e.g., Dentist tomorrow at 2pm", text: $eventText)
                .textFieldStyle(.roundedBorder)
                .padding()
            
            Button("Add Event") {
                createEvent(text: eventText)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
            // Handle deep link from Siri
        }
    }
    
    func createEvent(text: String) {
        // POST to your backend API
        let url = URL(string: "https://your-api.com/api/events/parse")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["text": text])
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
}
```

**Siri Integration:**
```swift
// Intents/AddEventIntent.swift
import Intents

class AddEventIntentHandler: NSObject, AddEventIntentHandling {
    func handle(intent: AddEventIntent, completion: @escaping (AddEventIntentResponse) -> Void) {
        guard let eventText = intent.eventDescription else {
            completion(AddEventIntentResponse(code: .failure, userActivity: nil))
            return
        }
        
        // Call your API
        // ...
        
        completion(AddEventIntentResponse.success(event: eventText))
    }
}
```

**Cost:** $99/year + development time  
**Time:** 1-2 weeks  
**Distribution:** App Store

---

## Option 3: Full Native iOS App (Complete Integration)

### What this gives you:
- Full SiriKit integration
- Rich Siri UI with event details
- Siri suggestions based on context
- Widget support
- Offline mode with local storage
- Background sync

### SiriKit Intents You'd Support:

```swift
// Intents.intentdefinition
- INCreateNoteIntent → Create events via Siri
- INSearchForNotesIntent → "Show my events"
- INSetTaskAttributeIntent → Modify events
- INSnoozeTasksIntent → Snooze reminders
```

### Example Implementation:

```swift
// AppDelegate.swift
import Intents

func application(_ application: UIApplication, 
                 handlerFor intent: INIntent) -> Any? {
    if intent is INCreateNoteIntent {
        return CreateEventIntentHandler()
    }
    return nil
}

// CreateEventIntentHandler.swift
class CreateEventIntentHandler: NSObject, INCreateNoteIntentHandling {
    func handle(intent: INCreateNoteIntent, 
                completion: @escaping (INCreateNoteIntentResponse) -> Void) {
        
        guard let content = intent.content?.string else {
            completion(INCreateNoteIntentResponse(code: .failure, userActivity: nil))
            return
        }
        
        // Parse with your Ollama backend
        NetworkManager.shared.parseEvent(text: content) { event in
            let response = INCreateNoteIntentResponse(code: .success, userActivity: nil)
            response.createdNote = INNote(
                title: INSpeakableString(spokenPhrase: event.title),
                contents: [INNoteContent(text: event.description)],
                groupName: INSpeakableString(spokenPhrase: "Events"),
                createdDateComponents: event.dateComponents
            )
            completion(response)
        }
    }
    
    func confirm(intent: INCreateNoteIntent,
                 completion: @escaping (INCreateNoteIntentResponse) -> Void) {
        // Validation before creating
        completion(INCreateNoteIntentResponse(code: .ready, userActivity: nil))
    }
}
```

**Siri Donation** (teaches Siri your app):
```swift
// After user creates event manually
let intent = INCreateNoteIntent()
intent.title = INSpeakableString(spokenPhrase: "Add event")
intent.content = INTextNoteContent(text: "Dentist tomorrow at 2pm")

let interaction = INInteraction(intent: intent, response: nil)
interaction.donate { error in
    // Siri learns this pattern
}
```

**Cost:** $99/year + 4-8 weeks development  
**Learning curve:** Swift, SiriKit, iOS development  
**Maintenance:** Keep in sync with web app

---

## Recommended Path Forward

### Phase 1 (Week 1-2): Siri Shortcuts
- ✅ You already have the API
- Create shortcut template
- Add docs for users to set up
- **Cost:** $0

### Phase 2 (Month 2-3): Progressive Web App Enhancement
- Add to Home Screen support
- Offline caching with Service Workers
- Push notifications (Web Push API)
- **Cost:** $0

### Phase 3 (Month 4+): Native App (if needed)
- Build iOS App Clip first (test waters)
- If popular, expand to full native app
- **Cost:** $99/year + dev time

---

## Quick Start: Implementing Shortcuts Today

### 1. Add authentication endpoint

```javascript
// backend/routes/auth.js (add this)
router.post('/shortcuts/token', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate credentials
  const user = await User.findOne({ where: { email: username } });
  if (!user || !user.validatePassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate long-lived token for Shortcuts
  const token = jwt.sign(
    { userId: user.id, type: 'shortcuts' },
    process.env.JWT_SECRET,
    { expiresIn: '1y' }
  );
  
  res.json({ token });
});
```

### 2. Update parse endpoint to accept token auth

```javascript
// backend/middleware/auth.js (modify)
const authenticateShortcut = (req, res, next) => {
  const token = req.headers['x-shortcuts-token'] || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// backend/routes/events.js (add)
router.post('/parse', authenticateShortcut, eventsController.parseEvent);
```

### 3. User setup flow

1. User logs into web app
2. Goes to Settings → Integrations → Siri
3. Clicks "Generate Shortcuts Token"
4. Copies token
5. Opens Shortcuts app on iPhone
6. Imports your shortcut template
7. Pastes token when prompted
8. Assigns voice phrase

**Done!** Users can now say "Hey Siri, add event" and it works.

---

## Android Equivalent

For Android users, implement Google Assistant Actions:

- **Google Assistant Routines** (similar to Shortcuts)
- Call same API endpoints
- Free to implement
- Works with existing backend

---

## Summary

**For $0 and minimal work:**
- Implement Siri Shortcuts (use existing API)
- 90% of users will be happy with this

**If you need native experience:**
- Start with App Clip ($99/year, 1-2 weeks)
- Evaluate before building full app

**Don't build native app unless:**
- You have budget ($5k-15k for quality app)
- Web app limitations hurt UX
- You need offline mode

Your current web app with voice input + Shortcuts integration is probably sufficient for MVP!
