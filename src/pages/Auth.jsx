'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const activeSession = data?.session;
      setSession(activeSession);

      if (activeSession) {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (!error) navigate('/account');
        else {
          await supabase.auth.signOut();
          setSession(null);
        }
      }

      setCheckingAuth(false);
    };

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (isRegistering) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;

      if (result.data?.session) {
        navigate('/account');
      } else if (isRegistering) {
        setError('Check your email to confirm registration.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-yellow-400 text-xl font-semibold animate-pulse font-inter">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-gray-700 p-4 font-inter">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm login-card-animation border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <svg className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5zM12 14l-8 4 8 4 8-4-8-4z" />
          </svg>
          <h2 className="text-3xl font-bold text-white text-center">The Shade Store</h2>
          <p className="text-sm text-gray-400 mt-2">{isRegistering ? 'Create an account' : 'Sign in to your account'}</p>
        </div>

        {error && (
          <div className="bg-red-700 text-white text-sm text-center p-3 rounded-md mb-4 shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="mb-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-600 transition-all"
          >
            {isLoading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="text-sm text-gray-400 mb-4 text-center">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-yellow-400 ml-2 underline"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm text-gray-400 uppercase font-semibold bg-gray-800 px-4">
            or
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold py-3 rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center space-x-2"
        >
          {isLoading ? 'Loading...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
