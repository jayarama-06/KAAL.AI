/**
 * Sentry Error Test Button
 * Add this component to any screen to test Sentry error tracking
 * 
 * Usage:
 * import { SentryErrorTestButton } from './components/SentryErrorTestButton';
 * 
 * Then in your component:
 * <SentryErrorTestButton />
 */

import * as Sentry from '@sentry/react';
import { AlertTriangle, Activity } from 'lucide-react';

export function SentryErrorTestButton() {
  const handleTestError = () => {
    // Send a log before throwing the error
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_button_click',
      timestamp: new Date().toISOString(),
    });
    
    // Send a test metric before throwing the error
    Sentry.metrics.count('test_counter', 1);
    
    // Throw test error
    throw new Error('🧪 KAAL Sentry Test Error - This is intentional!');
  };

  const handleTestLog = () => {
    // Test logging without throwing an error
    Sentry.logger.info('Test log message from KAAL', {
      feature: 'sentry-integration',
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureMessage('Test message capture', 'info');
    
    alert('✅ Test log sent to Sentry! Check your Sentry dashboard.');
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div 
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: "rgba(59, 130, 246, 0.05)",
          borderColor: "rgba(59, 130, 246, 0.2)",
        }}
      >
        <p className="text-sm" style={{ color: "#1E40AF" }}>
          <strong>Sentry is configured!</strong> Use these buttons to test error tracking and logging.
          Errors will appear in your Sentry dashboard within seconds.
        </p>
      </div>

      {/* Test Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Error Button */}
        <button
          onClick={handleTestError}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          }}
        >
          <AlertTriangle className="w-5 h-5" />
          Test Error Tracking
        </button>

        {/* Test Log Button */}
        <button
          onClick={handleTestLog}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          }}
        >
          <Activity className="w-5 h-5" />
          Test Log Messages
        </button>
      </div>

      {/* Instructions */}
      <div className="text-xs space-y-2" style={{ color: "#6B7280" }}>
        <p><strong>Test Error Tracking:</strong> Throws an intentional error to test Sentry's crash reporting.</p>
        <p><strong>Test Log Messages:</strong> Sends info logs without crashing (check Sentry dashboard).</p>
        <p className="pt-2" style={{ color: "#9CA3AF" }}>
          💡 After testing, check your{' '}
          <a 
            href="https://sentry.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            style={{ color: "#3B82F6" }}
          >
            Sentry dashboard
          </a>
          {' '}to see the captured events.
        </p>
      </div>
    </div>
  );
}