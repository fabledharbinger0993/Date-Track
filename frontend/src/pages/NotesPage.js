import React, { useState, useEffect } from 'react';
import './NotesPage.css';

/**
 * Notes Page with Rich Text Editor + Post'it Feature
 * Supports 3 fonts: Comic Sans MS, Times New Roman, Instrument Sans
 * Post'it: Attach notes to calendar dates without creating events
 */
function NotesPage({ onBack }) {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '', font: 'instrument-sans' });
  const [selectedFont, setSelectedFont] = useState('instrument-sans');
  const [showPostIt, setShowPostIt] = useState(false);
  const [postItDate, setPostItDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      // Load notes from localStorage for now
      const savedNotes = localStorage.getItem('notes_list');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = (updatedNotes) => {
    localStorage.setItem('notes_list', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const handleTextFormat = (format) => {
    // Apply text formatting (Bold, Italic, Caps) using execCommand
    document.execCommand(format, false, null);
  };

  const handleFontChange = (font) => {
    setSelectedFont(font);
    setCurrentNote({ ...currentNote, font });
  };

  const handleSaveNote = () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      alert('Please enter both title and content');
      return;
    }

    const updatedNotes = currentNote.id
      ? notes.map((n) => (n.id === currentNote.id ? currentNote : n))
      : [...notes, { ...currentNote, id: Date.now(), createdAt: new Date().toISOString() }];

    saveNotes(updatedNotes);
    setCurrentNote({ id: null, title: '', content: '', font: 'instrument-sans' });
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Delete this note?')) {
      const updatedNotes = notes.filter((n) => n.id !== noteId);
      saveNotes(updatedNotes);
    }
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setSelectedFont(note.font);
  };

  const handleNewNote = () => {
    setCurrentNote({ id: null, title: '', content: '', font: 'instrument-sans' });
    setSelectedFont('instrument-sans');
  };

  const handlePostItSave = () => {
    if (!postItDate) {
      alert('Please select a date');
      return;
    }

    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      alert('Please enter note content');
      return;
    }

    // Save note and attach to calendar date
    const postItNote = {
      ...currentNote,
      id: Date.now(),
      date: postItDate,
      isPostIt: true,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...notes, postItNote];
    saveNotes(updatedNotes);

    // Also save to calendar notes
    const calendarNotes = JSON.parse(localStorage.getItem('calendar_notes') || '{}');
    calendarNotes[postItDate] = postItNote;
    localStorage.setItem('calendar_notes', JSON.stringify(calendarNotes));

    setShowPostIt(false);
    setPostItDate('');
    setCurrentNote({ id: null, title: '', content: '', font: 'instrument-sans' });
  };

  return (
    <div className="notes-page">
      {/* Header */}
      <div className="notes-page__header">
        <button className="notes-page__back-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <h1 className="notes-page__title">📝 Notes</h1>
        <button className="notes-page__new-btn" onClick={handleNewNote} aria-label="New Note">
          ➕ New
        </button>
      </div>

      {/* Main Content */}
      <div className="notes-page__content">
        {/* Editor Section */}
        <div className="notes-page__editor">
          <input
            type="text"
            className={`notes-editor__title font-${selectedFont}`}
            placeholder="Note Title"
            value={currentNote.title}
            onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
          />

          {/* Formatting Toolbar */}
          <div className="notes-editor__toolbar">
            <button onClick={() => handleTextFormat('bold')} title="Bold">
              <strong>B</strong>
            </button>
            <button onClick={() => handleTextFormat('italic')} title="Italic">
              <em>I</em>
            </button>
            <button onClick={() => handleTextFormat('uppercase')} title="Caps">
              ABC
            </button>
            
            <div className="toolbar-divider"></div>

            {/* Font Selector */}
            <select 
              value={selectedFont} 
              onChange={(e) => handleFontChange(e.target.value)}
              className="font-selector"
            >
              <option value="comic-sans">Comic Sans</option>
              <option value="times-new-roman">Times New Roman</option>
              <option value="instrument-sans">Instrument Sans</option>
            </select>
          </div>

          {/* Content Editor */}
          <div
            className={`notes-editor__content font-${selectedFont}`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setCurrentNote({ ...currentNote, content: e.currentTarget.textContent })}
            dangerouslySetInnerHTML={{ __html: currentNote.content }}
          />

          {/* Action Buttons */}
          <div className="notes-editor__actions">
            <button className="btn btn--save" onClick={handleSaveNote}>
              💾 Save Note
            </button>
            <button className="btn btn--postit" onClick={() => setShowPostIt(true)}>
              📌 Post'it to Date
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="notes-page__list">
          <h2>Saved Notes</h2>
          {loading ? (
            <p className="notes-list__loading">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="notes-list__empty">No notes yet. Create your first one!</p>
          ) : (
            <div className="notes-list__items">
              {notes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-item__header">
                    <h3 className={`font-${note.font}`}>{note.title}</h3>
                    {note.isPostIt && (
                      <span className="note-item__badge">📌 {note.date}</span>
                    )}
                  </div>
                  <p className={`note-item__content font-${note.font}`}>
                    {note.content.substring(0, 100)}
                    {note.content.length > 100 && '...'}
                  </p>
                  <div className="note-item__actions">
                    <button onClick={() => handleEditNote(note)}>Edit</button>
                    <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post'it Modal */}
      {showPostIt && (
        <div className="postit-modal">
          <div className="postit-modal__content">
            <h2>📌 Attach to Calendar Date</h2>
            <p>Select a date to attach this note to your calendar as a Post'it.</p>
            
            <input
              type="date"
              className="postit-modal__date-input"
              value={postItDate}
              onChange={(e) => setPostItDate(e.target.value)}
            />

            <div className="postit-modal__actions">
              <button className="btn btn--primary" onClick={handlePostItSave}>
                Attach to Date
              </button>
              <button className="btn btn--secondary" onClick={() => setShowPostIt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesPage;
