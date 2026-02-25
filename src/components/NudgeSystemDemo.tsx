import { useState } from 'react';
import { Sparkles, Zap, TrendingUp, Target, Code } from 'lucide-react';
import { motion } from 'motion/react';

export function NudgeSystemDemo() {
  const [selectedCategory, setSelectedCategory] = useState<'proactive' | 're-engagement' | 'milestone' | 'timing'>('proactive');

  const examples = {
    proactive: [
      "That report isn't going to write itself. Your energy is high right now — this is actually the best possible moment.",
      "You've got 7 tasks queued and your focus window is open. Now's the time.",
      "Your brain is at peak capacity right now. Open KAAL and channel it into that presentation.",
      "Task: quarterly review. Energy: high. Time: now. Let's go.",
      "You scheduled this block for deep work. KAAL is ready when you are."
    ],
    're-engagement': [
      "Your tasks haven't moved. Your deadlines have. KAAL misses you — and so does that project proposal.",
      "Yesterday you were running on fumes. Today might be different. Come check in — 10 seconds.",
      "KAAL has been rearranging your tasks in your absence. Some of them are getting impatient.",
      "Those emails are still there. They've started forming a union.",
      "It's been 18 hours. Quick check-in? Your energy report is ready."
    ],
    milestone: [
      "You cleared 5 tasks yesterday. That's a top 10% day. Today's lineup is ready.",
      "You've checked in 7 days straight. KAAL is starting to really know you.",
      "Yesterday you were unstoppable. Today is a blank canvas. Let's not waste it.",
      "Week 2 of showing up. You're not the same person who started KAAL.",
      "You finished everything yesterday. Rare air. Can you do it again?"
    ],
    timing: [
      "Your Tuesday mornings are historically your best. It's 8:55 AM. KAAL's ready when you are.",
      "You always crush it on Wednesday afternoons. Today won't be different.",
      "It's 9:00 AM. Your data says this is prime time. Let's not waste it.",
      "You've completed your biggest wins at this exact hour. History's repeating — open KAAL.",
      "Mondays are your power day. Statistically. Let's add to the streak."
    ]
  };

  const categories = [
    { key: 'proactive' as const, label: 'Proactive', icon: Zap, color: '#F59E0B' },
    { key: 're-engagement' as const, label: 'Re-engagement', icon: Target, color: '#667EEA' },
    { key: 'milestone' as const, label: 'Milestone', icon: TrendingUp, color: '#10B981' },
    { key: 'timing' as const, label: 'Smart Timing', icon: Sparkles, color: '#EC4899' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-4xl font-medium italic"
          style={{ fontFamily: "'Playfair Display', serif", color: '#111827' }}
        >
          Local Nudge System
        </h2>
        <p className="mt-2 text-sm" style={{ color: '#9CA3AF' }}>
          75+ witty notification templates, zero API costs, 100% privacy-first
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                border: isActive ? `1px solid ${cat.color}20` : '1px solid rgba(0, 0, 0, 0.08)',
                color: isActive ? cat.color : '#6B7280'
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Examples */}
      <motion.div
        key={selectedCategory}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {examples[selectedCategory].map((text, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#111827' }}>
              "{text}"
            </p>
          </div>
        ))}
      </motion.div>

      {/* How It Works */}
      <div
        className="rounded-3xl p-6 border"
        style={{
          background: 'rgba(102, 126, 234, 0.05)',
          borderColor: 'rgba(102, 126, 234, 0.2)'
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Code className="w-6 h-6 flex-shrink-0" style={{ color: '#667EEA' }} />
          <div>
            <h3 className="font-bold" style={{ color: '#111827' }}>
              How the Algorithm Works
            </h3>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Smart template selection based on user context
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs" style={{ color: '#6B7280' }}>
          <div className="flex gap-3">
            <div className="font-bold" style={{ color: '#667EEA', minWidth: '20px' }}>1.</div>
            <div>
              <strong style={{ color: '#111827' }}>Context Building:</strong> Analyze user's energy level, pending tasks, completion history, time of day, day of week, and engagement patterns
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold" style={{ color: '#667EEA', minWidth: '20px' }}>2.</div>
            <div>
              <strong style={{ color: '#111827' }}>Template Matching:</strong> Filter 75+ templates based on conditions (energy, timing, task counts, streaks, etc.)
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold" style={{ color: '#667EEA', minWidth: '20px' }}>3.</div>
            <div>
              <strong style={{ color: '#111827' }}>Confidence Scoring:</strong> Calculate match quality (0-1 score) for each viable template
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold" style={{ color: '#667EEA', minWidth: '20px' }}>4.</div>
            <div>
              <strong style={{ color: '#111827' }}>Smart Selection:</strong> Pick from top 3 candidates randomly (quality + variety)
            </div>
          </div>
          <div className="flex gap-3">
            <div className="font-bold" style={{ color: '#667EEA', minWidth: '20px' }}>5.</div>
            <div>
              <strong style={{ color: '#111827' }}>Variable Filling:</strong> Replace placeholders with real data (task names, counts, times, etc.)
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BenefitCard
          icon="💰"
          title="Zero API Costs"
          description="No Gemini API fees. All processing happens locally in the browser."
        />
        <BenefitCard
          icon="⚡"
          title="Instant Delivery"
          description="No network latency. Notifications fire immediately without API calls."
        />
        <BenefitCard
          icon="🔒"
          title="Privacy First"
          description="Your data never leaves your browser. Completely private and secure."
        />
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      className="p-5 rounded-2xl border text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.8)'
      }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-bold mb-1" style={{ color: '#111827' }}>{title}</h4>
      <p className="text-xs" style={{ color: '#6B7280' }}>{description}</p>
    </div>
  );
}
