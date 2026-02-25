import { Component, ReactNode } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AIProvider } from "./context/AIContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SmartInsightsPanel } from "./components/SmartInsightsPanel";
import { SkipNavigation } from "./components/SkipNavigation";
import { Toaster } from "sonner@2.0.3";
import * as Sentry from "@sentry/react";

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Catches any uncaught JS error and shows it on screen instead of a blank page.
// This is the #1 debugging aid — copy the red box text and share it.
// Now integrated with Sentry for automatic error tracking.

interface EBState { error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    // Send error to Sentry
    Sentry.captureException(error);
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log additional context to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', background: '#FFF1F2', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
        fontFamily: 'monospace',
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', border: '2px solid #FCA5A5',
          padding: '32px', maxWidth: '800px', width: '100%',
          boxShadow: '0 4px 24px rgba(220,38,38,0.12)',
        }}>
          <div style={{ color: '#DC2626', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            ⚠ App crashed — copy this and share it
          </div>
          <div style={{
            background: '#FEF2F2', borderRadius: '8px', padding: '16px',
            color: '#7F1D1D', fontSize: '13px', wordBreak: 'break-all',
            whiteSpace: 'pre-wrap', marginBottom: '16px',
            border: '1px solid #FECACA',
          }}>
            <strong>{error.name}: {error.message}</strong>
          </div>
          {error.stack && (
            <details open>
              <summary style={{ color: '#B91C1C', cursor: 'pointer', marginBottom: '8px' }}>
                Stack trace
              </summary>
              <div style={{
                background: '#FEF2F2', borderRadius: '8px', padding: '12px',
                color: '#991B1B', fontSize: '11px', wordBreak: 'break-all',
                whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '300px',
                border: '1px solid #FECACA',
              }}>
                {error.stack}
              </div>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px', background: '#DC2626', color: 'white',
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <ProfileProvider>
            <AIProvider>
              <div>
                <SkipNavigation />
                <RouterProvider router={router} />
                <SmartInsightsPanel />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    className: 'font-sans',
                    style: { fontFamily: 'Inter, sans-serif' },
                  }}
                />
              </div>
            </AIProvider>
          </ProfileProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}