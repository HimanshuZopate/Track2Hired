import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Target, Lightbulb, Award, GraduationCap, ArrowRight, MapPin } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const team = [
  { name: 'Himanshu Zopate', role: 'Project Lead & Full-Stack Developer', initials: 'HZ', color: 'from-purple-500 to-blue-500' },
  { name: 'Faculty Mentor', role: 'Department of Computer Engineering', initials: 'FM', color: 'from-emerald-500 to-teal-500' },
  { name: 'Backend Engineer', role: 'Node.js & MongoDB Specialist', initials: 'BE', color: 'from-amber-500 to-orange-500' },
  { name: 'UI/UX Designer', role: 'Frontend & Design Systems', initials: 'UD', color: 'from-pink-500 to-rose-500' },
];

const values = [
  { icon: <Target size={28} className="text-blue-400" />, title: 'Student-First', description: 'Every feature is designed with the real student journey in mind — from learning to landing a job.' },
  { icon: <Lightbulb size={28} className="text-amber-400" />, title: 'AI-Powered', description: 'We leverage cutting-edge AI to give students the kind of feedback that was once only available in expensive coaching.' },
  { icon: <Award size={28} className="text-emerald-400" />, title: 'Excellence', description: 'We are committed to building tools that meet industry standards and help students compete globally.' },
  { icon: <Users size={28} className="text-purple-400" />, title: 'Community', description: 'Born in a college campus, we understand the community and build for it — inclusively and accessibly.' },
];

const AboutUs = () => {
  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
              <GraduationCap size={16} /> Academic Project — P R Pote College
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-almond mb-6 leading-tight">
              Built for students,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">by students</span>
            </h1>
            <p className="text-almond/60 text-xl leading-relaxed max-w-2xl mx-auto">
              Track2Hired is an AI-powered placement preparation platform developed at P R Pote College Of Engineering And Management, Amravati — to help every student land their dream job.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="text-3xl md:text-4xl font-bold text-almond mb-6">Our Mission</h2>
              <p className="text-almond/70 text-lg leading-relaxed mb-6">
                The placement season is one of the most stressful periods in a student's academic life. We saw our peers struggling with scattered resources, no structured practice plan, and no way to track their progress objectively.
              </p>
              <p className="text-almond/70 text-lg leading-relaxed mb-6">
                Track2Hired was created to change that. We built a single, intelligent platform where students can practice AI-driven mock interviews, build ATS-optimized resumes, track skill gaps, manage tasks, and maintain daily streaks — all in one place.
              </p>
              <div className="flex items-center gap-3 text-almond/50 text-sm">
                <MapPin size={16} className="text-emerald-400 shrink-0" />
                <span>P R Pote College Of Engineering And Management, Amravati, Maharashtra</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: '500+', label: 'Students Onboarded', color: 'text-blue-400' },
                  { number: '10K+', label: 'Practice Sessions', color: 'text-purple-400' },
                  { number: '85%', label: 'Placement Rate', color: 'text-emerald-400' },
                  { number: '4.8★', label: 'Student Rating', color: 'text-amber-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.number}</p>
                    <p className="text-almond/60 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-almond mb-4">What We Stand For</h2>
            <p className="text-almond/60 text-lg">The values that guide every decision we make.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-5">{v.icon}</div>
                <h3 className="text-almond font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-almond/60 text-sm leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-almond mb-4">The Team</h2>
            <p className="text-almond/60 text-lg">A passionate group of engineers and designers from P R Pote College.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-xl mx-auto mb-4`}>
                  {member.initials}
                </div>
                <h3 className="text-almond font-semibold mb-1">{member.name}</h3>
                <p className="text-almond/50 text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-almond mb-4">Ready to start your journey?</h2>
          <p className="text-almond/60 mb-8">Join hundreds of students already preparing smarter with Track2Hired.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 hover:shadow-neonBlue transition-all duration-300">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
