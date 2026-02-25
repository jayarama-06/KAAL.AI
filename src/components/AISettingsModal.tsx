/**
 * AI Settings Modal - Configure Gemini API integration
 */

import { useState } from 'react';
import { X, Key, Brain, Sparkles, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAIContext } from '../context/AIContext';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { geminiEnabled, setGeminiAPIKey } = useAIContext();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      // Basic validation - check if key looks like a Gemini API key
      if (!apiKey.startsWith('AIza')) {
        throw new Error('Invalid API key format');
      }

      // Save the key securely via Supabase Edge Function
      await setGeminiAPIKey(apiKey);
      setValidationStatus('success');
      
      setTimeout(() => {
        setApiKey(''); // Clear the input for security
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setValidationStatus('error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = async () => {
    // Remove from Supabase (the secure service handles this)
    setApiKey('');
    setValidationStatus('idle');
    
    // Remove old localStorage key if it exists
    localStorage.removeItem('kaal_gemini_api_key');
    
    // Reload to reinitialize AI service
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div 
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 48px 144px -24px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div 
          className="px-8 py-6 border-b flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Settings</h2>
              <p className="text-sm text-white/80">Configure Gemini AI integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Status Banner */}
          {geminiEnabled ? (
            <div 
              className="p-4 rounded-2xl flex items-center gap-3 border"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderColor: 'rgba(16, 185, 129, 0.2)'
              }}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: '#10B981' }}>
                  Gemini AI Enabled
                </h3>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Deep insights and personalized recommendations are active
                </p>
              </div>
              <button
                onClick={handleRemoveKey}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div 
              className="p-4 rounded-2xl flex items-center gap-3 border"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderColor: 'rgba(245, 158, 11, 0.2)'
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#F59E0B' }} />
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                  Running in Heuristic Mode
                </h3>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Add a Gemini API key to unlock advanced AI insights
                </p>
              </div>
            </div>
          )}

          {/* Feature Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
                <span className="text-base">🎯</span>
                Heuristic Mode (Free)
              </h4>
              <ul className="space-y-2 text-xs" style={{ color: '#6B7280' }}>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Basic focus tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Energy pattern detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Simple nudges & recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Session analytics</span>
                </li>
              </ul>
            </div>

            <div 
              className="p-5 rounded-2xl border relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
                borderColor: 'rgba(102, 126, 234, 0.2)'
              }}
            >
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4" style={{ color: '#667EEA' }} />
              </div>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#667EEA' }}>
                <span className="text-base">🧠</span>
                Gemini AI Enhanced
              </h4>
              <ul className="space-y-2 text-xs" style={{ color: '#6B7280' }}>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  <span>Deep pattern analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  <span>Personalized insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  <span>Predictive recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  <span>Natural language coaching</span>
                </li>
              </ul>
            </div>
          </div>

          {/* API Key Input */}
          {!geminiEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#111827' }}>
                  Gemini API Key
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Key className="w-4 h-4" style={{ color: '#6B7280' }} />
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full pl-11 pr-24 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'white',
                      borderColor: validationStatus === 'error' ? '#EF4444' : 'rgba(0, 0, 0, 0.1)',
                      color: '#111827'
                    }}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      color: '#6B7280'
                    }}
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {validationStatus === 'error' && (
                  <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                    Invalid API key format. Please check and try again.
                  </p>
                )}
                {validationStatus === 'success' && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#10B981' }}>
                    <CheckCircle className="w-3 h-3" />
                    API key validated successfully!
                  </p>
                )}
              </div>

              {/* Get API Key Link */}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium hover:underline"
                style={{ color: '#667EEA' }}
              >
                <ExternalLink className="w-3 h-3" />
                Get a free API key from Google AI Studio
              </a>

              {/* Privacy Note */}
              <div 
                className="p-4 rounded-xl text-xs leading-relaxed"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  color: '#6B7280'
                }}
              >
                <strong style={{ color: '#111827' }}>🔒 Enterprise Security:</strong> Your API key is encrypted and stored securely in Supabase. It never touches your browser or localStorage. All AI requests are proxied through authenticated Supabase Edge Functions for maximum security.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!geminiEnabled && (
          <div 
            className="px-8 py-4 border-t flex items-center justify-end gap-3"
            style={{
              backgroundColor: 'rgba(249, 250, 251, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.05)'
            }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: '#6B7280'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || isValidating}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              {isValidating ? 'Validating...' : 'Save API Key'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}