'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();

  // 1️⃣ Check and validate session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const activeSession = data?.session;
      setSession(activeSession);

      if (activeSession) {
        // Test a real Supabase query to validate the session token
        const { error } = await supabase.from('products').select('id').limit(1);

        if (!error) {
          // Session is valid → redirect
          navigate('/account');
        } else {
          console.warn('Session invalid or expired:', error.message);
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

  // 2️⃣ Trigger Google Sign-in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // ensure this matches Supabase OAuth redirect URI
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ While checking token, show loader
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-yellow-400 text-xl font-semibold animate-pulse font-inter">
        Checking session...
      </div>
    );
  }

  // 4️⃣ Render Login Page
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-gray-700 p-4 font-inter">
      <style jsx>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .login-card-animation {
          animation: fadeInScale 0.5s ease-out forwards;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient-bg {
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }
      `}</style>
      <div className="relative z-10 bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm login-card-animation border border-gray-700"> {/* Darker card, rounded corners, shadow */}
        <div className="flex flex-col items-center mb-6">
          {/* Animated Logo/Brand Identity */}
          <svg className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5zM12 14l-8 4 8 4 8-4-8-4z" />
          </svg>
          <h2 className="text-3xl font-bold text-white text-center">The Shade Store</h2> {/* White text */}
          <p className="text-sm text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-700 text-white text-sm text-center p-3 rounded-md mb-4 shadow-inner">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold py-3 rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V11.69h4.225c-.175 1.15-.763 2.06-1.61 2.65-.845.59-1.928.93-3.115.93-2.36 0-4.32-1.92-4.32-4.28s1.96-4.28 4.32-4.28c1.288 0 2.37.44 3.25 1.25l1.07-1.07c-1.1-1.07-2.5-1.72-4.32-1.72-3.6 0-6.53 2.93-6.53 6.53s2.93 6.53 6.53 6.53c3.6 0 6.2-2.5 6.2-6.2v-.93h-6.2z" />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
