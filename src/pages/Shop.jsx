'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/AccountNavBar';
import { FunnelIcon } from '@heroicons/react/20/solid';
import { getAllProducts } from '../services/productService';
import { getAllCategories } from '../services/categoryService';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const sortOptions = [
  { name: 'Most Popular', current: true },
  { name: 'Best Rating', current: false },
  { name: 'Newest', current: false },
  { name: 'Price: Low to High', current: false },
  { name: 'Price: High to Low', current: false },
];

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
          background-color: #ef4444;
          border-radius: 9999px;
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

function ShootingStar({ style }) {
  return <div className="absolute bg-white rounded-full opacity-0 shadow-lg" style={style}></div>;
}

function ProductGrid({ products }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return <div className="text-center py-10 text-gray-400">No products found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => navigate(`/product/${product.id}`)}
          className="group cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-gray-700 xl:aspect-h-8 xl:aspect-w-7">
            <img
              src={product.imageUrl || `https://placehold.co/300x300/FFD700/333333?text=${product.name.replace(/\s/g, '+')}`}
              alt={product.imageAlt || product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-85 transition-opacity duration-300"
            />
          </div>
          <div className="p-4">
            <h3 className="mt-2 text-lg font-semibold text-white">{product.name}</h3>
            <p className="text-sm text-gray-400">{product.categoryNames?.join(', ')}</p>
            <p className="mt-2 text-xl font-bold text-yellow-400">{product.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [allTransformedProducts, setAllTransformedProducts] = useState([]);
  const [filteredAndSortedProducts, setFilteredAndSortedProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [sortOption, setSortOption] = useState(sortOptions[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsToDisplayCount, setProductsToDisplayCount] = useState(8);
  const [stars, setStars] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 30; i++) {
        const size = Math.random() * 2 + 1;
        const duration = Math.random() * 5 + 3;
        const delay = Math.random() * 10;
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight * 0.2;

        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            left: `${startX}px`,
            top: `${startY}px`,
            animation: `shootingStar ${duration}s linear ${delay}s infinite`,
            transformOrigin: '0% 0%',
            opacity: Math.random() * 0.7 + 0.3,
            filter: `blur(${Math.random() * 0.5}px)`,
          },
        });
      }
      setStars(newStars);
    };
    generateStars();
    window.addEventListener('resize', generateStars);
    return () => window.removeEventListener('resize', generateStars);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      const transformed = data.map((p) => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toFixed(2)}`,
        categoryIds: p.categoryIds || [],
        color: p.color,
        size: p.size,
        imageUrl: p.image_url,
        imageAlt: p.image_alt,
      }));
      setAllTransformedProducts(transformed);
    } catch (err) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (allTransformedProducts.length && categories.length) {
      const productsWithNames = allTransformedProducts.map((p) => ({
        ...p,
        categoryNames: categories.filter((c) => p.categoryIds.includes(c.id)).map((c) => c.name),
      }));
      setAllTransformedProducts(productsWithNames);
    }
  }, [categories]);

  useEffect(() => {
    if (!allTransformedProducts.length || !categories.length) return;
    const catOptions = categories.map((cat) => ({ value: cat.id, label: cat.name, checked: false }));
    setFilters([{ id: 'categoryIds', name: 'Category', options: catOptions }]);
  }, [allTransformedProducts, categories]);

  useEffect(() => {
    let filtered = [...allTransformedProducts];
    Object.entries(selectedFilters).forEach(([id, values]) => {
      filtered = filtered.filter((p) => p[id]?.some((val) => values.includes(val)));
    });
    if (sortOption.name.includes('Price')) {
      const sign = sortOption.name.includes('Low') ? 1 : -1;
      filtered.sort((a, b) => sign * (parseFloat(a.price.slice(1)) - parseFloat(b.price.slice(1))));
    }
    setFilteredAndSortedProducts(filtered);
    setDisplayedProducts(filtered.slice(0, productsToDisplayCount));
  }, [allTransformedProducts, selectedFilters, sortOption, productsToDisplayCount]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && displayedProducts.length < filteredAndSortedProducts.length) {
        setProductsToDisplayCount((prev) => prev + 8);
      }
    }, { rootMargin: '200px' });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => bottomRef.current && observer.unobserve(bottomRef.current);
  }, [displayedProducts.length, filteredAndSortedProducts.length]);

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
  return (
    <div className="relative bg-gray-900 font-inter min-h-screen overflow-hidden">
      <style jsx>{`
        @keyframes shootingStar {
          0% { transform: translate(0, 0) rotate(225deg); opacity: 0; }
          10%, 70% { opacity: 1; }
          100% { transform: translate(300px, 300px) rotate(225deg); opacity: 0; }
        }
      `}</style>

      {stars.length > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none hidden sm:block">
          {stars.map((star) => (
            <ShootingStar key={star.id} style={star.style} />
          ))}
        </div>
      )}

      <NavBar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 sm:pt-28">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-gray-700 pb-6 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Our Collection</h1>
        </div>

        <section className="pt-6 pb-24">
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600"
            >
              <FunnelIcon className="h-5 w-5 mr-2 text-yellow-400" />
              {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            {mobileFiltersOpen && (
              <div className="mt-4 space-y-6 bg-gray-800 p-4 rounded-lg">
                {filters.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-sm font-semibold text-white mb-2">{section.name}</h3>
                    <ul className="space-y-2">
                      {section.options.map((option, index) => (
                        <li key={index}>
                          <label className="flex items-center text-sm text-gray-300">
                            <input
                              type="checkbox"
                              className="mr-2 form-checkbox h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
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
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            <form className="hidden lg:block">
              {filters.map((section) => (
                <div key={section.id} className="border-b border-gray-700 pb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">{section.name}</h3>
                  <ul className="space-y-2">
                    {section.options.map((option, index) => (
                      <li key={index}>
                        <label className="flex items-center text-sm text-gray-300">
                          <input
                            type="checkbox"
                            className="mr-2 form-checkbox h-4 w-4 text-blue-600 border-gray-600 rounded bg-gray-700"
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
              {loading ? <CapsuleLoader /> : <ProductGrid products={displayedProducts} />}
              {displayedProducts.length < filteredAndSortedProducts.length && (
                <div ref={bottomRef} className="text-center py-10">
                  <CapsuleLoader />
                </div>
              )}
              {!loading && displayedProducts.length === 0 && (
                <div className="text-center py-10 text-gray-400">No products found matching your criteria.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
