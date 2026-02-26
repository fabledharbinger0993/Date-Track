import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import MainPage from './pages/MainPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import EventPage from './pages/EventPage';
import EventSetupPage from './pages/EventSetupPage';
import EventDesignPage from './pages/EventDesignPage';

// Components
import EmailLinkModal from './components/EmailLinkModal/EmailLinkModal';

function App() {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home/Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Main Calendar Page */}
          <Route path="/calendar" element={<MainPage onOpenEmailModal={() => setIsEmailModalOpen(true)} />} />
          
          {/* Notes Page */}
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:noteId" element={<NotesPage />} />
          
          {/* Settings Page */}
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Event Pages */}
          <Route path="/event" element={<EventPage />} />
          <Route path="/event/new" element={<EventSetupPage />} />
          <Route path="/event/new/:date" element={<EventSetupPage />} />
          <Route path="/event/:eventId/edit" element={<EventSetupPage />} />
          <Route path="/event/:eventId/design" element={<EventDesignPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/calendar" replace />} />
        </Routes>

        {/* Email Link Modal (overlay) */}
        <EmailLinkModal 
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
        />
      </div>
    </Router>
  );
}

export default App;
