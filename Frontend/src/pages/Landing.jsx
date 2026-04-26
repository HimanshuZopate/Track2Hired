import React from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Preview from '../components/landing/Preview';
import HowItWorks from '../components/landing/HowItWorks';
import CTA from '../components/landing/CTA';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const Landing = () => {
  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <Preview />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
