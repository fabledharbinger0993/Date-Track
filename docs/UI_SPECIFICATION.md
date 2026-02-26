# Date-Track UI/UX Specification

## Overview
Date-Track is a calendar management app with AI-powered event parsing, email integration, and design tools inspired by Apple's Invites app.

---

## Main Page Layout

### Structure
```
┌─────────────────────────────────────────┐
│         CALENDAR VIEW (Top 50%)         │
│  ┌───────────────────────────────────┐  │
│  │ Month Year              [Expand]  │  │
│  │ S  M  T  W  T  F  S              │  │
│  │ ·  ·  ·  1  2  3  4              │  │
│  │ 5  6  7  8  9 10 11              │  │
│  │ ··························       │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│       NAVIGATION BUTTONS (Bottom 50%)    │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐  │
│  │Rtn││Add ││Link││Note││Set ││Dsn │  │
│  └────┘└────┘└────┘└────┘└────┘└────┘  │
└─────────────────────────────────────────┘
```

---

## 1. Calendar View (Top Half)

### Features
- **Expand Button** (top right corner)
  - Slightly expands calendar
  - Enables swipe navigation for month/year changes
  
- **Clickable Days**
  - Click any day → Opens **Event Setup Page**
  
### Event Visual Indicators

#### Single-Day Events (Dots)
```
┌──────────┐
│    15    │  ← Day number
│    ●     │  ← Event dot (centered vertically at 50%)
└──────────┘
```

#### Multi-Day Events (Dots + Dashes)
```
┌────┬────┬────┬────┐
│ 15 │ 16 │ 17 │ 18 │
│ ●──┼────┼────┤    │  ← Extends from start dot to end
└────┴────┴────┴────┘
```

#### Stacking System (Max 3 Events)
**1 Event:**
```
┌──────────┐
│    15    │
│    ●     │  ← Position: 50% from top
└──────────┘
```

**2 Events:**
```
┌──────────┐
│    15    │
│    ●     │  ← Position: 33% from top
│    ●     │  ← Position: 67% from top
└──────────┘
```

**3 Events:**
```
┌──────────┐
│    15    │
│    ●     │  ← Position: 25% from top
│    ●     │  ← Position: 50% from top
│    ●     │  ← Position: 75% from top
└──────────┘
```

**Spacing Rules:**
- Dots/dashes are equidistant from box edges
- Vertical spacing divides evenly based on event count
- 4th event triggers **overlap alert** ⚠️

#### Sticky Notes (Notes without Events)
```
┌──────────┐
│    15    │
│    📝    │  ← Sticky note icon (top-right corner)
└──────────┘
```

### Conflict Detection
- App **does not prevent** overlapping events
- **Alerts user** when adding 4+ events to same day
- Confirmation dialog: "3 events already exist on this day. Add anyway?"

---

## 2. Navigation Buttons (Bottom Half)

6 buttons in horizontal layout:

### Button 1: **Return**
- **Function:** Navigate back to main page
- **Icon:** ← (left arrow)
- **Color:** Neutral gray

### Button 2: **Add Event**
- **Function:** Opens Event Setup Page
- **Icon:** ➕ or 📅
- **Color:** Primary blue
- **Note:** Same function as clicking a calendar day

### Button 3: **Link Email**
- **Function:** Opens OAuth popup for email connection
- **Icon:** 📧 or 🔗
- **Color:** Green
- **Popup includes:**
  - Gmail OAuth
  - Outlook OAuth
  - Yahoo IMAP
  - Shows connected accounts (up to 10)

### Button 4: **Notes**
- **Function:** Opens Notes page
- **Icon:** 📝
- **Color:** Yellow/Gold

### Button 5: **Settings**
- **Function:** Opens Settings page
- **Icon:** ⚙️
- **Color:** Gray
- **Settings include:**
  - Light/Dark mode
  - Font type/size
  - Notifications (access/volume)
  - Navigation to all pages

### Button 6: **Design**
- **Function:** Opens Event Design Page (Apple Invites aesthetic)
- **Icon:** 🎨 or ✨
- **Color:** Purple/Pink

---

## 3. Event Setup Page

**Purpose:** Create/edit event with reminders

### Fields
- Event title
- Date & time
- Location
- Attendees
- Reminders (multiple)
- Notes/description
- Repeat settings
- All-day toggle

### Navigation
- **Save** button
- **Cancel** button
- **Delete** (if editing existing event)

---

## 4. Event Design Page

**Purpose:** Visual customization (Apple Invites aesthetic)

**Inspired by Apple Invites app:**
- Beautiful invite templates
- Color schemes
- Custom backgrounds
- Typography options
- Image upload
- Sticker/emoji support
- Shareable invite links

### Features
- Template gallery
- Color picker
- Font selector
- Background images/gradients
- Preview mode
- Export as image/PDF
- Share via email/social

---

## 5. Notes Page

**Rich Text Editor** with following features:

### Text Formatting
- **Bold** (Ctrl+B)
- *Italic* (Ctrl+I)
- CAPS toggle
- Font size (8pt - 72pt)

### Font Options
1. **Comic Sans MS**
2. **Times New Roman**
3. **Instrument Sans**

### Features
- Copy/paste support (Ctrl+C, Ctrl+V)
- URL support (clickable links)
- Auto-save
- Search function
- Character/word count

### Post'it Feature
**Button:** "Post'it" 📌

**Function:**
1. Click "Post'it" button
2. Date picker appears
3. Select date on calendar
4. Note attaches to calendar date
5. **Sticky note icon (📝)** appears on calendar
6. **Does NOT create an event** - just visual note
7. Click sticky note icon to view note

### Post'it Visual
```
┌──────────┐
│  📝  15  │  ← Sticky note icon (top-right)
│    ●     │  ← Optional event dot
└──────────┘
```

---

## 6. Settings Page

### Theme
- ☀️ **Light Mode**
- 🌙 **Dark Mode**
- Auto (system preference)

### Font Settings
- **App Font:** Comic Sans, Times New Roman, Instrument Sans
- **Font Size:** Small (12pt), Medium (16pt), Large (20pt)

### Notifications
- **Access:** On/Off toggle
- **Volume:** Slider (0-100%)
- **Sound:** Dropdown (System, Chime, Bell, etc.)
- **Notification Types:**
  - Event reminders
  - Email alerts
  - Conflict warnings

### Navigation Links
- Calendar Settings
- Email Accounts
- Data & Privacy
- About/Help
- Logout

---

## 7. Email Link Page (OAuth Popup)

**Popup Modal** (overlays current page)

### Layout
```
┌─────────────────────────────────┐
│  Connect Email Account     [X]  │
├─────────────────────────────────┤
│                                 │
│  [🔵 Login with Google]         │
│  [🔵 Login with Microsoft]      │
│  [📧 IMAP (Yahoo, etc.)]        │
│                                 │
│  Connected Accounts (3/10):     │
│  ✓ user@gmail.com (Primary)    │
│  ✓ work@outlook.com             │
│  ✓ personal@yahoo.com           │
│                                 │
│  [+ Add Another Account]        │
└─────────────────────────────────┘
```

### Features
- OAuth for Gmail/Outlook
- IMAP form for Yahoo/others
- List connected accounts (max 10)
- Set primary account
- Disconnect accounts
- View sync status

---

## Technical Implementation Notes

### State Management
- Use React Context or Redux for global state
- Store:
  - Current user
  - Events
  - Notes with calendar associations
  - Email accounts
  - Settings (theme, font, notifications)

### Routing
```javascript
/                    → Main Page (Calendar + Nav Buttons)
/event/:date         → Event Setup Page
/event/:id/edit      → Event Setup Page (edit mode)
/design              → Event Design Page
/design/:id          → Event Design Page (edit existing)
/notes               → Notes Page
/notes/:id           → Note Detail/Edit
/settings            → Settings Page
/email               → Email Link Popup (modal)
```

### Components to Create
```
src/
├── components/
│   ├── Calendar/
│   │   ├── Calendar.js (enhanced)
│   │   ├── CalendarDay.js (with dots/dashes/notes)
│   │   ├── CalendarExpandView.js
│   │   └── Calendar.css
│   ├── Navigation/
│   │   ├── BottomNav.js (6 buttons)
│   │   └── BottomNav.css
│   ├── EventSetup/
│   │   ├── EventSetupForm.js
│   │   └── EventSetupForm.css
│   ├── EventDesign/
│   │   ├── DesignCanvas.js
│   │   ├── TemplateGallery.js
│   │   └── EventDesign.css
│   ├── Notes/
│   │   ├── RichTextEditor.js
│   │   ├── PostItButton.js
│   │   ├── NotesList.js
│   │   └── Notes.css
│   ├── Settings/
│   │   ├── ThemeToggle.js
│   │   ├── FontSelector.js
│   │   ├── NotificationSettings.js
│   │   └── Settings.css
│   └── Email/
│       ├── EmailLinkModal.js
│       ├── AccountList.js
│       └── EmailLink.css
└── pages/
    ├── MainPage.js (Calendar + BottomNav)
    ├── EventSetupPage.js
    ├── EventDesignPage.js
    ├── NotesPage.js
    └── SettingsPage.js
```

---

## Design Tokens

### Colors
**Light Mode:**
- Primary: #4A90E2 (Blue)
- Secondary: #50C878 (Green)
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #333333
- Border: #E0E0E0

**Dark Mode:**
- Primary: #6BB6FF
- Secondary: #6FEDD6
- Background: #1A1A1A
- Surface: #2C2C2C
- Text: #E0E0E0
- Border: #404040

### Typography
- **Headings:** Instrument Sans, 20-32px, Bold
- **Body:** Times New Roman, 14-16px, Regular
- **Fun Text:** Comic Sans MS, 14-16px, Regular

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 16px
- Round: 50%

---

## Interaction Patterns

### Calendar Day Click
1. User clicks calendar day
2. **Event Setup Page** opens
3. Date pre-filled
4. User enters event details
5. Save → Returns to calendar with new event dot

### Post'it Note Flow
1. User writes note in Notes page
2. Clicks "Post'it" button
3. Date picker modal appears
4. Selects date
5. Returns to calendar
6. **Sticky note icon** appears on selected date
7. Click icon → Opens note

### Event Conflict Alert
1. User creates 4th event on same day
2. Alert dialog: "⚠️ 3 events already exist on [date]. Add anyway?"
3. **Cancel** → Returns to form
4. **Add Anyway** → Creates event (4th dot hidden, shows "+1" badge)

### Multi-Day Event Creation
1. User selects start date
2. Toggles "Multi-day event"
3. Selects end date
4. Save → **Dot** appears on start date
5. **Dash** extends through all days
6. **Dot** optional on end date (or dash ends)

---

## Accessibility

- All buttons have aria-labels
- Calendar navigation keyboard-accessible (arrow keys)
- Color contrast meets WCAG AA standards
- Focus indicators visible
- Screen reader announcements for event count per day

---

## Future Enhancements

- Drag & drop events
- Calendar sync (Google, Apple, Outlook)
- Weather integration
- AI-powered event suggestions
- Voice input for event creation
- Collaborative calendars
- Export to PDF/image
