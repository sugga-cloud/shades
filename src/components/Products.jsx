'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAllProducts } from '../services/productService'

// Mock Product Service: This simulates fetching products from a database.
// In your actual application, you would replace this with your real
// API call, for example: import { getAllProducts } from '../services/productService'
const mockGetAllProducts = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: '1', title: 'Stylish Jacket', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Jacket+01', image_alt: 'A stylish jacket', price: 79.99, color: 'Blue' },
        { id: '2', title: 'Comfortable Jeans', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Jeans+02', image_alt: 'Comfortable jeans', price: 59.50, color: 'Light Blue' },
        { id: '3', title: 'Basic Tee', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Tee+03', image_alt: 'A simple t-shirt', price: 24.99, color: 'White' },
        { id: '4', title: 'Summer Dress', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Dress+04', image_alt: 'A flowing summer dress', price: 89.00, color: 'Floral' },
        { id: '5', title: 'Warm Hoodie', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Hoodie+05', image_alt: 'A stylish hoodie', price: 65.00, color: 'Grey' },
        { id: '6', title: 'Striped Shirt', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Shirt+06', image_alt: 'A striped long sleeve shirt', price: 39.99, color: 'Navy/White' },
        { id: '7', title: 'Crossbody Bag', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Bag+07', image_alt: 'A leather crossbody bag', price: 120.00, color: 'Brown' },
        { id: '8', title: 'White Sneakers', image_url: 'https://placehold.co/400x400/FFD700/333333?text=Sneakers+08', image_alt: 'White classic sneakers', price: 75.00, color: 'White' },
      ]);
    }, 1000); // Simulate network delay
  });
};


function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// LazyImage Component for lazy loading images
const LazyImage = ({ src, alt, className }) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // Use a tiny transparent GIF as a placeholder until the actual image loads
  const [currentSrc, setCurrentSrc] = useState('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentSrc(src); // Load the actual image
            setIsLoaded(true);
            observer.unobserve(entry.target); // Stop observing once loaded
          }
        });
      },
      {
        rootMargin: '100px', // Load images when they are 100px within the viewport
      }
    );

    observer.observe(imgRef.current);

    // Cleanup observer on component unmount
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]); // Re-run if src changes

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      // Apply opacity transition based on loaded state
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
    />
  );
};


export default function ProductGridSection({ text = 'Featured Products' }) { // Renamed from Example
  const [products, setProducts] = useState([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        // This is where you would integrate with your actual database service.
        // For demonstration, we are using a mock function.
        // If you have a 'getAllProducts' function from a service, you would use it here:
        // const data = await getAllProducts();
        const data = await getAllProducts(); 
        const formatted = data.map(p => ({
          id: p.id,
          name: p.title,
          imageSrc: p.image_url,
          imageAlt: p.image_alt || p.title,
          // Changed currency symbol from '$' to '₹'
          price: `₹${p.price.toFixed(2)}`, 
          color: p.color || 'Unknown'
        }))
        const shuffled = shuffleArray(formatted)
        setProducts(shuffled.slice(0, 4)) // Displaying 4 products
      } catch (error) {
        console.error('Failed to fetch products:', error)
        // Optionally set an error state to display a message to the user
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32 font-inter"> {/* Changed background to white */}
      {/* Custom CSS for product card entrance animation */}
      <style jsx>{`
        @keyframes fadeInSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0px); }
        }

        .product-card-animation {
          animation: fadeInSlideUp 0.6s ease-out forwards;
          opacity: 0; /* Hidden by default, animated to visible */
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-8 text-center"> {/* Changed text color to gray-900 */}
          {text}
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 /* Changed background to white, added border */
                         transform hover:scale-105 transition-transform duration-300
                         product-card-animation" /* Apply entrance animation */
              style={{ animationDelay: `${index * 0.15}s` }} /* Stagger animation */
            >
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-square w-full bg-gray-100 rounded-t-xl overflow-hidden"> {/* Lighter placeholder background */}
                  <LazyImage
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    className="size-full object-cover group-hover:opacity-85 transition-opacity duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-semibold text-gray-900"> {/* Changed text color to gray-900 */}
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-yellow-600">{product.price}</p> {/* Adjusted yellow shade for white bg */}
                  </div>
                  <p className="text-sm text-gray-600">{product.color}</p> {/* Changed text color to gray-600 */}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
