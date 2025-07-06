'use client';

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient'; // Adjust the path based on your file structure

export default function AccountNavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // State to store user data
  const [loadingUser, setLoadingUser] = useState(true); // State to track user loading

  // Effect to handle user authentication state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoadingUser(false);
    });

    // Initial check for user session
    async function getUser() {
      const { data: { user } = {} } = await supabase.auth.getUser(); // Destructure with default empty object
      setUser(user || null);
      setLoadingUser(false);
    }
    getUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      // Optionally, show a notification to the user
    } else {
      setUser(null); // Clear user state
      navigate('/'); // Redirect to home after logout
    }
  };

  // Define base navigation links
  const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Cart', href: '/cart' },
    { name: 'My Account', href: '/account' },
    { name: 'Checkout', href: '/checkout' },
  ];

  return (
    <nav className="flex justify-center mb-10 mt-4 sm:mt-0">
      <ul className="flex flex-wrap justify-center space-x-2 sm:space-x-6 bg-white p-4 rounded-full shadow-lg">
        {baseNavigation.map((item) => (
          <li key={item.name}>
            <Link
              to={item.href}
              className="text-gray-700 hover:text-amber-600 text-lg font-medium transition-colors duration-200 px-3 py-1.5 whitespace-nowrap"
            >
              {item.name}
            </Link>
          </li>
        ))}

        {!loadingUser && (
          <>
            {user ? (
              <>
                {user.email === 'sazidhusain2004@gmail.com' && (
                  <li>
                    <Link
                      to="/admin" // Assuming '/admin' is your admin path
                      className="text-blue-600 hover:text-blue-700 text-lg font-medium transition-colors duration-200 px-3 py-1.5 whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 text-lg font-medium transition-colors duration-200 px-3 whitespace-nowrap"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 text-lg font-medium transition-colors duration-200 px-3 whitespace-nowrap"
                >
                  Login
                </Link>
              </li>
            )}
          </>
        )}
      </ul>
    </nav>
  );
}
