'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Single falling star visual
const FallingStar = ({ style }) => (
  <div className="absolute bg-white rounded-full opacity-0" style={style}></div>
)

export default function ProductHero() {
  const [stars, setStars] = useState([])
  const starContainerRef = useRef(null)

  useEffect(() => {
    const headingText = 'Summer styles are finally here'
    const headingElement = document.getElementById('product-animated-heading')
    if (!headingElement) return

    headingElement.innerHTML = ''
    let totalDelay = 0

    headingText.split(' ').forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span')
      wordSpan.className = 'inline-block whitespace-nowrap'

      word.split('').forEach((char) => {
        const charSpan = document.createElement('span')
        charSpan.textContent = char
        charSpan.className = 'inline-block opacity-0 transform translate-y-full'
        wordSpan.appendChild(charSpan)

        const currentDelay = totalDelay
        setTimeout(() => {
          charSpan.offsetHeight
          charSpan.classList.add('transition-all', 'duration-500', 'ease-out')
          charSpan.classList.remove('opacity-0', 'translate-y-full')
          charSpan.classList.add('opacity-100', 'translate-y-0')
          charSpan.style.color = '#FFD700'
        }, currentDelay)

        totalDelay += 70
      })

      headingElement.appendChild(wordSpan)

      if (wordIndex < headingText.split(' ').length - 1) {
        const spaceSpan = document.createElement('span')
        spaceSpan.innerHTML = '&nbsp;'
        spaceSpan.className = 'inline-block'
        headingElement.appendChild(spaceSpan)
        totalDelay += 50
      }
    })

    const generateStars = () => {
      const newStars = []
      const numStars = 50

      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 4 + 1
        const duration = Math.random() * 10 + 5
        const delay = Math.random() * 10
        const left = Math.random() * 100
        const top = Math.random() * -100

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
        })
      }
      setStars(newStars)
    }

    generateStars()
    window.addEventListener('resize', generateStars)
    return () => window.removeEventListener('resize', generateStars)
  }, [])

  const productImages = [
    { src: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=870', alt: 'Stylish black jacket' },
    { src: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=870', alt: 'Blue denim jeans' },
    { src: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=435', alt: 'White t-shirt' },
    { src: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=387', alt: 'Elegant dress' },
    { src: 'https://images.unsplash.com/photo-1600950207944-0d63e8edbc3f?q=80&w=464', alt: 'Clothing rack' },
  ]

  return (
    <div className="relative min-h-screen bg-gray-900 font-inter overflow-hidden">
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0vh); opacity: 0.3; }
          20%, 80% { opacity: 1; }
          100% { transform: translateY(200vh); opacity: 0; }
        }

        .image-card-item {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 280px;
          transform-origin: center;
          transition: transform 0.5s ease-out, box-shadow 0.3s ease-out, z-index 0.3s ease-out;
          pointer-events: auto;
        }

        .image-card-item:nth-child(1) { transform: translate(-100%, -50%) rotate(-20deg); z-index: 8; }
        .image-card-item:nth-child(2) { transform: translate(-70%, -50%) rotate(-10deg); z-index: 7; }
        .image-card-item:nth-child(3) { transform: translate(-40%, -50%) rotate(-5deg); z-index: 6; }
        .image-card-item:nth-child(4) { transform: translate(-10%, -50%) rotate(0deg); z-index: 5; }
        .image-card-item:nth-child(5) { transform: translate(20%, -50%) rotate(5deg); z-index: 4; }

        .image-card-item:hover {
          transform: translate(-50%, -50%) scale(1.1) rotate(0deg);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
          z-index: 100 !important;
        }
      `}</style>

      {/* Falling Stars */}
      <div ref={starContainerRef} className="absolute inset-0 z-0 pointer-events-none">
        {stars.map((star) => <FallingStar key={star.id} style={star.style} />)}
      </div>

      {/* Hero content */}
      <div className="relative z-10 pt-24 pb-40 sm:pt-32 sm:pb-52 lg:pt-40 lg:pb-60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="sm:max-w-lg">
            <h1 id="product-animated-heading" className="text-4xl sm:text-6xl font-bold tracking-tight text-white" />
            <p className="mt-4 text-lg sm:text-xl text-gray-300">
              This year, our new summer collection will shelter you from the harsh elements of a world that doesn’t care if you live or die.
            </p>
            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-block rounded-md bg-yellow-500 hover:bg-yellow-600 px-8 py-3 text-center font-medium text-gray-900 transition-colors shadow-md"
              >
                Shop Collection
              </Link>
            </div>
          </div>

          {/* Fanned Product Cards */}
          <div
            aria-hidden="true"
            className="pointer-events-none lg:absolute lg:inset-y-0 lg:left-[50%] lg:right-0 flex items-center justify-center lg:justify-start"
          >
            <div className="relative w-[400px] h-[500px] sm:w-[500px] sm:h-[600px] lg:w-[600px] lg:h-[700px] mx-auto lg:mx-0">
              {productImages.map((image, index) => (
                <div key={index} className="rounded-lg shadow-xl overflow-hidden image-card-item">
                  <img src={image.src} alt={image.alt} className="size-full object-cover rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
