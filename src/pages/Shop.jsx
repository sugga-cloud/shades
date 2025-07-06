'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/AccountNavBar'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, FunnelIcon, MinusIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/20/solid'

import { getAllProducts } from '../services/productService'
import { getAllCategories } from '../services/categoryService'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const sortOptions = [
  { name: 'Most Popular', current: true },
  { name: 'Best Rating', current: false },
  { name: 'Newest', current: false },
  { name: 'Price: Low to High', current: false },
  { name: 'Price: High to Low', current: false },
]

// Animated Capsule Loader Component
function CapsuleLoader() {
  return (
    <div className="flex justify-center items-center h-64">
      <style jsx>{`
        @keyframes capsulePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        .capsule {
          width: 16px;
          height: 40px;
          background-color: #ef4444; /* Tailwind red-500 */
          border-radius: 9999px; /* Fully rounded */
          margin: 0 8px;
          animation: capsulePulse 1.2s infinite ease-in-out;
        }
        .capsule:nth-child(1) { animation-delay: 0s; }
        .capsule:nth-child(2) { animation-delay: 0.2s; }
        .capsule:nth-child(3) { animation-delay: 0.4s; }
        .capsule:nth-child(4) { animation-delay: 0.6s; }
      `}</style>
      <div className="capsule"></div>
      <div className="capsule"></div>
      <div className="capsule"></div>
      <div className="capsule"></div>
    </div>
  );
}

// Shooting Star Component
function ShootingStar({ style }) {
  return (
    <div
      className="absolute bg-white rounded-full opacity-0 shadow-lg"
      style={style}
    ></div>
  );
}

function ProductGrid({ products }) {
  const navigate = useNavigate()

  if (!products || products.length === 0) {
    return <div className="text-center py-10 text-gray-400">No products found matching your criteria.</div>
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => navigate(`/product/${product.id}`)}
          className="group cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out
                     bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700" /* Enhanced styling for dark bg */
        >
          <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-gray-700 xl:aspect-h-8 xl:aspect-w-7">
            <img
              src={
                product.imageUrl ||
                `https://placehold.co/300x300/FFD700/333333?text=${product.name.replace(/\s/g, '+')}`
              }
              alt={product.imageAlt || product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-85 transition-opacity duration-300"
            />
          </div>
          <div className="p-4"> {/* Added padding to content */}
            <h3 className="mt-2 text-lg font-semibold text-white">{product.name}</h3> {/* Larger, bolder product name */}
            <p className="text-sm text-gray-400">{product.categoryNames?.join(', ')}</p>
            <p className="mt-2 text-xl font-bold text-yellow-400">{product.price}</p> {/* Larger, bolder price */}
          </div>
        </div>
      ))}
    </div>
    </>
  )
}

export default function ShopPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [allTransformedProducts, setAllTransformedProducts] = useState([]) // Stores all fetched products
  const [filteredAndSortedProducts, setFilteredAndSortedProducts] = useState([]) // All products after filter/sort
  const [displayedProducts, setDisplayedProducts] = useState([]) // Products currently shown (paginated)
  const [selectedFilters, setSelectedFilters] = useState({})
  const [sortOption, setSortOption] = useState(sortOptions[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState([])
  const [categories, setCategories] = useState([])
  const [productsToDisplayCount, setProductsToDisplayCount] = useState(8); // Initial number of products to display
  const [stars, setStars] = useState([]); // State for shooting stars
  const bottomRef = useRef(null); // Ref for the infinite scroll sentinel

  // Effect for shooting stars animation
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const numStars = 30; // Number of shooting stars
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 2 + 1; // Random size from 1px to 3px
        const duration = Math.random() * 5 + 3; // 3s to 8s for varied speeds
        const delay = Math.random() * 10; // 0s to 10s for staggered starts
        const startX = Math.random() * containerWidth; // Start anywhere horizontally
        const startY = Math.random() * containerHeight * 0.2; // Start from top 20% of screen

        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${startX}px`,
            top: `${startY}px`,
            animation: `shootingStar ${duration}s linear ${delay}s infinite`,
            transformOrigin: '0% 0%', // Rotate around its own point
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


  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProducts()
      const transformedProducts = data.map(p => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toFixed(2)}`, // Changed '$' to '₹'
        categoryIds: p.categoryIds || [],
        color: p.color,
        size: p.size,
        imageUrl: p.image_url,
        imageAlt: p.image_alt,
      }))
      setAllTransformedProducts(transformedProducts) // Store all products
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Effect to add category names to products once both are loaded
  useEffect(() => {
    if (allTransformedProducts.length > 0 && categories.length > 0) {
      const productsWithCategoryNames = allTransformedProducts.map(p => ({
        ...p,
        categoryNames: categories
          .filter(c => p.categoryIds.includes(c.id))
          .map(c => c.name),
      }))
      setAllTransformedProducts(productsWithCategoryNames)
    }
  }, [categories])

  // Effect to set up dynamic filters based on fetched products and categories
  useEffect(() => {
    if (allTransformedProducts.length > 0 && categories.length > 0) {
      const uniqueColors = [...new Set(allTransformedProducts.map(p => p.color).filter(Boolean))]
      const uniqueSizes = [...new Set(allTransformedProducts.map(p => p.size).filter(Boolean))]

      const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name,
        checked: false,
      }))

      const dynamicFilters = [
        // {
        //   id: 'color',
        //   name: 'Color',
        //   options: uniqueColors.map(color => ({ value: color, label: color.charAt(0).toUpperCase() + color.slice(1), checked: false })),
        // },
        {
          id: 'categoryIds',
          name: 'Category',
          options: categoryOptions,
        },
        // {
        //   id: 'size',
        //   name: 'Size',
        //   options: uniqueSizes.map(size => ({ value: size, label: size.toUpperCase(), checked: false })),
        // },
      ]
      setFilters(dynamicFilters)
    }
  }, [allTransformedProducts, categories])

  // Effect to filter, sort, and paginate products for display
  useEffect(() => {
    let newFilteredProducts = [...allTransformedProducts]

    // Apply filters
    Object.keys(selectedFilters).forEach((filterId) => {
      const selectedOptions = selectedFilters[filterId]
      if (selectedOptions && selectedOptions.length > 0) {
        newFilteredProducts = newFilteredProducts.filter((product) => {
          const productValue = product[filterId]
          if (Array.isArray(productValue)) {
            return productValue.some((val) => selectedOptions.includes(val))
          }
          return selectedOptions.includes(productValue)
        })
      }
    })

    // Apply sorting
    newFilteredProducts.sort((a, b) => {
      if (sortOption.name === 'Price: Low to High') {
        // Ensure price string is parsed correctly before comparison
        return parseFloat(a.price.replace('₹', '')) - parseFloat(b.price.replace('₹', ''))
      }
      if (sortOption.name === 'Price: High to Low') {
        // Ensure price string is parsed correctly before comparison
        return parseFloat(b.price.replace('₹', '')) - parseFloat(a.price.replace('₹', ''))
      }
      return 0
    })

    setFilteredAndSortedProducts(newFilteredProducts); // Store the full filtered/sorted list
    setDisplayedProducts(newFilteredProducts.slice(0, productsToDisplayCount)); // Paginate for display
  }, [allTransformedProducts, selectedFilters, sortOption, productsToDisplayCount])

  const handleFilterChange = useCallback((sectionId, optionValue, checked) => {
    setSelectedFilters((prevFilters) => {
      const currentOptions = prevFilters[sectionId] || []
      if (checked) {
        return {
          ...prevFilters,
          [sectionId]: [...currentOptions, optionValue],
        }
      } else {
        return {
          ...prevFilters,
          [sectionId]: currentOptions.filter((item) => item !== optionValue),
        }
      }
    })
  }, [])

  const handleSortChange = useCallback((option) => {
    setSortOption(option)
  }, [])

  // Infinite Scroll Logic
  useEffect(() => {
    if (loading || !bottomRef.current) return; // Don't observe if still loading or ref not available

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedProducts.length < filteredAndSortedProducts.length) {
          // If the sentinel is visible and there are more products to load
          setProductsToDisplayCount(prevCount => prevCount + 8); // Load more products
        }
      },
      {
        rootMargin: '200px', // Load when the bottom is 200px from viewport
      }
    );

    observer.observe(bottomRef.current);

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current);
      }
    };
  }, [loading, displayedProducts.length, filteredAndSortedProducts.length]); // Re-run when these dependencies change


  if (loading) {
    return (
      <div className="bg-gray-900 font-inter min-h-screen flex items-center justify-center"> {/* Dark background for loader */}
        <CapsuleLoader />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 bg-gray-900 min-h-screen">{error}</div>
  }

  return (
    <div className="relative bg-gray-900 font-inter min-h-screen overflow-hidden"> {/* Dark background */}
      {/* Custom CSS for shooting stars animation */}
      <style jsx>{`
        @keyframes shootingStar {
          0% { transform: translate(0, 0) rotate(225deg); opacity: 0; }
          10% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translate(300px, 300px) rotate(225deg); opacity: 0; }
        }
      `}</style>
      
      {/* Shooting Stars Container */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <ShootingStar key={star.id} style={star.style} />
        ))}
      </div>

      {/* NavBar - Assuming it's fixed and correctly styled */}
      
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"> {/* Added relative z-10 to bring content above stars */}
        <div className="flex items-baseline justify-between border-b border-gray-700 pt-24 pb-6"> {/* Darker border */}
      <NavBar />
          <h1 className="text-4xl font-bold tracking-tight text-white">Our Collection</h1> {/* White text */}
        </div>

        <section aria-labelledby="products-heading" className="pt-6 pb-24">
          <h2 id="products-heading" className="sr-only">Products</h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            <form className="hidden lg:block">
              {filters.map((section) => (
                <div key={section.id} className="border-b border-gray-700 pb-6"> {/* Darker border */}
                  <h3 className="text-sm font-semibold text-white mb-4">{section.name}</h3> {/* White text */}
                  <ul className="space-y-2">
                    {section.options.map((option, index) => (
                      <li key={index}>
                        <label className="flex items-center text-sm text-gray-300"> {/* Lighter text for options */}
                          <input
                            type="checkbox"
                            className="mr-2 form-checkbox h-4 w-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700" /* Styled checkbox for dark mode */
                            checked={selectedFilters[section.id]?.includes(option.value) || false}
                            onChange={(e) => handleFilterChange(section.id, option.value, e.target.checked)}
                          />
                          {option.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </form>

            <div className="lg:col-span-3">
              <ProductGrid products={displayedProducts} /> {/* Render only displayed products */}
              {/* Sentinel for infinite scroll */}
              {displayedProducts.length < filteredAndSortedProducts.length && (
                <div ref={bottomRef} className="text-center py-10">
                  <CapsuleLoader /> {/* Show loader when more products are being fetched */}
                </div>
              )}
              {displayedProducts.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-400">No products found matching your criteria.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
