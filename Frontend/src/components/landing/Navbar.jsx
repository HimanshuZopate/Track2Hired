import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-graphite-900/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 z-50">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Track</span>
              <span className="text-blue-500 mx-[1px]">2</span>
              <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">Hired</span>
            </span>
          </Link>

          {/* Desktop: Nav links + Auth buttons all on the right */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-almond/80 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-almond/80 hover:text-white transition-colors text-sm font-medium">How it Works</a>
            <div className="w-px h-5 bg-white/15" />
            <Link
              to="/login"
              className="text-almond/90 hover:text-white font-medium text-sm transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full bg-blue-600/90 text-white font-semibold text-sm hover:bg-blue-500 hover:shadow-neonBlue transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-almond z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <motion.div
        initial={false}
        animate={mobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto", pointerEvents: "auto" },
          closed: { opacity: 0, height: 0, pointerEvents: "none" }
        }}
        className="md:hidden absolute top-full left-0 right-0 bg-graphite-900/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
      >
        <div className="flex flex-col px-4 py-6 gap-6">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl text-almond/90 font-medium"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl text-almond/90 font-medium"
          >
            How it Works
          </a>
          <div className="h-px bg-white/10 w-full my-2"></div>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xl text-almond/90 font-medium"
          >
            Log in
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-center py-4 rounded-xl bg-blue-600 text-white font-bold text-lg mt-2"
          >
            Get Started
          </Link>
        </div>
      </motion.div>
    </header>
  );
};

export default Navbar;
