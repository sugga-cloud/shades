'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../services/productService'

const LazyImage = ({ src, alt, className }) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentSrc(src);
            setIsLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(imgRef.current);
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
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
        setProducts(shuffled.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="bg-white pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-32 font-inter">
      {/* Custom CSS for product card animation */}
      <style jsx>{`
        @keyframes fadeInSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .product-card-animation {
          animation: fadeInSlideUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-12 text-center">
          {text}
        </h2>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transform hover:scale-105 transition-transform duration-300 product-card-animation"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-square w-full bg-gray-100 rounded-t-xl overflow-hidden">
                  <LazyImage
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    className="size-full object-cover group-hover:opacity-85 transition-opacity duration-300"
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
          ))}
        </div>
      </div>
    </div>
  );
}
