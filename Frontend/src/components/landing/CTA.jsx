import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden group"
        >
          {/* Subtle animated background in CTA card */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <h2 className="text-4xl md:text-6xl font-bold text-almond mb-6 relative z-10">
            Start Your Placement Journey Today
          </h2>
          <p className="text-xl text-almond/70 mb-10 max-w-2xl mx-auto font-light relative z-10">
            Join thousands of students who are already using Track2Hired to land their dream roles.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-almond text-graphite-900 font-bold text-lg hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(245,241,232,0.3)] relative z-10"
          >
            Get Started <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>

    </section>
  );
};

export default CTA;
