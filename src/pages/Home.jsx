import Hero from '../components/Hero';
import HeroPromo from '../components/HeroPromo';
import Products from '../components/Products';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <div className="bg-white">
      <Hero />
      <Products text='New Arrivals' />
      <Products text='Best Sellers' />
      <HeroPromo />
      <Contact />
      {/* Add more components or content here as needed */}
    </div>
  );
}