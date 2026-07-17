import { useState } from 'react';
import { supabase } from '../services/supabase-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function SignUpScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreeToTerms: '',
  });

  // Validate form
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      agreeToTerms: '',
    };
    let isValid = true;

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle sign up with email/password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            display_name: formData.firstName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account',
        });

        // Navigate to sign in after 2 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);

      // Handle specific error messages
      if (error.message.includes('already registered')) {
        toast.error('Email already in use', {
          description: 'Please sign in or use a different email',
        });
      } else {
        toast.error('Sign up failed', {
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        
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
              Join the<br/>
              elite 1%
            </h1>
            <p className="text-gray-400 text-lg text-body leading-relaxed max-w-md">
              Transform your productivity with AI-powered executive function assistance. 
              Designed for those who refuse to settle for average.
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                
              </div>
              <div>
                <h3 className="text-white text-body-semibold mb-1">AI-Powered Focus</h3>
                <p className="text-gray-400 text-sm text-body">Intelligent task prioritization and deep work optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                
              </div>
              <div>
                <h3 className="text-white text-body-semibold mb-1">Advanced Analytics</h3>
                <p className="text-gray-400 text-sm text-body">Track your productivity patterns and optimize performance</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                
              </div>
              <div>
                <h3 className="text-white text-body-semibold mb-1">Secure & Private</h3>
                <p className="text-gray-400 text-sm text-body">Enterprise-grade encryption and data protection</p>
              </div>
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

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 overflow-y-auto">
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
              Create account
            </h2>
            <p className="text-[#6B7280] text-base text-body leading-relaxed">
              Start your journey to peak productivity
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-[0.8125rem] text-body-semibold text-[#111827] tracking-wide">
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="John"
                  className={`w-full px-4 py-3 text-body bg-white border-2 ${
                    errors.firstName ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl text-[#111827] placeholder-gray-400 focus:border-[#111827] focus:outline-none transition-colors`}
                />
                {errors.firstName && (
                  <p className="text-[0.75rem] text-body text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-[0.8125rem] text-body-semibold text-[#111827] tracking-wide">
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Doe"
                  className={`w-full px-4 py-3 text-body bg-white border-2 ${
                    errors.lastName ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl text-[#111827] placeholder-gray-400 focus:border-[#111827] focus:outline-none transition-colors`}
                />
                {errors.lastName && (
                  <p className="text-[0.75rem] text-body text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

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
              <p className="text-[0.75rem] text-body text-[#6B7280] mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827] cursor-pointer mt-0.5 flex-shrink-0"
                />
                <span className="text-[0.875rem] text-body text-[#6B7280] group-hover:text-[#111827] transition-colors leading-snug">
                  I agree to the{' '}
                  <a href="#" className="text-body-semibold text-[#111827] hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-body-semibold text-[#111827] hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-[0.75rem] text-body text-red-500 ml-7 mt-1">{errors.agreeToTerms}</p>
              )}
            </div>

            {/* Sign Up Button */}
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
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-[#6B7280] text-body text-[0.875rem]">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-body-semibold text-[#111827] hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}