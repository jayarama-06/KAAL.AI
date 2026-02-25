/**
 * Clarity Status Indicator
 * Shows a small badge when Clarity is actively recording
 * Only visible in development mode
 */

import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { isClarityAvailable } from '../services/clarity-service';

export function ClarityStatusIndicator() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Only show in development
    if (window.location.hostname !== 'localhost') {
      return;
    }

    // Check if Clarity is loaded
    const checkClarity = setInterval(() => {
      if (isClarityAvailable()) {
        setIsActive(true);
        clearInterval(checkClarity);
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkClarity), 10000);

    return () => clearInterval(checkClarity);
  }, []);

  // Don't show in production or if not loaded
  if (!isActive || window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        color: 'white',
      }}
      title="Microsoft Clarity is recording this session"
    >
      <Video className="w-3 h-3 animate-pulse" />
      <span>Recording</span>
    </div>
  );
}
