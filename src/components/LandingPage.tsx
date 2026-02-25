import { Link } from 'react-router';
import { 
  ArrowRight, 
  PlayCircle, 
  Lock, 
  Check,
  Star
} from 'lucide-react';

export function LandingPage() {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }} className="antialiased bg-[#F8F9FA] text-[#1A1A1E] overflow-x-hidden selection:bg-[#1A1A1E] selection:text-white">
      {/* Noise overlay */}
      <div className="fixed inset-0 bg-noise opacity-50 pointer-events-none z-50 mix-blend-overlay" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center backdrop-blur-md bg-white/70 rounded-2xl px-6 py-3 shadow-glass-sm border border-white/50">
          <div className="flex items-center gap-2">
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="w-8 h-8 bg-[#1A1A1E] text-white rounded-lg flex items-center justify-center font-bold text-xl">
              K
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif' }} className="font-semibold text-lg tracking-tight text-[#1A1A1E]">KAAL</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-[#9CA3AF]">
            <a href="#features" className="hover:text-[#1A1A1E] transition-colors">
              Features
            </a>
            <a href="#methodology" className="hover:text-[#1A1A1E] transition-colors">
              Methodology
            </a>
            <a href="#pricing" className="hover:text-[#1A1A1E] transition-colors">
              Pricing
            </a>
          </div>
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-[#1A1A1E] text-white text-sm font-medium hover:bg-[#0A0A0B] transition-colors shadow-lg shadow-[#E5E7EB]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-70" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-[#9CA3AF] tracking-wide uppercase">
              v2.0 Now Available
            </span>
          </div>

          {/* Hero Title with character animation */}
          <h1 style={{ fontFamily: 'Playfair Display, serif' }} className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] text-[#1A1A1E] tracking-tight mb-8">
            <span className="block overflow-hidden mb-4">
              <span className="text-reveal-char" style={{ animationDelay: '0.1s' }}>M</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.15s' }}>a</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.2s' }}>s</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.25s' }}>t</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.3s' }}>e</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.35s' }}>r</span>
              <span className="inline-block w-4" />
              <span className="text-reveal-char" style={{ animationDelay: '0.4s' }}>t</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.45s' }}>h</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.5s' }}>e</span>
            </span>
            <span className="block overflow-hidden italic text-[#9CA3AF]">
              <span className="text-reveal-char" style={{ animationDelay: '0.6s' }}>A</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.65s' }}>r</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.7s' }}>t</span>
              <span className="inline-block w-4" />
              <span className="text-reveal-char" style={{ animationDelay: '0.75s' }}>o</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.8s' }}>f</span>
              <span className="inline-block w-4" />
              <span className="text-reveal-char" style={{ animationDelay: '0.85s' }}>F</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.9s' }}>o</span>
              <span className="text-reveal-char" style={{ animationDelay: '0.95s' }}>c</span>
              <span className="text-reveal-char" style={{ animationDelay: '1.0s' }}>u</span>
              <span className="text-reveal-char" style={{ animationDelay: '1.05s' }}>s</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
            A cognitive environment engineered for deep work. Silence the noise and amplify your output with AI-driven flow states.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '1.4s' }}>
            <Link
              to="/signup"
              className="liquid-hover px-8 py-4 bg-[#1A1A1E] text-white rounded-xl font-medium shadow-glow-btn transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-white text-[#1A1A1E] rounded-xl font-medium hover:bg-white transition-colors flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Watch Manifest
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative w-full max-w-6xl mx-auto mt-20 px-4 perspective-1000 group opacity-0 animate-fade-in-up" style={{ animationDelay: '1.6s' }}>
          <div className="relative z-10 rounded-2xl bg-[#0A0A0B] p-2 shadow-2xl shadow-black/20 ring-1 ring-white/10 transform transition-transform duration-700 hover:rotate-x-2 animate-float">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0A0A0B] rounded-t-xl">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div style={{ fontFamily: 'monospace' }} className="ml-4 px-3 py-1 rounded-md bg-[#1A1A1E] text-[10px] text-[#9CA3AF] flex items-center gap-2">
                <Lock className="w-2.5 h-2.5" />
                kaal.app/dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div className="relative bg-[#0A0A0B] aspect-[16/10] overflow-hidden rounded-b-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/10 to-[#A78BFA]/10" />
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-16 border-r border-white/5 bg-[#0A0A0B]/50 flex flex-col items-center py-6 gap-6">
                  <div className="w-8 h-8 rounded bg-white/10" />
                  <div className="w-8 h-8 rounded bg-white/5" />
                  <div className="w-8 h-8 rounded bg-white/5" />
                </div>

                {/* Main content */}
                <div className="flex-1 p-8">
                  <div className="flex justify-between items-center mb-12">
                    <div className="space-y-2">
                      <div className="h-8 w-64 bg-white/10 rounded" />
                      <div className="h-4 w-40 bg-white/5 rounded" />
                    </div>
                    <div className="h-10 w-32 bg-[#6366F1]/20 border border-[#6366F1]/30 rounded-lg" />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <div className="h-48 bg-white/5 rounded-xl border border-white/5 p-6 relative overflow-hidden">
                        <svg className="absolute bottom-0 left-0 w-full h-32 text-[#6366F1]/50" preserveAspectRatio="none" viewBox="0 0 100 40">
                          <path d="M0,40 Q20,35 40,20 T100,10 V40 H0 Z" fill="currentColor" />
                          <path d="M0,40 Q20,35 40,20 T100,10" fill="none" stroke="#6366F1" strokeWidth="0.5" />
                        </svg>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                        <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-2xl" />
            </div>
          </div>

          {/* Floating orbs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#A5B4FC]/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#A78BFA]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
      </header>

      {/* Logo Section */}
      <section className="py-20 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-[#9CA3AF] mb-12 uppercase tracking-widest">
            Powering Focus For
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="h-10 bg-[#E5E7EB]/50 rounded flex items-center justify-center font-bold text-[#9CA3AF]">VERTEX</div>
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="h-10 bg-[#E5E7EB]/50 rounded flex items-center justify-center font-bold text-[#9CA3AF]">NOVA</div>
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="h-10 bg-[#E5E7EB]/50 rounded flex items-center justify-center font-bold text-[#9CA3AF]">FLUX</div>
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="h-10 bg-[#E5E7EB]/50 rounded flex items-center justify-center font-bold text-[#9CA3AF]">HORIZON</div>
            <div style={{ fontFamily: 'Playfair Display, serif' }} className="hidden lg:flex h-10 bg-[#E5E7EB]/50 rounded items-center justify-center font-bold text-[#9CA3AF]">ZENITH</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl font-normal text-[#1A1A1E] mb-6">Engineered for Flow.</h2>
            <p className="text-[#9CA3AF] text-lg">
              Every pixel of KAAL is designed to reduce friction and increase cognitive momentum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* AI Brain Dump - Large card */}
            <div className="md:col-span-2 row-span-1 md:row-span-2 group relative overflow-hidden rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB] p-8 hover:shadow-glass-lg transition-all duration-500">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-2xl font-medium mb-3 text-[#1A1A1E]">AI Brain Dump</h3>
                  <p className="text-[#9CA3AF] max-w-sm">
                    Unload your thoughts instantly. Our AI sorts, categorizes, and schedules tasks based on your energy levels.
                  </p>
                </div>
                <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-4 border border-[#E5E7EB] shadow-sm w-3/4 self-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex-shrink-0" />
                    <div className="space-y-2 w-full">
                      <div className="h-2 bg-[#E5E7EB] rounded w-full" />
                      <div className="h-2 bg-[#E5E7EB] rounded w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#EEF2FF]/50 to-transparent" />
            </div>

            {/* Energy Wave */}
            <div className="group relative overflow-hidden rounded-3xl bg-[#0A0A0B] text-white p-8 hover:shadow-glass-lg transition-all duration-500">
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl font-medium mb-2">Energy Wave</h3>
                <p className="text-[#9CA3AF] text-sm">Work when you're peaking. Rest when you're not.</p>
                <div className="mt-auto h-24 w-full relative">
                  <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                    <path d="M0,50 Q25,10 50,50 T100,50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    <path className="group-hover:animate-draw" d="M0,50 Q25,10 50,50 T100,50" fill="none" stroke="#A5B4FC" strokeDasharray="100" strokeDashoffset="100" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Context Save */}
            <div className="group relative overflow-hidden rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB] p-8 hover:shadow-glass-lg transition-all duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif' }} className="text-xl font-medium mb-2 text-[#1A1A1E]">Context Save</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Pause any project. Resume exactly where you left off, windows and all.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualization Section */}
      <section className="py-32 bg-[#0A0A0B] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-noise" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4338CA]/30 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-4xl md:text-5xl font-medium mb-8 leading-tight">
              Visualize your <br />
              <span className="text-[#A5B4FC] italic">potential.</span>
            </h2>
            <p className="text-[#9CA3AF] text-lg mb-8 leading-relaxed">
              Most tools track time. KAAL tracks impact. See your focus depth correlate directly with output quality through our proprietary visualization engine.
            </p>
            <ul className="space-y-6">
              {['Deep Work Analysis', 'Distraction Blocking', 'Flow State Triggers'].map((item) => (
                <li key={item} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full border border-[#1A1A1E] flex items-center justify-center group-hover:bg-[#6366F1] group-hover:border-[#6366F1] transition-colors">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-medium group-hover:text-[#A5B4FC] transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chart visualization */}
          <div className="relative h-[400px] bg-[#0A0A0B]/50 rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="absolute top-6 right-6 flex gap-2">
              <div className="px-3 py-1 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] text-xs border border-[#6366F1]/30">
                Focus Depth
              </div>
              <div className="px-3 py-1 rounded-full bg-[#1A1A1E]/50 text-[#9CA3AF] text-xs border border-[#1A1A1E]/30">
                Time
              </div>
            </div>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 300">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#A5B4FC" stopOpacity="1" />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur result="blur" stdDeviation="4" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <line x1="0" y1="280" x2="400" y2="280" stroke="#1A1A1E" strokeWidth="1" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#1A1A1E" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="#1A1A1E" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <path
                className="animate-draw-infinite"
                d="M0,280 C50,280 80,200 120,180 C160,160 180,220 220,150 C260,80 300,100 340,60 C360,40 380,50 400,20"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                filter="url(#glow)"
              />
              <circle cx="220" cy="150" r="4" fill="#fff" className="animate-ping-slow" />
              <circle cx="340" cy="60" r="4" fill="#fff" className="animate-ping-slow" style={{ animationDelay: '1.5s' }} />
            </svg>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#F8F9FA] relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-center text-3xl font-normal mb-16 text-[#1A1A1E]">The Quiet Revolution</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-white/60 shadow-glass-sm hover:shadow-glass-lg transition-all duration-300">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[#1A1A1E] text-lg italic mb-6">
                "I didn't realize how much cognitive overhead my old tools were creating until I switched to KAAL. It's like noise-canceling headphones for your workflow."
              </p>
              <div className="flex items-center gap-4">
                <img
                  alt="User"
                  className="w-12 h-12 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_OfCDo0PLMPHDvHPmHKfTBEfqkEEIRCDom2pKZWdJf-zqSKp_GfFQUN82F2LOjoEGA5p-Y75yVWlanerTGIDSbqIL-GUGCTLxsufd6Tp5332zwjKFzqon0cDBFphzUaqtv9ZhTzw42sYWkXVQo9-6YXN45lS_0Z2GZhvrctVhAwE1s5U_caiN0vWHMS-C9hS3ajf6zs0hao0c_BNREs6QbhWoGXpi-Xi6ueK_FzNrLGbzN8scpPivvhZ9naoYjbOfLa_lhx-AnJM"
                />
                <div>
                  <div className="font-bold text-sm text-[#1A1A1E]">Elena Rostova</div>
                  <div className="text-xs text-[#9CA3AF]">Product Director, Apex</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-white/60 shadow-glass-sm hover:shadow-glass-lg transition-all duration-300 md:translate-y-12">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p style={{ fontFamily: 'Playfair Display, serif' }} className="text-[#1A1A1E] text-lg italic mb-6">
                "The Energy Wave feature changed my life. I finally understand my own circadian rhythm and work with it, not against it."
              </p>
              <div className="flex items-center gap-4">
                <img
                  alt="User"
                  className="w-12 h-12 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7KOSi-XgaFIHMzbqZo3TFpC438nNbqT-u7D8WT3DwE6jfGVNFJLHulCeDLsUtSNbdrRBMHt1sS7PoQujWFvWwxiEk-Wi2jC36xmEDcrA0_1lYEwBArrC33FmWr_K4yshO4PzqiK9Z15cfZ7d1_SobUSQOU_BPH1btw6g0Tf-_nfoqkyWhORGqGLUk2zp_nTY1iQAPebnBhMbASbVZbHS7Gr3Rxmv-H3ontm-MSt6V8C1CIAwtKU7ECxnd8hIRZBHYSjqzGotSkfw"
                />
                <div>
                  <div className="font-bold text-sm text-[#1A1A1E]">Marcus Chen</div>
                  <div className="text-xs text-[#9CA3AF]">Senior Architect</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1E] text-white pt-24 pb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#6366F1]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 style={{ fontFamily: 'Playfair Display, serif' }} className="text-5xl md:text-6xl font-medium mb-8">Reclaim your attention.</h2>
          <p className="text-[#9CA3AF] text-xl mb-12 max-w-2xl mx-auto">
            Join thousands of high-performers who have mastered the art of focus.
          </p>
          <Link
            to="/signup"
            className="liquid-hover inline-flex relative overflow-hidden group bg-white text-[#1A1A1E] px-10 py-5 rounded-full font-bold text-lg shadow-glow-btn transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <p className="mt-6 text-sm text-[#9CA3AF]">14-day free trial. No credit card required.</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-32 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span style={{ fontFamily: 'Playfair Display, serif' }} className="font-bold text-[#E5E7EB] text-base">KAAL</span>
            <span>© 2024</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

      <style>{`
        .bg-noise {
          background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E');
        }
        .mesh-bg {
          background-color: #ffffff;
          background-image: 
            radial-gradient(at 88% 40%, hsla(240,15%,92%,1) 0px, transparent 85%),
            radial-gradient(at 49% 30%, hsla(240,15%,92%,1) 0px, transparent 85%),
            radial-gradient(at 14% 26%, hsla(240,15%,92%,1) 0px, transparent 85%),
            radial-gradient(at 0% 64%, hsla(263,39%,90%,1) 0px, transparent 85%),
            radial-gradient(at 41% 94%, hsla(284,33%,92%,1) 0px, transparent 85%),
            radial-gradient(at 100% 99%, hsla(306,26%,90%,1) 0px, transparent 85%);
        }
        .text-reveal-char {
          display: inline-block;
          opacity: 0;
          animation: reveal 0.8s cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
        }
        @keyframes reveal {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .liquid-hover {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .liquid-hover::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: #1A1A1E;
          transition: top 0.4s ease;
          z-index: -1;
        }
        .liquid-hover:hover::before {
          top: 0;
        }
        .shadow-glass-sm {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }
        .shadow-glass-lg {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
        }
        .shadow-glow-btn {
          box-shadow: 0 0 20px rgba(26, 26, 30, 0.2);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        .animate-draw {
          animation: draw 2s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.5, 0, 0, 1) forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-draw-infinite {
          animation: draw 3s ease-out forwards infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-ping-slow {
          animation: pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pingSlow {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(26, 26, 30, 0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}