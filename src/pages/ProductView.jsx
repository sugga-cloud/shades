'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient' // your supabase client import
import { getProductById, getAllProducts } from '../services/productService'
import NavBar from '../components/AccountNavBar' // Assuming you have a NavBar component
// Component for a single falling star (reused from ProductHero)
const FallingStar = ({ style }) => (
  <div
    className="absolute bg-yellow-400 rounded-full opacity-0" // Golden yellow stars
    style={style}
  ></div>
);

// Helper function for classNames
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedSize, setSelectedSize] = useState('M')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [message, setMessage] = useState(null); // State for custom message box
  const canvasRef = useRef(null); // Ref for the canvas element

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


  // Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await getProductById(id)
        setProduct(data)
      } catch (error) {
        console.error('Failed to fetch product:', error)
        setMessage({ type: 'error', text: 'Failed to load product details.' });
      }
    }
    fetchProduct()
  }, [id])

  // Fetch related products
  useEffect(() => {
    async function fetchRelated() {
      try {
        const allProducts = await getAllProducts()
        const filtered = allProducts.filter(p => p.id !== parseInt(id))
        const shuffled = filtered.sort(() => 0.5 - Math.random())
        setRelatedProducts(shuffled.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch related products:', err)
      }
    }
    fetchRelated()
  }, [id])

  // Add to cart function
  async function addToCart(productId, color, size, quantity = 1) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setMessage({ type: 'error', text: 'Please login to add items to your cart.' });
        return false
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: user.id,
            product_id: productId,
            color,
            size,
            quantity,
          },
        ])

      if (error) {
        console.error('Supabase insert error:', error)
        setMessage({ type: 'error', text: 'Failed to add to cart.' });
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error adding to cart:', error)
      setMessage({ type: 'error', text: 'Failed to add to cart.' });
      return false
    }
  }

  // Handle Add to Bag button click
  const handleAddToBag = async () => {
    if (product && selectedColor && selectedSize) {
      const success = await addToCart(product.id, selectedColor, selectedSize, 1)
      if (success) {
        setMessage({ type: 'success', text: `Added ${product.title} (Color: ${selectedColor}, Size: ${selectedSize}) to cart!` });
      }
    }
  }

  // Handle Buy Now button click
  const handleBuyNow = async () => {
    if (product && selectedColor && selectedSize) {
      const success = await addToCart(product.id, selectedColor, selectedSize, 1)
      if (success) {
        navigate('/checkout'); // Navigate to checkout on success
      }
    }
  }

  if (!product) {
    return <div className="text-center py-10 text-gray-400 bg-gray-900 min-h-screen">Loading product details...</div>
  }

  const colors = [
    { name: 'Black', className: 'bg-black' },
    { name: 'White', className: 'bg-white border border-gray-600' }, // Adjusted border for dark bg
    { name: 'Red', className: 'bg-red-600' },
    { name: 'Blue', className: 'bg-blue-600' },
    { name: 'Yellow', className: 'bg-yellow-400' },
  ]

  const sizes = ['S', 'M', 'L', 'XL', 'XXL']

  return (
    <div className="bg-gray-900 font-inter min-h-screen relative overflow-hidden">
      {/* Falling Stars Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none"></canvas>

      {/* Custom Message Box */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg z-50
                         ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 font-bold">X</button>
        </div>
      )}

      {/* NavBar (assuming it's dark-theme compatible or styled separately) */}
      
      <div className="relative z-10 pt-6 pb-24"> {/* Added padding-bottom for overall spacing */}
      <NavBar /> {/* Uncomment if you have a NavBar component */}
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-8 text-center"> {/* Larger, bolder title */}
            {product.title}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-gray-800 p-8 rounded-xl shadow-2xl"> {/* Darker card background */}
            {/* Product Image Section */}
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-xl border border-gray-700"> {/* Added border */}
              <img
                src={product.image_url}
                alt={product.image_alt}
                className="size-full object-cover rounded-lg transform transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Product Details Section */}
            <div>
              <p className="text-4xl font-bold text-yellow-400 mb-6">{`$${product.price.toFixed(2)}`}</p> {/* Larger price, golden yellow */}

              {/* Color Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Color</h3>
                <div className="flex space-x-3">
                  {colors.map(({ name, className: colorClass }) => (
                    <label key={name} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={name}
                        checked={selectedColor === name}
                        onChange={() => setSelectedColor(name)}
                        className="sr-only"
                      />
                      <span
                        className={classNames(
                          colorClass,
                          'block w-10 h-10 rounded-full border-2 transform transition-transform duration-200',
                          selectedColor === name ? 'ring-4 ring-offset-2 ring-yellow-500 ring-offset-gray-800' : 'border-gray-600 hover:scale-110'
                        )}
                        aria-label={name}
                      ></span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-2">Size</h3>
                <div className="grid grid-cols-5 gap-4 max-w-xs">
                  {sizes.map((size) => (
                    <label
                      key={size}
                      className={classNames(
                        'cursor-pointer rounded-md border-2 py-3 text-center text-base font-medium transition-all duration-200',
                        selectedSize === size
                          ? 'border-yellow-500 bg-yellow-900 text-yellow-500 shadow-md' // Selected state
                          : 'border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white' // Unselected state
                      )}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={size}
                        checked={selectedSize === size}
                        onChange={() => setSelectedSize(size)}
                        className="sr-only"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToBag}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg
                             transform transition-transform duration-200 hover:scale-105"
                >
                  Add to Bag
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg
                             transform transition-transform duration-200 hover:scale-105"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Product Description
          <div className="mt-16 bg-gray-800 p-8 rounded-xl shadow-2xl text-white">
            <h3 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed">{product.description || 'No description available for this product.'}</p>
          </div> */}

          {/* Related Products Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-10 text-center">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block bg-gray-800 rounded-xl shadow-lg overflow-hidden
                                                                    transform hover:scale-105 transition-transform duration-300">
                  <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-gray-700">
                    <img
                      src={p.image_url}
                      alt={p.image_alt || p.title}
                      className="size-full object-cover object-center group-hover:opacity-85 transition-opacity duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mt-2 text-lg font-semibold text-white">{p.title}</h3>
                    <p className="mt-1 text-xl font-bold text-yellow-400">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
