import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/auth/oauth';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const GithubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Securely connecting to GitHub...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const result = await handleOAuthCallback('github', code, state);

      if (result.success) {
        setStatus('success');
        setMessage('Login successful! Redirecting to dashboard...');
        
        // Track successful login (if analytics available)
        if (typeof (window as any).plausible === 'function') {
          (window as any).plausible('Login', { props: { method: 'github' } });
        }
        
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <>
      <SEO 
        title="GitHub Login - NEXORA"
        description="Completing GitHub authentication"
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authenticating...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Success!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GithubCallback;
