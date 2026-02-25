import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  setupOneSignal,
  initializeOneSignal
} from '../lib/oneSignalService';
import { supabase } from '../services/supabase-client';

/**
 * Notification Permission Prompt
 * Shows after first check-in, asks user to enable notifications
 * Follows UX best practices: custom prompt before browser default
 */
export function NotificationPermissionPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    // Check if already has permission
    const hasPermission = await hasNotificationPermission();
    if (hasPermission) return;

    // Check if we should show (not dismissed in last 7 days)
    const shouldShow = shouldShowPermissionPrompt();
    if (!shouldShow) return;

    // Check if user has completed at least one check-in
    const { data: checkins } = await supabase
      .from('energy_checkins')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (checkins && checkins.length > 0) {
      setIsVisible(true);
    }
  };

  const handleAllow = async () => {
    if (!userId) return;

    const playerId = await requestNotificationPermission(userId);
    if (playerId) {
      setIsVisible(false);
    } else {
      // Permission denied
      dismissPermissionPrompt();
      setIsVisible(false);
    }
  };

  const handleMaybeLater = () => {
    dismissPermissionPrompt();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
          style={{ width: '400px' }}
        >
          <div
            className="rounded-3xl p-6 border shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow:
                '0 20px 60px -10px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleMaybeLater}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                }}
              >
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3
                  className="text-lg font-medium"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: '#111827',
                  }}
                >
                  Stay on Track
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  KAAL works best when it can reach you
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#374151' }}>
              KAAL will send you smart, timely nudges to help you stay focused
              and maintain your streak. Only when it matters.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAllow}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-lg active:scale-95"
                style={{ background: '#111827', color: 'white' }}
              >
                Yes, keep me on track
              </button>
              <button
                onClick={handleMaybeLater}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  color: '#6B7280',
                }}
              >
                Maybe later
              </button>
            </div>

            {/* Privacy note */}
            <p
              className="text-xs mt-4 text-center"
              style={{ color: '#9CA3AF' }}
            >
              You can change this anytime in Settings
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}