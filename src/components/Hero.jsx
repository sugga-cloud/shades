'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom' // Import useNavigate
import supabase from '../utils/supabaseClient' // Import your supabase client for auth

// Component for a single falling star
const FallingStar = ({ style }) => (
  <div
    className="absolute bg-white rounded-full opacity-0"
    style={style}
  ></div>
);

// New component for animated logo
const LogoAnimator = ({ text }) => {
  const [animatedChars, setAnimatedChars] = useState(
    text.split('').map(char => ({ char, highlight: false }))
  );
  const animationTimeoutRef = useRef(null);

  const startAnimation = useCallback(() => {
    let index = 0;
    const intervalTime = 100; // Time between each letter highlight
    const resetDelay = 1000; // Delay before restarting the entire animation cycle

    const animateNextChar = () => {
      setAnimatedChars(prevChars => {
        const newChars = prevChars.map((item, idx) => ({
          ...item,
          highlight: idx === index, // Only current char is highlighted
        }));
        return newChars;
      });

      index++;
      if (index < text.length) {
        animationTimeoutRef.current = setTimeout(animateNextChar, intervalTime);
      } else {
        // All characters highlighted, reset after a short delay and restart
        animationTimeoutRef.current = setTimeout(() => {
          setAnimatedChars(text.split('').map(char => ({ char, highlight: false }))); // Reset all highlights
          animationTimeoutRef.current = setTimeout(startAnimation, resetDelay); // Delay before restarting full animation
        }, intervalTime * 2); // A little extra delay for the last highlight to fade
      }
    };

    // Start the first character animation
    animationTimeoutRef.current = setTimeout(animateNextChar, intervalTime);
  }, [text]);

  useEffect(() => {
    startAnimation();
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [startAnimation]);

  return (
    <span className="text-xl font-bold text-gray-900">
      {animatedChars.map((item, idx) => (
        <span
          key={idx}
          className={item.highlight ? 'text-yellow-600 transition-colors duration-100 ease-in' : 'transition-colors duration-100 ease-out'}
          // Using inline style for transitionDelay to ensure smooth fade out even if not highlighted
          style={{ transitionDelay: item.highlight ? '0s' : '0.1s' }} 
        >
          {item.char}
        </span>
      ))}
    </span>
  );
};


export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stars, setStars] = useState([]);
  const starContainerRef = useRef(null);
  const [user, setUser] = useState(null); // State to store user data
  const [loadingUser, setLoadingUser] = useState(true); // State to track user loading
  const navigate = useNavigate(); // Initialize useNavigate

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

  // Function to handle user logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
      // Optionally, show a notification to the user
    } else {
      setUser(null); // Clear user state
      navigate('/'); // Redirect to home or login page
    }
  };

  // Updated navigation links
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Cart', href: '/cart' }, // Added Cart link
    { name: 'Checkout', href: '/checkout' }, // Added Checkout link
    { name: 'My Account', href: '/account' },
  ];

  useEffect(() => {
    const headingText = "Discover Your Perfect Style at The Shade Store";
    const headingElement = document.getElementById('animated-heading');
    if (!headingElement) return;
    headingElement.innerHTML = '';
    let totalDelay = 0;
    headingText.split(' ').forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'inline-block whitespace-nowrap';
      word.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.className = 'inline-block opacity-0 transform translate-y-full transition-all duration-300 ease-out';
        const currentDelay = totalDelay;
        setTimeout(() => {
          charSpan.classList.remove('opacity-0', 'translate-y-full');
          charSpan.classList.add('opacity-100', 'translate-y-0');
          charSpan.style.color = '#FFD700'; // Gold color for animation
          setTimeout(() => {
            charSpan.style.color = ''; // Reset color after animation
          }, 500);
        }, currentDelay);
        totalDelay += 50;
        wordSpan.appendChild(charSpan);
      });
      headingElement.appendChild(wordSpan);
      if (wordIndex < headingText.split(' ').length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.innerHTML = '&nbsp;';
        spaceSpan.className = 'inline-block';
        headingElement.appendChild(spaceSpan);
        totalDelay += 50;
      }
    });

    // --- Falling Stars Animation Logic ---
    const generateStars = () => {
      const newStars = [];
      const numStars = 50; // Number of stars
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight * 2; // Stars fall from above the viewport

      for (let i = 0; i < numStars; i++) {
        // Changed size range: 1px to 5px for more varied "big, bigger, biggest" effect
        const size = Math.random() * 40 + 1; 
        const duration = Math.random() * 10 + 5; // 5s to 15s
        const delay = Math.random() * 10; // 0s to 10s
        const left = Math.random() * 100; // 0% to 100% horizontal position
        const top = Math.random() * -100; // Start above the viewport (-100% to 0%)

        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}vw`,
            top: `${top}vh`, // Use vh for top to start above the screen
            animation: `fall ${duration}s linear ${delay}s infinite`,
            opacity: Math.random() * 0.7 + 0.3, // 0.3 to 1.0 opacity
            filter: `blur(${Math.random() * 0.5}px)`, // Slight blur for softness
          },
        });
      }
      setStars(newStars);
    };

    generateStars(); // Initial star generation

    // Re-generate stars on window resize to adjust positions
    const handleResize = () => generateStars();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 font-inter overflow-hidden">
      {/* Custom CSS for falling stars animation and logo animation */}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0vh); opacity: 0.3; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(200vh); opacity: 0; } /* Fall 200vh (twice viewport height) */
        }
      `}</style>

      {/* Falling Stars Container */}
      <div ref={starContainerRef} className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <FallingStar key={star.id} style={star.style} />
        ))}
      </div>

      <header className="absolute inset-x-0 top-0 z-50 bg-white shadow-md"> {/* White Nav Bar */}
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 rounded-lg flex items-center">
              <span className="sr-only">The Shade Store</span>
              {/* Animated Text Logo */}
              <LogoAnimator text="The Shade Store" />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm/6 font-semibold text-gray-900 hover:text-yellow-600 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
            {/* Conditional Login/Logout and Admin Button */}
            {!loadingUser && (
              <>
                {user ? (
                  <>
                    {user.email === 'sazidhusain2004@gmail.com' && (
                      <Link
                        to="/admin" // Assuming '/admin' is your admin path
                        className="text-sm/6 font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-sm/6 font-semibold text-red-600 hover:text-red-700 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login" // Assuming '/login' is your login path
                    className="text-sm/6 font-semibold text-green-600 hover:text-green-700 transition-colors duration-200"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end" />
        </nav>

        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5 rounded-lg flex items-center">
                <span className="sr-only">The Shade Store</span>
                {/* Animated Text Logo for mobile */}
                <LogoAnimator text="The Shade Store" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {/* Conditional Login/Logout and Admin Button for mobile */}
                  {!loadingUser && (
                    <>
                      {user ? (
                        <>
                          {user.email === 'sazidhusain2004@gmail.com' && (
                            <Link
                              to="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-blue-600 hover:bg-gray-50"
                            >
                              Admin
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }}
                            className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-red-600 hover:bg-gray-50 w-full text-left"
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <Link
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-green-600 hover:bg-gray-50"
                        >
                          Login
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

      <div className="relative z-10 mx-auto max-w-2xl py-20 sm:py-32 lg:py-40">
        <div className="text-center">
          <h1 id="animated-heading" className="text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl" /> {/* Text color changed to white */}
          <p className="mt-8 text-lg font-medium text-pretty text-gray-300 sm:text-xl/8"> {/* Text color changed to gray-300 */}
            Explore our curated collections of modern and timeless apparel designed to elevate your everyday look. Find your unique expression with quality and comfort.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/checkout"
              className="rounded-md bg-yellow-500 px-3.5 py-2.5 text-base font-semibold text-gray-900 shadow-xs hover:bg-yellow-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 transition-colors duration-200"
            > {/* Button color adjusted */}
              Buy Now
            </Link>
            <Link
              to="/shop"
              className="text-lg font-semibold text-yellow-300 hover:text-yellow-400 transition-colors duration-200"
            > {/* Link color adjusted */}
              Explore Collections <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
