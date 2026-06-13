import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  // Update HTML elements when accessibility options change
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  }, [largeText]);

  // Screen Reader Live Announcements helper
  const announce = (message) => {
    setAnnouncement(message);
    // Clear after some time to allow new announcements
    setTimeout(() => {
      setAnnouncement((prev) => (prev === message ? '' : prev));
    }, 3000);
  };

  // Screen reader TTS speak helper
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Cancel ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Text-To-Speech hover reader helper
  const handleHoverSpeak = (text) => {
    if (screenReaderOptimized) {
      speakText(text);
    }
  };

  const loadSettings = (settings) => {
    if (settings) {
      setHighContrast(settings.highContrast);
      setLargeText(settings.largeText);
      setScreenReaderOptimized(settings.screenReaderOptimized);
      setVoiceCommandsEnabled(settings.voiceCommandsEnabled);
      setSubtitlesEnabled(settings.subtitlesEnabled);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        largeText,
        setLargeText,
        screenReaderOptimized,
        setScreenReaderOptimized,
        voiceCommandsEnabled,
        setVoiceCommandsEnabled,
        subtitlesEnabled,
        setSubtitlesEnabled,
        announce,
        speakText,
        handleHoverSpeak,
        loadSettings
      }}
    >
      {children}
      {/* Screen Reader ARIA-LIVE Announcement Container */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }}
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
