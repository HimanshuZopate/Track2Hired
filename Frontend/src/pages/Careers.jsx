import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code2, Palette, BarChart2, Users, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const openings = [
  {
    title: 'Frontend Developer (Intern)',
    type: 'Internship · On-site',
    icon: <Code2 size={22} className="text-blue-400" />,
    tags: ['React', 'Tailwind CSS', 'Framer Motion'],
    description: 'Help us craft beautiful and performant UI components. You will work directly with our design and engineering team.',
  },
  {
    title: 'Backend Developer (Intern)',
    type: 'Internship · On-site',
    icon: <BarChart2 size={22} className="text-emerald-400" />,
    tags: ['Node.js', 'Express', 'MongoDB'],
    description: 'Build robust REST APIs, integrate AI services, and help scale our backend infrastructure.',
  },
  {
    title: 'UI/UX Designer (Intern)',
    type: 'Internship · Hybrid',
    icon: <Palette size={22} className="text-purple-400" />,
    tags: ['Figma', 'User Research', 'Prototyping'],
    description: 'Create intuitive, delightful interfaces that make studying for placements less intimidating.',
  },
  {
    title: 'Community Manager',
    type: 'Volunteer · Remote',
    icon: <Users size={22} className="text-amber-400" />,
    tags: ['Social Media', 'Content', 'Events'],
    description: 'Grow and nurture our student community across colleges in Maharashtra and beyond.',
  },
];

const perks = [
  'Real-world project experience',
  'Mentorship from senior engineers',
  'Certificate of contribution',
  'Open-source contribution credits',
  'Flexible working hours',
  'Learning budget for courses',
];

const Careers = () => {
  const [applied, setApplied] = useState(null);

  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-emerald-900/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
              <Briefcase size={16} /> We're Hiring
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-almond mb-6">
              Build the future of
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400"> placement prep</span>
            </h1>
            <p className="text-almond/60 text-xl leading-relaxed max-w-2xl mx-auto">
              Join a small, passionate team of students and engineers building tools that matter. Work on real problems, ship real features, and make a real difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-almond mb-10 text-center">Open Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {openings.map((job, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">{job.icon}</div>
                  <span className="text-almond/40 text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10">{job.type}</span>
                </div>
                <h3 className="text-almond font-semibold text-lg mb-2">{job.title}</h3>
                <p className="text-almond/60 text-sm mb-4 leading-relaxed">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {job.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{tag}</span>
                  ))}
                </div>
                {applied === i ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={18} /> Application sent! We'll be in touch.
                  </div>
                ) : (
                  <button onClick={() => setApplied(i)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                    Apply Now <ArrowRight size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-almond mb-4">Why join us?</h2>
          <p className="text-almond/60 mb-12">We may be a student project, but we operate like a professional engineering team.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((perk, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-left">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span className="text-almond/80 text-sm">{perk}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-almond mb-4">Don't see your role?</h2>
          <p className="text-almond/60 mb-8">We're always open to passionate contributors. Reach out and tell us how you'd like to help.</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all duration-300">
            Contact Us <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
