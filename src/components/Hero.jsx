'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient'

const FallingStar = ({ style }) => (
  <div className="absolute bg-white rounded-full opacity-0" style={style}></div>
);

const LogoAnimator = ({ text }) => {
  const [animatedChars, setAnimatedChars] = useState(
    text.split('').map(char => ({ char, highlight: false }))
  );
  const animationTimeoutRef = useRef(null);

  const startAnimation = useCallback(() => {
    let index = 0;
    const intervalTime = 100;
    const resetDelay = 1000;

    const animateNextChar = () => {
      setAnimatedChars(prevChars =>
        prevChars.map((item, idx) => ({
          ...item,
          highlight: idx === index,
        }))
      );

      index++;
      if (index < text.length) {
        animationTimeoutRef.current = setTimeout(animateNextChar, intervalTime);
      } else {
        animationTimeoutRef.current = setTimeout(() => {
          setAnimatedChars(text.split('').map(char => ({ char, highlight: false })));
          animationTimeoutRef.current = setTimeout(startAnimation, resetDelay);
        }, intervalTime * 2);
      }
    };

    animationTimeoutRef.current = setTimeout(animateNextChar, intervalTime);
  }, [text]);

  useEffect(() => {
    startAnimation();
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [startAnimation]);

  return (
    <span className="text-xl font-bold text-gray-900">
      {animatedChars.map((item, idx) => (
        <span
          key={idx}
          className={item.highlight ? 'text-yellow-600 transition-colors duration-100 ease-in' : 'transition-colors duration-100 ease-out'}
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
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

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
    } else {
      console.error('Logout error:', error.message);
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Cart', href: '/cart' },
    { name: 'Checkout', href: '/checkout' },
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
          charSpan.style.color = '#FFD700';
          setTimeout(() => {
            charSpan.style.color = '';
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

    const generateStars = () => {
      const newStars = [];
      const numStars = 50;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight * 2;

      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 40 + 1;
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 10;
        const left = Math.random() * 100;
        const top = Math.random() * -100;

        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}vw`,
            top: `${top}vh`,
            animation: `fall ${duration}s linear ${delay}s infinite`,
            opacity: Math.random() * 0.7 + 0.3,
            filter: `blur(${Math.random() * 0.5}px)`,
          },
        });
      }
      setStars(newStars);
    };

    generateStars();
    const handleResize = () => generateStars();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 font-inter overflow-hidden">
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0vh); opacity: 0.3; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(200vh); opacity: 0; }
        }
      `}</style>

      <div ref={starContainerRef} className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => <FallingStar key={star.id} style={star.style} />)}
      </div>

      <header className="absolute inset-x-0 top-0 z-50 bg-white shadow-md h-16">
        <nav className="flex items-center justify-between p-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 rounded-lg flex items-center">
              <span className="sr-only">The Shade Store</span>
              <LogoAnimator text="The Shade Store" />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="-m-2.5 p-2.5 text-gray-700 rounded-md">
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className="text-sm font-semibold text-gray-900 hover:text-yellow-600">
                {item.name}
              </Link>
            ))}
            {!loadingUser && (
              <>
                {user ? (
                  <>
                    {user.email === 'sazidhusain2004@gmail.com' && (
                      <Link to="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Admin</Link>
                    )}
                    <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-700">
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="text-sm font-semibold text-green-600 hover:text-green-700">Login</Link>
                )}
              </>
            )}
          </div>
        </nav>

        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white p-6 sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5 flex items-center">
                <LogoAnimator text="The Shade Store" />
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="-m-2.5 p-2.5 text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {item.name}
                </Link>
              ))}
              {!loadingUser && (
                <>
                  {user ? (
                    <>
                      {user.email === 'sazidhusain2004@gmail.com' && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-blue-600 hover:bg-gray-50">
                          Admin
                        </Link>
                      )}
                      <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left block px-3 py-2 text-base font-semibold text-red-600 hover:bg-gray-50">
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-green-600 hover:bg-gray-50">
                      Login
                    </Link>
                  )}
                </>
              )}
            </div>
          </DialogPanel>
        </Dialog>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-2xl pt-32 pb-16 px-4 sm:px-6 sm:pt-40 sm:pb-20 lg:pt-52 lg:pb-32">
        <div className="text-center">
          <h1 id="animated-heading" className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white" />
          <p className="mt-8 text-base sm:text-lg lg:text-xl font-medium text-gray-300">
            Explore our curated collections of modern and timeless apparel designed to elevate your everyday look. Find your unique expression with quality and comfort.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/checkout"
              className="rounded-md bg-yellow-500 px-4 py-2.5 text-base font-semibold text-gray-900 hover:bg-yellow-600 transition"
            >
              Buy Now
            </Link>
            <Link to="/shop" className="text-lg font-semibold text-yellow-300 hover:text-yellow-400 transition">
              Explore Collections →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
