import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github, Mail, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-graphite-900 border-t border-white/10 pt-20 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <span className="text-3xl font-extrabold tracking-tight">
                <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Track</span>
                <span className="text-blue-500 mx-[1px]">2</span>
                <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">Hired</span>
              </span>
            </Link>
            <p className="text-almond/60 text-sm leading-relaxed mb-6">
              Your smart path to placement success. We provide AI-driven tools to help you master interviews, build your resume, and land your dream job faster.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-almond hover:text-blue-400 hover:bg-white/10 hover:border-blue-400/50 hover:shadow-neonBlue transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-almond hover:text-blue-500 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-neonBlue transition-all duration-300">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-almond hover:text-purple-400 hover:bg-white/10 hover:border-purple-400/50 hover:shadow-neonPurple transition-all duration-300">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-almond font-semibold text-lg mb-6">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/ai-practice" className="text-almond/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  AI Interview Practice
                </Link>
              </li>
              <li>
                <Link to="/resume" className="text-almond/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Resume Studio
                </Link>
              </li>
              <li>
                <Link to="/skills" className="text-almond/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Skill Tracking
                </Link>
              </li>
              <li>
                <Link to="/tasks" className="text-almond/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Task Manager
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Resources */}
          <div>
            <h3 className="text-almond font-semibold text-lg mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-almond/60 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link to="/careers" className="text-almond/60 hover:text-white transition-colors text-sm">Careers</Link></li>
              <li><Link to="/blog" className="text-almond/60 hover:text-white transition-colors text-sm">Blog</Link></li>
              <li><Link to="/contact" className="text-almond/60 hover:text-white transition-colors text-sm">Contact</Link></li>
              <li><Link to="/privacy" className="text-almond/60 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h3 className="text-almond font-semibold text-lg mb-6">Stay Updated</h3>
            <p className="text-almond/60 text-sm mb-4">
              Subscribe to our newsletter for the latest placement tips and platform updates.
            </p>
            <form className="relative mb-6 group" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="flex flex-col gap-3">
              <a href="mailto:track2hired@prpote.edu.in" className="text-almond/60 hover:text-white transition-colors text-sm flex items-center gap-2">
                <Mail size={16} className="text-blue-400" />
                track2hired@prpote.edu.in
              </a>
              <div className="text-almond/60 text-sm flex items-start gap-2">
                <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>P R Pote College Of Engineering And Management, Amravati, Maharashtra 444602</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-almond/40 text-sm">
            &copy; {currentYear} Track2Hired · P R Pote College Of Engineering And Management, Amravati. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-almond/40">
            <Link to="/privacy" className="hover:text-almond/80 transition-colors">Privacy Policy</Link>
            <a href="#" className="hover:text-almond/80 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
