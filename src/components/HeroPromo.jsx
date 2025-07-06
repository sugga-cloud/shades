'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Component for a single falling star
const FallingStar = ({ style }) => (
  <div
    className="absolute bg-white rounded-full opacity-0"
    style={style}
  ></div>
);

export default function ProductHero() {
  const [stars, setStars] = useState([]);
  const starContainerRef = useRef(null);
  // Removed showImages state as images will be visible immediately

  useEffect(() => {
    const headingText = "Summer styles are finally here";
    const headingElement = document.getElementById('product-animated-heading');
    if (!headingElement) return;

    headingElement.innerHTML = '';
    let totalDelay = 0;

    headingText.split(' ').forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'inline-block whitespace-nowrap';

      word.split('').forEach((char) => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.className = 'inline-block opacity-0 transform translate-y-full';
        wordSpan.appendChild(charSpan);

        const currentDelay = totalDelay;
        setTimeout(() => {
          charSpan.offsetHeight; // Trigger reflow for transition
          charSpan.classList.add('transition-all', 'duration-500', 'ease-out');
          charSpan.classList.remove('opacity-0', 'translate-y-full');
          charSpan.classList.add('opacity-100', 'translate-y-0');
          charSpan.style.color = '#FFD700'; // Gold color for animation
        }, currentDelay);

        totalDelay += 70;
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
        const size = Math.random() * 4 + 1; // Random size from 1px to 5px
        const duration = Math.random() * 10 + 5; // 5s to 15s for varied speeds
        const delay = Math.random() * 10; // 0s to 10s for staggered starts
        const left = Math.random() * 100; // 0% to 100% horizontal position
        const top = Math.random() * -100; // Start above the viewport (-100% to 0%)

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

    generateStars(); // Initial star generation

    // Re-generate stars on window resize to adjust positions
    const handleResize = () => generateStars();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Removed useEffect for delayed image container visibility

  // Array of product images for the "fanned-out cards" effect
  const productImages = [
    { src: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Stylish black jacket' },
    { src: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Blue denim jeans' },
    { src: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=435&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'White t-shirt' },
    { src: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Elegant dress' },
    { src: 'https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Clothing rack' },
  
  ];

  return (
    <div className="relative min-h-screen bg-gray-900 font-inter overflow-hidden">
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0vh); opacity: 0.3; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(200vh); opacity: 0; }
        }
        
        /* No more fadeInUp or subtleFloat for cards */

        .image-card-item {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px; /* Fixed width for card */
          height: 280px; /* Fixed height for card */
          transform-origin: 50% 50%; /* Center of the card */
          transition: transform 0.5s ease-out, box-shadow 0.3s ease-out, z-index 0.3s ease-out; /* Smooth transitions */
          opacity: 1; /* Always visible */
          pointer-events: auto; /* Ensure hover works */
        }

        /* Fanned-out initial state for cards */
        .image-card-item:nth-child(1) { transform: translate(-100%, -50%) rotate(-20deg); z-index: 8; }
        .image-card-item:nth-child(2) { transform: translate(-70%, -50%) rotate(-10deg); z-index: 7; }
        .image-card-item:nth-child(3) { transform: translate(-40%, -50%) rotate(-5deg); z-index: 6; }
        .image-card-item:nth-child(4) { transform: translate(-10%, -50%) rotate(0deg); z-index: 5; }
        .image-card-item:nth-child(5) { transform: translate(20%, -50%) rotate(5deg); z-index: 4; }
        .image-card-item:nth-child(6) { transform: translate(50%, -50%) rotate(10deg); z-index: 3; }
        .image-card-item:nth-child(7) { transform: translate(80%, -50%) rotate(15deg); z-index: 2; }
        .image-card-item:nth-child(8) { transform: translate(110%, -50%) rotate(20deg); z-index: 1; }


        /* Hover effect for individual images */
        .image-card-item:hover {
          transform: translate(-50%, -50%) scale(1.1) rotate(0deg) translateZ(50px) !important; /* Pop up and straighten */
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5); /* More pronounced shadow */
          z-index: 100 !important; /* Bring to very front on hover */
        }
      `}</style>

      {/* Falling Stars Container */}
      <div ref={starContainerRef} className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <FallingStar key={star.id} style={star.style} />
        ))}
      </div>

      <div className="relative z-10 pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
        <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
          <div className="sm:max-w-lg">
            <h1
              id="product-animated-heading"
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
            />
            <p className="mt-4 text-xl text-gray-300">
              This year, our new summer collection will shelter you from the harsh elements of a world that doesn't care
              if you live or die.
            </p>
            <div className="mt-10">
              <Link
                to="/shop"
                className="inline-block rounded-md border border-transparent bg-yellow-500 px-8 py-3 text-center font-medium text-gray-900 hover:bg-yellow-600 transition-colors duration-200 shadow-md"
              >
                Shop Collection
              </Link>
            </div>
          </div>

          {/* Product Image Gallery with Fanned-Out Card Effect */}
          <div
            aria-hidden="true"
            className="pointer-events-none lg:absolute lg:inset-y-0 lg:left-[50%] lg:right-0 lg:max-w-none lg:w-auto flex items-center justify-center lg:justify-start lg:pl-16"
          >
            {/* Main container for the fanned-out cards */}
            <div className={`relative w-[400px] h-[500px] sm:w-[500px] sm:h-[600px] lg:w-[600px] lg:h-[700px] mx-auto lg:mx-0
                             transition-opacity duration-1000 ease-out opacity-100`}> {/* Always visible */}
              {productImages.map((image, index) => (
                <div
                  key={index}
                  className={`rounded-lg shadow-xl overflow-hidden image-card-item`} // Renamed class for clarity
                >
                  <img
                    alt={image.alt}
                    src={image.src}
                    className="size-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
