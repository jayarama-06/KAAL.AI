import { useState } from "react";
import { X, Zap, Brain, Heart, Clock, MapPin, Volume2 } from "lucide-react";
import { supabase } from "../services/supabase-client";
import { toast } from "sonner";

interface EnergyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInComplete?: (data: UserState) => void;
}

export interface UserState {
  energyLevel: number; // 1-5
  mood: string;
  mentalClarity: number; // 1-5
  physicalState?: string;
  location?: string;
  environmentNoise?: string;
  timeAvailable?: number;
}

const MOODS = [
  { value: 'energized', label: '⚡ Energized', color: '#F59E0B' },
  { value: 'focused', label: '🎯 Focused', color: '#3B82F6' },
  { value: 'calm', label: '😌 Calm', color: '#10B981' },
  { value: 'tired', label: '😴 Tired', color: '#6B7280' },
  { value: 'stressed', label: '😰 Stressed', color: '#EF4444' },
  { value: 'overwhelmed', label: '😵 Overwhelmed', color: '#DC2626' },
  { value: 'anxious', label: '😟 Anxious', color: '#F97316' },
  { value: 'motivated', label: '🔥 Motivated', color: '#8B5CF6' },
];

const PHYSICAL_STATES = [
  { value: 'rested', label: '🌟 Rested', color: '#10B981' },
  { value: 'normal', label: '✅ Normal', color: '#3B82F6' },
  { value: 'fatigued', label: '😪 Fatigued', color: '#F59E0B' },
  { value: 'restless', label: '😤 Restless', color: '#EF4444' },
  { value: 'sick', label: '🤒 Sick', color: '#DC2626' },
];

const LOCATIONS = [
  { value: 'home', label: '🏠 Home' },
  { value: 'office', label: '🏢 Office' },
  { value: 'cafe', label: '☕ Café' },
  { value: 'other', label: '📍 Other' },
];

const NOISE_LEVELS = [
  { value: 'silent', label: '🔇 Silent' },
  { value: 'quiet', label: '🔉 Quiet' },
  { value: 'moderate', label: '🔊 Moderate' },
  { value: 'noisy', label: '📢 Noisy' },
];

export function EnergyCheckInModal({ isOpen, onClose, onCheckInComplete }: EnergyCheckInModalProps) {
  const [step, setStep] = useState(1);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [mood, setMood] = useState('focused');
  const [mentalClarity, setMentalClarity] = useState(3);
  const [physicalState, setPhysicalState] = useState('normal');
  const [location, setLocation] = useState('home');
  const [environmentNoise, setEnvironmentNoise] = useState('quiet');
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to track your state');
        return;
      }

      const stateData: UserState = {
        energyLevel,
        mood,
        mentalClarity,
        physicalState,
        location,
        environmentNoise,
        timeAvailable,
      };

      // Save to database
      const { error } = await supabase
        .from('user_states')
        .insert({
          user_id: user.id,
          energy_level: energyLevel,
          mood,
          mental_clarity: mentalClarity,
          physical_state: physicalState,
          location,
          environment_noise: environmentNoise,
          time_available: timeAvailable,
        });

      if (error) throw error;

      toast.success('✓ State captured! AI is analyzing your optimal tasks...');
      
      if (onCheckInComplete) {
        onCheckInComplete(stateData);
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving state:', error);
      toast.error('Failed to save state');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEnergyLevel(3);
    setMood('focused');
    setMentalClarity(3);
    setPhysicalState('normal');
    setLocation('home');
    setEnvironmentNoise('quiet');
    setTimeAvailable(60);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-3xl shadow-2xl border overflow-hidden relative"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderColor: "rgba(255, 255, 255, 0.6)",
          boxShadow: "0 20px 60px 0 rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-20 hover:bg-gray-100"
          style={{ color: "#6B7280" }}
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Step 1: Energy & Clarity */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#111827] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  How are you feeling?
                </h2>
                <p className="text-[#6B7280]">
                  Quick check-in so KAAL can recommend the perfect tasks
                </p>
              </div>

              {/* Energy Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <Zap className="w-4 h-4" />
                  Energy Level
                </label>
                <div className="flex justify-between gap-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setEnergyLevel(level)}
                      className="flex-1 p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden"
                      style={{
                        borderColor: energyLevel === level ? "#3B82F6" : "#E5E7EB",
                        backgroundColor: energyLevel === level ? "rgba(59, 130, 246, 0.1)" : "white",
                      }}
                    >
                      <div className="text-2xl mb-2">
                        {level === 1 ? "😴" : level === 2 ? "😐" : level === 3 ? "🙂" : level === 4 ? "😊" : "⚡"}
                      </div>
                      <div className="text-xs font-medium" style={{ color: "#6B7280" }}>
                        {level === 1 ? "Low" : level === 2 ? "Tired" : level === 3 ? "OK" : level === 4 ? "Good" : "High"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mental Clarity */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <Brain className="w-4 h-4" />
                  Mental Clarity
                </label>
                <div className="flex justify-between gap-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setMentalClarity(level)}
                      className="flex-1 p-4 rounded-xl border-2 transition-all duration-200"
                      style={{
                        borderColor: mentalClarity === level ? "#8B5CF6" : "#E5E7EB",
                        backgroundColor: mentalClarity === level ? "rgba(139, 92, 246, 0.1)" : "white",
                      }}
                    >
                      <div className="text-2xl mb-2">
                        {level === 1 ? "🌫️" : level === 2 ? "😵‍💫" : level === 3 ? "😐" : level === 4 ? "🎯" : "✨"}
                      </div>
                      <div className="text-xs font-medium" style={{ color: "#6B7280" }}>
                        {level === 1 ? "Foggy" : level === 2 ? "Fuzzy" : level === 3 ? "OK" : level === 4 ? "Clear" : "Sharp"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: "#111827" }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Mood & Physical State */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#111827] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  What's your mood?
                </h2>
                <p className="text-[#6B7280]">
                  Understanding your emotional state helps prioritize better
                </p>
              </div>

              {/* Mood Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <Heart className="w-4 h-4" />
                  Current Mood
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className="p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                      style={{
                        borderColor: mood === m.value ? m.color : "#E5E7EB",
                        backgroundColor: mood === m.value ? `${m.color}15` : "white",
                        color: mood === m.value ? m.color : "#6B7280",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical State */}
              <div>
                <label className="text-sm font-bold uppercase tracking-wider mb-4 block" style={{ color: "#6B7280" }}>
                  Physical State
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {PHYSICAL_STATES.map((state) => (
                    <button
                      key={state.value}
                      onClick={() => setPhysicalState(state.value)}
                      className="p-3 rounded-xl border-2 transition-all duration-200 text-xs font-medium"
                      style={{
                        borderColor: physicalState === state.value ? state.color : "#E5E7EB",
                        backgroundColor: physicalState === state.value ? `${state.color}15` : "white",
                        color: physicalState === state.value ? state.color : "#6B7280",
                      }}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl font-medium transition-all duration-200 border-2"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: "#111827" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Context */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#111827] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your work context
                </h2>
                <p className="text-[#6B7280]">
                  Let's optimize for your current environment
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.value}
                      onClick={() => setLocation(loc.value)}
                      className="p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                      style={{
                        borderColor: location === loc.value ? "#10B981" : "#E5E7EB",
                        backgroundColor: location === loc.value ? "rgba(16, 185, 129, 0.1)" : "white",
                        color: location === loc.value ? "#10B981" : "#6B7280",
                      }}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Noise Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <Volume2 className="w-4 h-4" />
                  Environment Noise
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {NOISE_LEVELS.map((noise) => (
                    <button
                      key={noise.value}
                      onClick={() => setEnvironmentNoise(noise.value)}
                      className="p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                      style={{
                        borderColor: environmentNoise === noise.value ? "#3B82F6" : "#E5E7EB",
                        backgroundColor: environmentNoise === noise.value ? "rgba(59, 130, 246, 0.1)" : "white",
                        color: environmentNoise === noise.value ? "#3B82F6" : "#6B7280",
                      }}
                    >
                      {noise.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Available */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#6B7280" }}>
                  <Clock className="w-4 h-4" />
                  Time Available: {timeAvailable} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={timeAvailable}
                  onChange={(e) => setTimeAvailable(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(timeAvailable / 240) * 100}%, #E5E7EB ${(timeAvailable / 240) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs mt-2" style={{ color: "#9CA3AF" }}>
                  <span>15 min</span>
                  <span>4 hours</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-xl font-medium transition-all duration-200 border-2"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#111827" }}
                >
                  {isSubmitting ? 'Analyzing...' : 'Complete Check-In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
