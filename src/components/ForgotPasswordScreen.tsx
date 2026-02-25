import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await resetPassword(email);
    
    if (result.success) {
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }
    
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="font-sans antialiased h-screen flex overflow-hidden bg-white text-primary">
        {/* Left Panel - Dark Mesh Gradient */}
        <div className="hidden lg:flex lg:w-1/2 mesh-gradient relative flex-col justify-between p-16 text-white overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03]" 
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-serif font-bold text-xl shadow-lg">
                K
              </div>
              <span className="text-xl font-bold tracking-tight font-serif">KAAL</span>
            </div>
          </div>

          <div className="relative z-10 max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h1 className="text-5xl font-serif font-medium leading-tight mb-8">
              "The key to focus is{' '}
              <span className="italic text-gray-300">simplicity</span>."
            </h1>
          </div>

          <div className="relative z-10 flex justify-between text-xs font-medium text-white/40 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <span>© 2024 KAAL Inc.</span>
            <span>v2.4.0 (Stable)</span>
          </div>

          <div className="absolute right-[-10%] top-[20%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute left-[-10%] bottom-[10%] w-80 h-80 bg-purple-900/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Right Panel - Success Message */}
        <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
          <div className="absolute inset-0 z-0 pointer-events-none bg-noise opacity-30 mix-blend-multiply" />

          <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
            <div className="text-center mb-10 animate-settle">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                <Mail className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-serif font-semibold text-primary mb-2">
                Check your email
              </h2>
              <p className="text-secondary text-sm max-w-md mx-auto">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-medium text-primary mb-2">What's next?</h3>
                <ol className="text-sm text-secondary space-y-2 list-decimal list-inside">
                  <li>Check your inbox and spam folder</li>
                  <li>Click the password reset link in the email</li>
                  <li>Enter your new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              <Link
                to="/login"
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-gray-300 rounded-xl text-sm font-semibold text-primary hover:bg-gray-50 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>

            <div className="mt-8 text-center text-sm text-secondary">
              Didn't receive the email?{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .mesh-gradient {
            background-color: #000000;
            background-image: 
              radial-gradient(at 0% 100%, hsla(253,16%,7%,1) 0, transparent 50%), 
              radial-gradient(at 50% 100%, hsla(225,39%,25%,1) 0, transparent 50%), 
              radial-gradient(at 100% 100%, hsla(339,49%,20%,1) 0, transparent 50%),
              radial-gradient(at 0% 0%, hsla(240, 10%, 10%, 1) 0, transparent 50%);
            position: relative;
          }
          .mesh-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
            opacity: 0.6;
            mix-blend-mode: overlay;
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes settle {
            0% { letter-spacing: 0.05em; opacity: 0; }
            100% { letter-spacing: 0; opacity: 1; }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
          .animate-settle {
            animation: settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased h-screen flex overflow-hidden bg-white text-primary">
      {/* Left Panel - Dark Mesh Gradient */}
      <div className="hidden lg:flex lg:w-1/2 mesh-gradient relative flex-col justify-between p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center font-serif font-bold text-xl shadow-lg">
              K
            </div>
            <span className="text-xl font-bold tracking-tight font-serif">KAAL</span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-5xl font-serif font-medium leading-tight mb-8">
            "The key to focus is{' '}
            <span className="italic text-gray-300">simplicity</span>."
          </h1>
        </div>

        <div className="relative z-10 flex justify-between text-xs font-medium text-white/40 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <span>© 2024 KAAL Inc.</span>
          <span>v2.4.0 (Stable)</span>
        </div>

        <div className="absolute right-[-10%] top-[20%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute left-[-10%] bottom-[10%] w-80 h-80 bg-purple-900/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Right Panel - Reset Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none bg-noise opacity-30 mix-blend-multiply" />

        <div className="absolute top-8 left-8 z-20">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
          <div className="mb-10 animate-settle">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-serif font-bold text-lg">
                K
              </div>
            </div>
            <h2 className="text-3xl font-serif font-semibold text-primary mb-2">
              Reset your password
            </h2>
            <p className="text-secondary text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }} onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full rounded-lg px-4 py-3.5 text-gray-900 shadow-sm placeholder:text-gray-400 input-minimal text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .mesh-gradient {
          background-color: #000000;
          background-image: 
            radial-gradient(at 0% 100%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(at 50% 100%, hsla(225,39%,25%,1) 0, transparent 50%), 
            radial-gradient(at 100% 100%, hsla(339,49%,20%,1) 0, transparent 50%),
            radial-gradient(at 0% 0%, hsla(240, 10%, 10%, 1) 0, transparent 50%);
          position: relative;
        }
        .mesh-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
          opacity: 0.6;
          mix-blend-mode: overlay;
        }
        .input-minimal {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(229, 231, 235, 0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-minimal:focus {
          background: #FFFFFF;
          border-color: #111827;
          box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.03), 0 4px 12px rgba(0, 0, 0, 0.05);
          outline: none;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes settle {
          0% { letter-spacing: 0.05em; opacity: 0; }
          100% { letter-spacing: 0; opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-settle {
          animation: settle 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
