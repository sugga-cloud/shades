'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid' // Keep if needed for other components, but not directly used here now

export default function ContactSalesPage() {
  // Removed formData state as the form is removed
  // Removed handleChange and handleSubmit functions as the form is removed

  // Ref for the canvas element
  const canvasRef = useRef(null);

  // Function to handle the "Call Now" button click
  const handleCallNow = () => {
    window.location.href = 'tel:8227540091'; // Initiates a phone call
  };

  // Effect for snow falling animation (retained)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions to fill the window
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions(); // Initial set

    // Handle window resize
    window.addEventListener('resize', setCanvasDimensions);

    // Snowflake properties
    const snowflakes = [];
    const numSnowflakes = 100; // Number of snowflakes
    const minRadius = 1;
    const maxRadius = 3;
    const minSpeed = 0.5;
    const maxSpeed = 2;

    // Create snowflakes
    for (let i = 0; i < numSnowflakes; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * (maxRadius - minRadius) + minRadius,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        opacity: Math.random() * 0.5 + 0.5, // Random opacity for subtle effect
      });
    }

    // Draw a single snowflake
    const drawSnowflake = (flake) => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${flake.opacity})`; // Changed to golden yellow with varying opacity
      ctx.fill();
    };

    // Update snowflake position
    const updateSnowflake = (flake) => {
      flake.y += flake.speed;
      // If snowflake goes off screen, reset it to the top
      if (flake.y > canvas.height) {
        flake.y = -flake.radius; // Start slightly above the top
        flake.x = Math.random() * canvas.width; // New random x position
        flake.radius = Math.random() * (maxRadius - minRadius) + minRadius; // New random size
        flake.speed = Math.random() * (maxSpeed - minSpeed) + minSpeed; // New random speed
        flake.opacity = Math.random() * 0.5 + 0.5; // New random opacity
      }
    };

    // Animation loop
    const animateSnow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      snowflakes.forEach((flake) => {
        drawSnowflake(flake);
        updateSnowflake(flake);
      });
      animationFrameId = requestAnimationFrame(animateSnow);
    };

    animateSnow(); // Start the animation

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId); // Stop animation loop
      window.removeEventListener('resize', setCanvasDimensions); // Remove resize listener
    };
  }, []);


  return (
    <div className="relative isolate bg-gray-900 px-6 py-24 sm:py-32 lg:px-8 font-inter text-gray-700 min-h-screen"> {/* Changed bg-white to bg-gray-900 for dark theme */}
      {/* Snowfall Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none"></canvas>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-1/2 -z-10 aspect-1155/678 w-[36.09375rem] max-w-none -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
        ></div>
      </div>
      <div className="mx-auto max-w-2xl text-center relative z-10">
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Contact Us</h2> {/* Changed text-gray-900 to text-white */}
        <p className="mt-2 text-lg/8 text-gray-300">Have a question or need assistance? Reach out to us!</p> {/* Changed text-gray-600 to text-gray-300 */}

        {/* Organization Contact Block */}
        <div className="mt-8 text-left p-6 bg-gray-800 rounded-lg shadow-sm text-white"> {/* Darker background for contact block, white text */}
          <h3 className="text-xl font-semibold mb-4">Our Contact Details</h3>
          <p className="text-base mb-2"><strong>Email:</strong> theshadestore81@gmail.com</p>
          <p className="text-base mb-2"><strong>Phone:</strong> +91 8227540091</p>
          </div>
      </div>
      
      {/* Replaced form with Call Now button */}
      <div className="mt-16 max-w-xl mx-auto relative z-10 text-center">
        <button
          type="button"
          onClick={handleCallNow}
          className="inline-block rounded-md bg-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 transition-colors duration-200 transform hover:scale-105"
        >
          Call Now: 8227540091
        </button>
      </div>
    </div>
  )
}
