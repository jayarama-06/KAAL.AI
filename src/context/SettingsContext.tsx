import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  // Notifications
  pushNotifications: boolean;
  emailDigest: boolean;
  soundEffects: boolean;
  
  // Appearance
  glassmorphism: boolean;
  darkMode: boolean;
  compactView: boolean;
  
  // Focus Settings
  deepWorkMode: boolean;
  autoStartSessions: boolean;
  defaultSessionLength: number;
  
  // AI Settings
  enableAI: boolean;
  geminiApiKey?: string;
  aiPersonality: 'supportive' | 'strict' | 'balanced';
  
  // Privacy & Security
  enableAnalytics: boolean;
  enableCloudSync: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}

const SETTINGS_KEY = 'kaal_app_settings';

const defaultSettings: AppSettings = {
  // Notifications
  pushNotifications: true,
  emailDigest: false,
  soundEffects: true,
  
  // Appearance
  glassmorphism: true,
  darkMode: false,
  compactView: false,
  
  // Focus Settings
  deepWorkMode: false,
  autoStartSessions: false,
  defaultSessionLength: 90,
  
  // AI Settings
  enableAI: false,
  aiPersonality: 'balanced',
  
  // Privacy & Security
  enableAnalytics: true,
  enableCloudSync: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load from localStorage on initial render
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load settings:', error);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Apply dark mode to document
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply compact view class
    if (settings.compactView) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Play sound effect if enabled
      if (newSettings.soundEffects && updates.soundEffects !== false) {
        playSuccessSound();
      }
      
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    if (settings.soundEffects) {
      playSuccessSound();
    }
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (data: string) => {
    try {
      const imported = JSON.parse(data);
      setSettings({ ...defaultSettings, ...imported });
      if (settings.soundEffects) {
        playSuccessSound();
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Invalid settings format');
    }
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        resetSettings, 
        exportSettings, 
        importSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// Utility function to play success sound
function playSuccessSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Silently fail if audio doesn't work
    console.debug('Audio playback not available');
  }
}
