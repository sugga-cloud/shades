'use client'

import { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import supabase from '../utils/supabaseClient' // Adjust path to your supabase client
import NavBar from '../components/AccountNavBar' // Assuming NavBar.jsx contains AccountNavBar

// Falling Star Component (reused from other dark-themed pages)
function FallingStar({ style }) {
  return (
    <div
      className="absolute bg-yellow-400 rounded-full opacity-0" // Golden yellow stars for visibility
      style={style}
    ></div>
  );
}

export default function CartPage({ onNavigateToCheckout, onNavigateToShop }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null); // Ref for the canvas element for stars

  // Currency formatter for Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Effect for falling stars animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    const snowflakes = [];
    const numSnowflakes = 100;
    const minRadius = 1;
    const maxRadius = 3;
    const minSpeed = 0.5;
    const maxSpeed = 2;

    for (let i = 0; i < numSnowflakes; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * (maxRadius - minRadius) + minRadius,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }

    const drawSnowflake = (flake) => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(252, 211, 77, ${flake.opacity})`; // Tailwind yellow-400 equivalent
      ctx.fill();
    };

    const updateSnowflake = (flake) => {
      flake.y += flake.speed;
      if (flake.y > canvas.height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * canvas.width;
        flake.radius = Math.random() * (maxRadius - minRadius) + minRadius;
        flake.speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        flake.opacity = Math.random() * 0.5 + 0.5;
      }
    };

    const animateSnow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snowflakes.forEach((flake) => {
        drawSnowflake(flake);
        updateSnowflake(flake);
      });
      animationFrameId = requestAnimationFrame(animateSnow);
    };

    animateSnow();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, []);

  useEffect(() => {
    async function fetchCart() {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          setCartItems([])
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            products (
              title,
              price,
              image_url,
              image_alt
            )
          `)
          .eq('user_id', user.id)

        if (fetchError) throw fetchError

        setCartItems(data || [])
      } catch (err) {
        setError(err.message || 'Failed to load cart.')
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [])

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return // Prevent quantity from going below 1
    try {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (updateError) throw updateError

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (err) {
      // Using console.error instead of alert for better user experience
      console.error('Failed to update quantity:', err.message || err)
      // Optionally, show a custom notification modal here instead of alert
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) throw deleteError

      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
    } catch (err) {
      // Using console.error instead of alert for better user experience
      console.error('Failed to remove item:', err.message || err)
      // Optionally, show a custom notification modal here instead of alert
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  )
  const shippingEstimate = cartItems.length > 0 ? 50.0 : 0 // Changed from $5 to ₹50 for a more realistic Indian context
  const taxRate = 0.08 // 8% tax rate
  const taxAmount = subtotal * taxRate
  const total = subtotal + shippingEstimate + taxAmount

  if (loading) {
    return <div className="text-center py-10 text-gray-400 bg-gray-900 min-h-screen">Loading your cart...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 bg-gray-900 min-h-screen">Error: {error}</div>
  }

  return (
    <div className="relative min-h-screen bg-gray-900 font-inter py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Falling Stars Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none"></canvas>

      {/* NavBar Component */}
      <NavBar />
      
      <div className="relative z-10 max-w-7xl mx-auto"> {/* Added relative z-10 */}
        <h1 className="text-4xl font-bold tracking-tight text-white text-center mb-10">
          Your Shopping Cart
        </h1>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-12 xl:gap-x-16">
          <div className="lg:col-span-2 bg-gray-800 p-8 rounded-lg shadow-md mb-8 lg:mb-0 border border-gray-700"> {/* Darker background, border */}
            {cartItems.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                Your cart is empty.{' '}
                <a
                  href="#shop"
                  onClick={onNavigateToShop}
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  Start shopping!
                </a>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-700"> {/* Darker divider */}
                {cartItems.map((item) => (
                  <li key={item.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-600 bg-gray-700"> {/* Darker border/bg */}
                      <img
                        src={item.products.image_url}
                        alt={item.products.image_alt}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-white"> {/* White text */}
                          <h3>
                            <a href="#">{item.products.title}</a>
                          </h3>
                          {/* Display price in Rupees */}
                          <p className="ml-4 text-yellow-400">{formatCurrency(item.products.price)}</p> {/* Golden yellow price */}
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-300"> {/* Lighter gray text */}
                          <label htmlFor={`quantity-${item.id}`} className="sr-only">
                            Quantity
                          </label>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="rounded-md border border-gray-600 px-2 py-1 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                          >
                            -
                          </button>
                          <input
                            id={`quantity-${item.id}`}
                            name={`quantity-${item.id}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 rounded-md border border-gray-600 text-center text-white focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-2 py-1 bg-gray-700"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="rounded-md border border-gray-600 px-2 py-1 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="font-medium text-red-500 hover:text-red-400 flex items-center" // Red for remove
                          >
                            <XMarkIcon className="size-4 mr-1" aria-hidden="true" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-10 lg:mt-0 lg:col-span-1">
            <section
              aria-labelledby="summary-heading"
              className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700" /* Darker background, border */
            >
              <h2 id="summary-heading" className="text-2xl font-semibold text-white mb-6">
                Order Summary
              </h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-base text-gray-300">Subtotal</dt> {/* Lighter text */}
                  {/* Display subtotal in Rupees */}
                  <dd className="text-base font-medium text-white">{formatCurrency(subtotal)}</dd> {/* White text */}
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-base text-gray-300">Shipping estimate</dt> {/* Lighter text */}
                  {/* Display shipping estimate in Rupees */}
                  <dd className="text-base font-medium text-white">{formatCurrency(shippingEstimate)}</dd> {/* White text */}
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-base text-gray-300">Tax estimate</dt> {/* Lighter text */}
                  {/* Display tax estimate in Rupees */}
                  <dd className="text-base font-medium text-white">{formatCurrency(taxAmount)}</dd> {/* White text */}
                </div>
                <div className="flex items-center justify-between border-t border-gray-700 pt-4"> {/* Darker border */}
                  <dt className="text-xl font-semibold text-white">Order total</dt> {/* White text */}
                  {/* Display total in Rupees */}
                  <dd className="text-xl font-semibold text-yellow-400">{formatCurrency(total)}</dd> {/* Golden yellow total */}
                </div>
              </dl>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (cartItems.length === 0) return
                    onNavigateToCheckout()
                  }}
                  disabled={cartItems.length === 0}
                  className="w-full rounded-md border border-transparent bg-yellow-500 px-4 py-3 text-base font-medium text-gray-900 shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
