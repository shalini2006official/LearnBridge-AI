import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  liteMode: boolean;
  ttsEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  toggleHighContrast: () => void;
  toggleLiteMode: () => void;
  toggleTTS: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 'medium',
      highContrast: false,
      liteMode: false,
      ttsEnabled: false
    };
  });
  
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync settings with local storage and document body classes
  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    
    // Apply body classes
    const body = document.body;
    
    // Remove existing classes
    body.classList.remove('text-small', 'text-medium', 'text-large', 'text-xlarge', 'high-contrast', 'lite-mode');
    
    // Add current settings classes
    body.classList.add(`text-${settings.fontSize}`);
    if (settings.highContrast) body.classList.add('high-contrast');
    if (settings.liteMode) body.classList.add('lite-mode');
  }, [settings]);

  const setFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleLiteMode = () => {
    setSettings(prev => ({ ...prev, liteMode: !prev.liteMode }));
  };

  const toggleTTS = () => {
    setSettings(prev => ({ ...prev, ttsEnabled: !prev.ttsEnabled }));
    if (settings.ttsEnabled) {
      stopSpeaking();
    }
  };

  // Text-To-Speech Narration (using Web Speech API Synthesis)
  const speakText = (text: string) => {
    if (!settings.ttsEnabled) return;
    
    // Stop any current speaking
    window.speechSynthesis.cancel();
    
    if (!text) return;
    
    // Clean markdown before speaking
    const cleanedText = text
      .replace(/[*#`_\-]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <AccessibilityContext.Provider value={{
      settings,
      setFontSize,
      toggleHighContrast,
      toggleLiteMode,
      toggleTTS,
      speakText,
      stopSpeaking,
      isSpeaking
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
