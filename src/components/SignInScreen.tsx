import { useState } from 'react';
import { supabase } from '../services/supabase-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function SignInScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Validate form
  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle sign in with email/password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Welcome back!', {
          description: 'Redirecting to your dashboard...',
        });
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific error messages
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password',
        });
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Email not confirmed', {
          description: 'Please check your email for a confirmation link',
        });
      } else {
        toast.error('Sign in failed', {
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#111827] p-16 flex-col justify-between overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#6B7280 1px, transparent 1px), linear-gradient(90deg, #6B7280 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Gradient orb */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white text-[#111827] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-display text-2xl">K</span>
            </div>
            <span className="text-white text-2xl text-display tracking-tight">KAAL</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-12">
          <div>
            <h1 className="text-5xl text-accent-bold text-white leading-[1.1] mb-6">
              Focus.<br/>
              Execute.<br/>
              Excel.
            </h1>
            <p className="text-gray-400 text-lg text-body leading-relaxed max-w-md">
              Your executive function AI assistant for deep work sessions. 
              Built for the top 1% who demand precision and clarity.
            </p>
          </div>

          {/* Stats showcase */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white text-accent">24K+</div>
              <div className="text-xs text-gray-400 uppercase tracking-[0.15em] text-body-medium">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white text-accent">4.9</div>
              <div className="text-xs text-gray-400 uppercase tracking-[0.15em] text-body-medium">Rating</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white text-accent">99%</div>
              <div className="text-xs text-gray-400 uppercase tracking-[0.15em] text-body-medium">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-gray-500 text-sm text-body">
            © 2026 KAAL. Crafted for peak performance.
          </p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#111827] text-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-display text-xl">K</span>
            </div>
            <span className="text-[#111827] text-xl text-display tracking-tight">KAAL</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[2.25rem] text-display leading-[1.2] text-[#111827] mb-3">
              Welcome back
            </h2>
            <p className="text-[#6B7280] text-base text-body leading-relaxed">
              Sign in to continue your focus journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[0.8125rem] text-body-semibold text-[#111827] tracking-wide">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 text-body bg-white border-2 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                } rounded-xl text-[#111827] placeholder-gray-400 focus:border-[#111827] focus:outline-none transition-colors`}
              />
              {errors.email && (
                <p className="text-[0.75rem] text-body text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[0.8125rem] text-body-semibold text-[#111827] tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 text-body bg-white border-2 ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl text-[#111827] placeholder-gray-400 focus:border-[#111827] focus:outline-none transition-colors pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-[0.75rem] text-body text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827] cursor-pointer"
                />
                <span className="text-[0.875rem] text-body text-[#6B7280] group-hover:text-[#111827] transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[0.875rem] text-body-semibold text-[#111827] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111827] hover:bg-black text-white text-body-semibold text-[0.9375rem] py-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-[#6B7280] text-body text-[0.875rem]">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-body-semibold text-[#111827] hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}