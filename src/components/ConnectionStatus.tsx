import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase-client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user.email || user.id);
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
    }
  };

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <div>
          <p className="text-sm font-medium text-gray-900">Checking connection...</p>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-green-200 p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">Connected to Supabase</p>
          <p className="text-xs text-gray-600">{user}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-red-200 p-4 flex items-center gap-3">
      <XCircle className="w-5 h-5 text-red-600" />
      <div>
        <p className="text-sm font-medium text-gray-900">Not connected</p>
        <p className="text-xs text-gray-600">Please sign in</p>
      </div>
    </div>
  );
}
