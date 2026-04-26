import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Tag, ArrowRight, TrendingUp, Users, Lightbulb } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const posts = [
  {
    category: 'Interview Tips',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: <Lightbulb size={14} />,
    title: 'How to Crack Technical Rounds at Top MNCs',
    excerpt: 'Most students fail technical rounds not because of lack of knowledge but poor communication and problem-solving approach. Here is a proven framework to structure your answers.',
    readTime: '6 min read',
    date: 'April 20, 2026',
    author: 'Himanshu Zopate',
  },
  {
    category: 'Skill Development',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <TrendingUp size={14} />,
    title: 'The 90-Day Placement Preparation Roadmap',
    excerpt: 'A structured, week-by-week guide to preparing for campus placements — from data structures to soft skills — designed specifically for engineering students.',
    readTime: '8 min read',
    date: 'April 15, 2026',
    author: 'Track2Hired Team',
  },
  {
    category: 'Resume',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    icon: <BookOpen size={14} />,
    title: 'ATS-Proof Resume: Everything You Need To Know',
    excerpt: 'Applicant Tracking Systems reject over 70% of resumes before a human ever sees them. Learn how to beat the bots and get your resume noticed.',
    readTime: '5 min read',
    date: 'April 10, 2026',
    author: 'Track2Hired Team',
  },
  {
    category: 'AI Practice',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: <Users size={14} />,
    title: 'AI Mock Interviews: Are They Really Effective?',
    excerpt: 'We analysed data from 500+ students who used AI mock interviews on Track2Hired. The results were surprising — students who practiced 3x per week saw 42% better offer rates.',
    readTime: '7 min read',
    date: 'April 5, 2026',
    author: 'Himanshu Zopate',
  },
  {
    category: 'Campus Life',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    icon: <BookOpen size={14} />,
    title: 'Balancing Academics and Placement Prep: A Practical Guide',
    excerpt: 'You don\'t have to sacrifice your GPA to crack placements. Here is how to create a balanced schedule that keeps both in check during your final year.',
    readTime: '4 min read',
    date: 'March 28, 2026',
    author: 'Track2Hired Team',
  },
  {
    category: 'Interview Tips',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: <Lightbulb size={14} />,
    title: 'Top 10 HR Questions and How to Answer Them',
    excerpt: 'HR rounds trip up even the most technically prepared students. Master these 10 classic questions with structured answers that leave a lasting impression.',
    readTime: '9 min read',
    date: 'March 22, 2026',
    author: 'Track2Hired Team',
  },
];

const Blog = () => {
  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
              <BookOpen size={16} /> Track2Hired Blog
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-almond mb-6">
              Insights &amp; Guides for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> placement success</span>
            </h1>
            <p className="text-almond/60 text-xl leading-relaxed max-w-2xl mx-auto">
              Practical advice, preparation strategies, and real stories from students who cracked their dream placements.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-white/10 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-10 items-center hover:border-white/20 transition-all duration-300 cursor-pointer">
            <div className="flex-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-4 text-blue-400 bg-blue-500/10 border-blue-500/20`}>
                <Lightbulb size={12} /> Featured · Interview Tips
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-almond mb-4">How to Crack Technical Rounds at Top MNCs</h2>
              <p className="text-almond/60 leading-relaxed mb-6">
                Most students fail technical rounds not because of lack of knowledge but poor communication and problem-solving approach. Here is a proven framework to structure your answers.
              </p>
              <div className="flex items-center gap-6 text-almond/40 text-sm">
                <span className="flex items-center gap-1.5"><Clock size={14} /> 6 min read</span>
                <span>April 20, 2026</span>
                <span>by Himanshu Zopate</span>
              </div>
            </div>
            <div className="w-full md:w-48 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10">
              <Lightbulb size={56} className="text-blue-400/50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-almond mb-8">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.article key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-4 ${post.color}`}>
                  {post.icon} {post.category}
                </span>
                <h3 className="text-almond font-semibold text-lg mb-3 group-hover:text-blue-300 transition-colors leading-snug">{post.title}</h3>
                <p className="text-almond/50 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-almond/40 text-xs">
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  <span>{post.date}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-almond mb-4">Never miss a post</h2>
          <p className="text-almond/60 mb-8">Get the latest placement tips and guides delivered straight to your inbox. No spam.</p>
          <form onSubmit={e => e.preventDefault()} className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 transition-all" />
            <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
