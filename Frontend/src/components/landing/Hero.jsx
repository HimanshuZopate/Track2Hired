import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, BrainCircuit, ListTodo } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-almond drop-shadow-[0_0_10px_rgba(110,231,183,0.3)]">Track</span>
            <span className="text-blue-500 inline-block transform hover:scale-110 hover:rotate-12 transition-transform duration-300 mx-[2px] drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]">2</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-almond drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">Hired</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-almond/80 max-w-3xl mx-auto mb-10 font-light">
            Your Smart Path to Placement Success
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/register"
            className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold text-lg hover:bg-blue-500 hover:shadow-neonBlue transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto min-w-[160px]"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 rounded-full bg-graphite-800/80 backdrop-blur-md border border-white/10 text-almond font-semibold text-lg hover:bg-graphite-700 hover:border-white/20 hover:shadow-neonPurple transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto min-w-[160px]"
          >
            Login
          </Link>
        </motion.div>
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-[10%] hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-blue-400 shadow-neonBlue"
      >
        <BarChart3 size={32} />
      </motion.div>
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 left-[15%] hidden lg:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-emerald-400 shadow-neonEmerald"
      >
        <FileText size={28} />
      </motion.div>
      <motion.div
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-1/3 right-[12%] hidden lg:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-purple-400 shadow-neonPurple"
      >
        <BrainCircuit size={40} />
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-1/4 right-[18%] hidden lg:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-amber-400 shadow-neonAmber"
      >
        <ListTodo size={24} />
      </motion.div>
    </section>
  );
};

export default Hero;
