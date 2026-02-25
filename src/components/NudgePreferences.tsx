import { useState, useEffect } from 'react';
import { Bell, BellOff, Sparkles, Check, X } from 'lucide-react';
import {
  setupNudgePermissions,
  getNudgePermissionStatus,
  sendProactiveNudge,
  sendReengagementNudge,
  sendMilestoneNudge,
  sendTimingNudge,
  sendAutoNudge
} from '../services/local-nudge-service';
import { supabase } from '../services/supabase-client';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

export function NudgePreferences() {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [nudgeSettings, setNudgeSettings] = useState({
    proactive: true,
    reengagement: true,
    milestone: true,
    timing: true
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  useEffect(() => {
    setPermissionStatus(getNudgePermissionStatus());
    loadUserId();
    loadNudgeSettings();
  }, []);

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadNudgeSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('nudge_preferences')
      .eq('id', user.id)
      .single();

    if (profile?.nudge_preferences) {
      setNudgeSettings(profile.nudge_preferences);
    }
  };

  const saveNudgeSettings = async (settings: typeof nudgeSettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ nudge_preferences: settings })
      .eq('id', user.id);

    toast.success('Nudge preferences saved');
  };

  const handleEnableNotifications = async () => {
    const granted = await setupNudgePermissions();
    if (granted) {
      setPermissionStatus('granted');
      toast.success('Notifications enabled! KAAL can now nudge you.');
    } else {
      setPermissionStatus('denied');
      toast.error('Notifications blocked. Check your browser settings.');
    }
  };

  const toggleNudgeType = (type: keyof typeof nudgeSettings) => {
    const newSettings = { ...nudgeSettings, [type]: !nudgeSettings[type] };
    setNudgeSettings(newSettings);
    saveNudgeSettings(newSettings);
  };

  const handleTestNudge = async (type: 'proactive' | 'reengagement' | 'milestone' | 'timing' | 'auto') => {
    if (!userId) {
      toast.error('Not logged in');
      return;
    }

    if (permissionStatus !== 'granted') {
      toast.error('Enable notifications first');
      return;
    }

    try {
      switch (type) {
        case 'proactive':
          await sendProactiveNudge(userId);
          break;
        case 'reengagement':
          await sendReengagementNudge(userId);
          break;
        case 'milestone':
          await sendMilestoneNudge(userId);
          break;
        case 'timing':
          await sendTimingNudge(userId);
          break;
        case 'auto':
          await sendAutoNudge(userId);
          break;
      }
      toast.success(`Test ${type} nudge sent!`);
    } catch (error) {
      toast.error('Failed to send nudge');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div
        className="rounded-3xl p-6 border"
        style={{
          background: permissionStatus === 'granted' 
            ? 'rgba(16, 185, 129, 0.05)' 
            : 'rgba(239, 68, 68, 0.05)',
          borderColor: permissionStatus === 'granted'
            ? 'rgba(16, 185, 129, 0.2)'
            : 'rgba(239, 68, 68, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: permissionStatus === 'granted' ? '#ECFDF5' : '#FEF2F2',
                color: permissionStatus === 'granted' ? '#10B981' : '#EF4444'
              }}
            >
              {permissionStatus === 'granted' ? (
                <Bell className="w-6 h-6" />
              ) : (
                <BellOff className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold" style={{ color: '#111827' }}>
                Browser Notifications
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                {permissionStatus === 'granted' && 'Enabled • KAAL can send nudges'}
                {permissionStatus === 'denied' && 'Blocked • Check browser settings'}
                {permissionStatus === 'default' && 'Not enabled yet'}
              </p>
            </div>
          </div>
          
          {permissionStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md active:scale-95"
              style={{ background: '#111827', color: 'white' }}
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Nudge Type Toggles */}
      {permissionStatus === 'granted' && (
        <div
          className="rounded-3xl p-6 border space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            borderColor: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <h3 className="font-bold mb-4" style={{ color: '#111827' }}>
            Nudge Types
          </h3>

          <NudgeToggle
            label="Proactive Nudges"
            description="Reminds you to work when energy is high"
            enabled={nudgeSettings.proactive}
            onToggle={() => toggleNudgeType('proactive')}
            emoji="⚡"
          />

          <NudgeToggle
            label="Re-engagement"
            description="Brings you back after being away"
            enabled={nudgeSettings.reengagement}
            onToggle={() => toggleNudgeType('reengagement')}
            emoji="🔔"
          />

          <NudgeToggle
            label="Milestones"
            description="Celebrates your wins and streaks"
            enabled={nudgeSettings.milestone}
            onToggle={() => toggleNudgeType('milestone')}
            emoji="🎉"
          />

          <NudgeToggle
            label="Smart Timing"
            description="Nudges at your peak productivity times"
            enabled={nudgeSettings.timing}
            onToggle={() => toggleNudgeType('timing')}
            emoji="🎯"
          />
        </div>
      )}

      {/* Test Panel */}
      {permissionStatus === 'granted' && (
        <div
          className="rounded-3xl p-6 border"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            borderColor: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" style={{ color: '#667EEA' }} />
              <span className="font-bold" style={{ color: '#111827' }}>
                Test Nudges
              </span>
            </div>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              {showTestPanel ? 'Hide' : 'Show'}
            </span>
          </button>

          <AnimatePresence>
            {showTestPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2"
              >
                <TestButton label="Auto-Select" onClick={() => handleTestNudge('auto')} />
                <TestButton label="Proactive" onClick={() => handleTestNudge('proactive')} />
                <TestButton label="Re-engagement" onClick={() => handleTestNudge('reengagement')} />
                <TestButton label="Milestone" onClick={() => handleTestNudge('milestone')} />
                <TestButton label="Timing" onClick={() => handleTestNudge('timing')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Info Card */}
      <div
        className="rounded-2xl p-4 text-xs"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          color: '#6B7280'
        }}
      >
        <p className="leading-relaxed">
          <strong style={{ color: '#111827' }}>💡 How it works:</strong> KAAL uses a local template-based algorithm with 75+ witty, personalized notifications. No API costs, no latency, and your data never leaves your browser. Nudges are selected based on your energy levels, task patterns, and timing.
        </p>
      </div>
    </div>
  );
}

function NudgeToggle({
  label,
  description,
  enabled,
  onToggle,
  emoji
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  emoji: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl border transition-colors"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.5)'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h4 className="text-sm font-bold" style={{ color: '#111827' }}>
            {label}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="relative inline-block w-11 h-6 cursor-pointer"
        role="switch"
        aria-checked={enabled}
      >
        <div
          className="absolute top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-400"
          style={{
            backgroundColor: enabled ? '#111827' : '#E5E7EB',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
          }}
        />
        <div
          className="absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-400"
          style={{
            transform: enabled ? 'translateX(20px)' : 'translateX(0)',
            boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2)'
          }}
        />
      </button>
    </div>
  );
}

function TestButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl text-sm font-medium transition-all text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        color: '#111827'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
      }}
    >
      Test {label}
    </button>
  );
}