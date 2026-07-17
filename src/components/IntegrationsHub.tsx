/**
 * IntegrationsHub — manage all external service connections
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, ExternalLink, RefreshCw, Zap, Lock } from 'lucide-react';
import { integrationHub, IntegrationMeta } from '../services/integration-hub';
import { toast } from 'sonner';

const F = {
  display: 'var(--font-display)',
  serif:   "'Playfair Display', serif",
  mono:    'var(--font-mono)',
};
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.4)',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)',
};

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6B7280', fontFamily: F.display }}>{children}</p>;
}

const STATUS_CONFIG = {
  connected:    { label: 'Connected',    dot: 'bg-green-500', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  demo:         { label: 'Demo Mode',    dot: 'bg-amber-400', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  connecting:   { label: 'Connecting…',  dot: 'bg-blue-400 animate-pulse', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  disconnected: { label: 'Disconnected', dot: 'bg-gray-300',  color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  error:        { label: 'Error',        dot: 'bg-red-400',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

function IntegrationCard({ integration, onToggle }: { integration: IntegrationMeta; onToggle: (id: string) => void }) {
  const sc = STATUS_CONFIG[integration.status];
  const isActive = integration.status === 'connected' || integration.status === 'demo';
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-md"
      style={{ ...GLASS }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = GLASS.boxShadow as string; }}>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white shadow-sm border border-gray-100 flex-shrink-0">
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium" style={{ color: '#111827', fontFamily: F.display }}>{integration.name}</p>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border"
                style={{ background: sc.bg, borderColor: sc.border, color: sc.color, fontFamily: F.display }}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: '#6B7280', maxWidth: 'none' }}>{integration.description}</p>
            {integration.lastSynced && (
              <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: F.mono }}>
                Last sync: {integration.lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1.5 text-xs font-medium mt-4 hover:opacity-70 transition-opacity" style={{ color: '#9CA3AF', fontFamily: F.display }}>
          {expanded ? 'Less' : 'Capabilities'} <motion.span animate={{ rotate: expanded ? 180 : 0 }}><RefreshCw className="w-3 h-3" /></motion.span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 grid grid-cols-2 gap-2">
                {integration.capabilities.map(cap => (
                  <div key={cap} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: integration.color }} />
                    <span className="text-xs" style={{ color: '#374151' }}>{cap}</span>
                  </div>
                ))}
              </div>
              {integration.scopes.length > 0 && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Lock className="w-3 h-3 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: F.display }}>Scopes: {integration.scopes.join(', ')}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onToggle(integration.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              fontFamily: F.display,
              background: isActive ? 'rgba(255,255,255,0.6)' : '#111827',
              borderColor: isActive ? 'rgba(0,0,0,0.08)' : '#111827',
              color: isActive ? '#374151' : 'white',
              boxShadow: isActive ? 'none' : '0 10px 15px -3px rgba(17,24,39,0.2)',
            }}>
            {isActive ? (<><X className="w-3.5 h-3.5" />Disconnect</>) : (<><ExternalLink className="w-3.5 h-3.5" />Connect</>)}
          </button>
          {isActive && (
            <button className="px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all hover:shadow-sm"
              style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.08)', color: '#374151', fontFamily: F.display }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<IntegrationMeta[]>([]);

  useEffect(() => { setIntegrations(integrationHub.getAll()); }, []);

  const handleToggle = (id: string) => {
    const intg = integrations.find(i => i.id === id);
    if (!intg) return;
    if (intg.status === 'connected' || intg.status === 'demo') {
      integrationHub.disconnect(id);
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'disconnected', lastSynced: null } : i));
      toast.info(`${intg.name} disconnected`);
    } else {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'connecting' } : i));
      integrationHub.connect(id);
      setTimeout(() => {
        setIntegrations(integrationHub.getAll());
        toast.success(`${intg.name} connected in demo mode`, { description: 'Connect your real account in Settings → Integrations for live data.' });
      }, 1200);
    }
  };

  const connected = integrations.filter(i => i.status === 'connected' || i.status === 'demo');
  const available = integrations.filter(i => i.status !== 'connected' && i.status !== 'demo');

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="p-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Title */}
          <div>
            <h2 className="text-3xl font-medium tracking-tight italic" style={{ fontFamily: F.serif, color: '#111827' }}>
              Integrations
            </h2>
            <p className="mt-1 text-sm font-light" style={{ color: '#6B7280', maxWidth: 'none' }}>
              Connect your tools so KAAL can act across your entire workflow — not just inside KAAL.
            </p>
          </div>

          {/* What KAAL does with integrations */}
          <div className="p-6 rounded-3xl border" style={{ ...GLASS }}>
            <Label>How integrations power the agent</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { icon: '🎯', title: 'Cross-app task creation', desc: 'Extract tasks from Gmail threads, Notion pages, or Slack messages automatically.' },
                { icon: '📅', title: 'Intelligent scheduling', desc: 'Block focus time around your calendar before meetings fill the day.' },
                { icon: '🎵', title: 'Focus signal from Spotify', desc: 'Your playlist tempo and genre tells KAAL when you\'re in deep work — and suppresses interruptions.' },
                { icon: '✍️', title: 'Draft replies for you', desc: 'KAAL drafts email replies, meeting agendas, and Notion pages — you review and send.' },
                { icon: '🔔', title: 'Proactive nudges with context', desc: 'Nudges reference what\'s actually in your calendar and inbox — not generic reminders.' },
                { icon: '🏆', title: 'Celebrate across everything', desc: 'Win events fire when you complete tasks, hit streaks, or finish a challenging week.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.05)' }}>
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#111827', maxWidth: 'none', fontFamily: F.display }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280', maxWidth: 'none' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected */}
          {connected.length > 0 && (
            <div>
              <Label>Connected</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {connected.map(i => <IntegrationCard key={i.id} integration={i} onToggle={handleToggle} />)}
              </div>
            </div>
          )}

          {/* Available */}
          {available.length > 0 && (
            <div>
              <Label>Available to Connect</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {available.map(i => <IntegrationCard key={i.id} integration={i} onToggle={handleToggle} />)}
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-start gap-4 p-5 rounded-3xl border" style={{ background: 'rgba(255,255,255,0.3)', borderColor: 'rgba(0,0,0,0.06)' }}>
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
            <p className="text-xs" style={{ color: '#9CA3AF', maxWidth: 'none' }}>
              KAAL reads your data locally — emails and calendar events are processed on your device.
              No content is sent to third-party servers. OAuth tokens are stored in your Supabase account and never shared.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
