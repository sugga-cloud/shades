'use client';

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AccountNavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoadingUser(false);
    });

    async function getUser() {
      const { data: { user } = {} } = await supabase.auth.getUser();
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
    if (!error) {
      setUser(null);
      navigate('/');
    }
  };

  const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Cart', href: '/cart' },
    { name: 'My Account', href: '/account' },
    { name: 'Checkout', href: '/checkout' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white px-4 py-3 shadow-md border-b border-gray-200 font-inter">
      {/* Desktop Nav */}
      <ul className="hidden sm:flex justify-center space-x-6">
        {baseNavigation.map((item) => (
          <li key={item.name}>
            <Link
              to={item.href}
              className="text-gray-800 hover:text-yellow-600 text-base font-medium transition-colors duration-200"
            >
              {item.name}
            </Link>
          </li>
        ))}
        {!loadingUser && user?.email === 'sazidhusain2004@gmail.com' && (
          <li>
            <Link
              to="/admin"
              className="text-blue-600 hover:text-blue-700 text-base font-medium transition-colors duration-200"
            >
              Admin
            </Link>
          </li>
        )}
        {!loadingUser && (
          user ? (
            <li>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 text-base font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </li>
          ) : (
            <li>
              <Link
                to="/login"
                className="text-green-600 hover:text-green-700 text-base font-medium transition-colors duration-200"
              >
                Login
              </Link>
            </li>
          )
        )}
      </ul>

      {/* Mobile Nav Toggle */}
      <div className="sm:hidden flex justify-between items-center">
        
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-yellow-600 focus:outline-none"
        >
          {menuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <ShoppingBagIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden mt-4 space-y-2 bg-white p-4 rounded-lg shadow">
          {baseNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="block text-gray-800 hover:text-yellow-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {!loadingUser && user?.email === 'sazidhusain2004@gmail.com' && (
            <Link
              to="/admin"
              className="block text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          {!loadingUser && (
            user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block text-left text-red-600 hover:text-red-700 font-medium w-full"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="block text-green-600 hover:text-green-700 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
