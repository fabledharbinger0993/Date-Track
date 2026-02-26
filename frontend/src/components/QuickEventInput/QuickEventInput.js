import React, { useState, useRef } from 'react';
import './QuickEventInput.css';

const QuickEventInput = ({ onEventParsed, onCancel }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome or Edge.');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + ' ' + transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      alert(`Voice input error: ${event.error}`);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return true;
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current && !initSpeechRecognition()) {
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start voice input:', error);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleParse = async () => {
    if (!input.trim()) {
      alert('Please enter event details');
      return;
    }

    setIsProcessing(true);
    setValidation(null);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;
      const response = await fetch(`${API_BASE}/events/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidation(data.validation);
        
        // If no critical issues, allow submission
        if (data.validation && !data.validation.conflicts?.length) {
          onEventParsed(data.event, data.validation);
        }
      } else {
        alert(data.message || 'Failed to parse event');
      }
    } catch (error) {
      console.error('Parse error:', error);
      alert('Failed to parse event. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (validation && validation.parsedEvent) {
      onEventParsed(validation.parsedEvent, validation);
    }
  };

  return (
    <div className="quick-event-input">
      <h2>Quick Event Input</h2>
      <p className="hint">
        Type or speak naturally: "Dentist appointment tomorrow at 2pm" or "Team meeting Friday 3-4pm with John"
      </p>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your event... (e.g., 'Lunch with Sarah tomorrow at noon at Main Street Cafe')"
          rows="4"
          disabled={isProcessing}
        />
        
        <div className="input-controls">
          <button
            type="button"
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            disabled={isProcessing}
            title="Voice input"
          >
            {isListening ? '🔴 Stop' : '🎤 Voice'}
          </button>

          <button
            type="button"
            className="parse-btn"
            onClick={handleParse}
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? 'Processing...' : 'Parse Event'}
          </button>
        </div>
      </div>

      {validation && (
        <div className="validation-panel">
          {/* Conflicts */}
          {validation.conflicts && validation.conflicts.length > 0 && (
            <div className="alert alert-error">
              <h4>⚠️ Schedule Conflicts</h4>
              <ul>
                {validation.conflicts.map((conflict, i) => (
                  <li key={i}>
                    Overlaps with <strong>{conflict.title}</strong> at {conflict.date} {conflict.startTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unusual patterns */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div className="alert alert-warning">
              <h4>⚡ Suggestions</h4>
              <ul>
                {validation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing details */}
          {validation.missingDetails && validation.missingDetails.length > 0 && (
            <div className="alert alert-info">
              <h4>💡 Consider Adding</h4>
              <ul>
                {validation.missingDetails.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed event preview */}
          {validation.parsedEvent && (
            <div className="parsed-preview">
              <h4>Parsed Event</h4>
              <dl>
                <dt>Title:</dt>
                <dd>{validation.parsedEvent.title}</dd>
                
                <dt>Date:</dt>
                <dd>{validation.parsedEvent.date}</dd>
                
                {validation.parsedEvent.startTime && (
                  <>
                    <dt>Time:</dt>
                    <dd>{validation.parsedEvent.startTime} - {validation.parsedEvent.endTime || 'TBD'}</dd>
                  </>
                )}
                
                {validation.parsedEvent.location && (
                  <>
                    <dt>Location:</dt>
                    <dd>{validation.parsedEvent.location}</dd>
                  </>
                )}
                
                {validation.parsedEvent.description && (
                  <>
                    <dt>Description:</dt>
                    <dd>{validation.parsedEvent.description}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="validation-actions">
            {validation.conflicts && validation.conflicts.length > 0 ? (
              <>
                <button type="button" className="btn-cancel" onClick={onCancel}>
                  Cancel & Choose Different Time
                </button>
                <button type="button" className="btn-warning" onClick={handleConfirm}>
                  Create Anyway
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={() => setInput('')}>
                  Start Over
                </button>
                <button type="button" className="btn-primary" onClick={handleConfirm}>
                  Confirm & Create
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QuickEventInput;
