'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../services/productService';

const LazyImage = ({ src, alt, className }) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setCurrentSrc(src);
          setIsLoaded(true);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '100px' });

    observer.observe(imgRef.current);
    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
    />
  );
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ProductGridSection({ text = 'Featured Products' }) {
  const [products, setProducts] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getAllProducts();
        const formatted = data.map(p => ({
          id: p.id,
          name: p.title,
          imageSrc: p.image_url,
          imageAlt: p.image_alt || p.title,
          price: `₹${p.price.toFixed(2)}`,
          color: p.color || 'Unknown',
        }));
        const shuffled = shuffleArray(formatted);
        setProducts(shuffled.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }

    fetchProducts();
    generateBubbles();
    generateStars();
  }, []);

  const generateBubbles = () => {
    const bubbleList = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 40 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10
    }));
    setBubbles(bubbleList);
  };

  const generateStars = () => {
    const newStars = [];
    for (let i = 0; i < 25; i++) {
      newStars.push({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * -100,
        duration: Math.random() * 10 + 5,
        delay: Math.random() * 5,
      });
    }
    setStars(newStars);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 font-inter">
      <style jsx>{`
        @keyframes rise {
          0% { transform: translateY(100vh); opacity: 0.5; }
          100% { transform: translateY(-10vh); opacity: 0; }
        }

        @keyframes fall {
          0% { transform: translateY(0vh); opacity: 0.4; }
          100% { transform: translateY(200vh); opacity: 0; }
        }

        .bubble {
          position: absolute;
          bottom: -50px;
          background-color: rgba(255, 215, 0, 0.3);
          border-radius: 50%;
          animation-name: rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .star {
          position: absolute;
          background-color: yellow;
          border-radius: 9999px;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Floating background stars and bubbles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `${star.top}vh`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              filter: 'blur(0.5px)'
            }}
          />
        ))}

        {bubbles.map(b => (
          <div
            key={b.id}
            className="bubble"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-12 text-center">
          {text}
        </h2>

        {/* Centered Snap Scroll */}
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
          {products.map(product => (
            <div
              key={product.id}
              className="snap-center min-w-full flex-shrink-0 flex justify-center px-4"
            >
              <div className="w-full max-w-sm bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transform hover:scale-105 transition-transform duration-300">
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-square w-full bg-gray-100 overflow-hidden">
                    <LazyImage
                      src={product.imageSrc}
                      alt={product.imageAlt}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-lg font-bold text-yellow-600">{product.price}</p>
                    </div>
                    <p className="text-sm text-gray-600">{product.color}</p>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
