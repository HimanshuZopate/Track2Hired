import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Preview from '../components/landing/Preview';
import HowItWorks from '../components/landing/HowItWorks';
import CTA from '../components/landing/CTA';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const Landing = () => {
  // If user is already authenticated, redirect to dashboard
  // Prevents the back-button flaw where logged-in users see landing page
  const token = getAuthToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

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

