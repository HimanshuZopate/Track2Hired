import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, MessageSquare, CheckCircle2, Github, Linkedin } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const faqs = [
  { q: 'Is Track2Hired free to use?', a: 'Yes, Track2Hired is completely free for all students of P R Pote College Of Engineering And Management. Simply register and get full access to all features.' },
  { q: 'What kind of questions are in AI practice?', a: 'We have 500+ questions across DSA, DBMS, OS, Computer Networks, OOP and core CS — both MCQ and theory.' },
  { q: 'Can I use it on mobile?', a: 'Absolutely! Track2Hired is fully responsive and works on all modern mobile browsers.' },
  { q: 'How do I report a bug or suggest a feature?', a: 'Use the contact form on this page or email track2hired@prpote.edu.in directly.' },
  { q: 'Is my data safe?', a: 'Yes. We use industry-standard encryption and never share personal data with third parties. See our Privacy Policy for details.' },
];

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 right-1/3 w-[500px] h-[350px] bg-teal-900/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium mb-6">
              <MessageSquare size={16} /> Get in Touch
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-almond mb-6">
              We'd love to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">hear from you</span>
            </h1>
            <p className="text-almond/60 text-xl leading-relaxed max-w-2xl mx-auto">
              Have a question, found a bug, or want to collaborate? Our team is just a message away.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-almond mb-8">Contact Information</h2>
            <div className="space-y-6 mb-10">
              {[
                { icon: <Mail size={20} className="text-blue-400" />, bg: 'bg-blue-500/10 border-blue-500/20', label: 'Email', content: <a href="mailto:track2hired@prpote.edu.in" className="text-almond/60 hover:text-blue-400 transition-colors text-sm">track2hired@prpote.edu.in</a> },
                { icon: <MapPin size={20} className="text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Address', content: <p className="text-almond/60 text-sm leading-relaxed">P R Pote College Of Engineering And Management<br />Kathora Road, Amravati, Maharashtra 444602</p> },
                { icon: <Clock size={20} className="text-purple-400" />, bg: 'bg-purple-500/10 border-purple-500/20', label: 'Response Time', content: <p className="text-almond/60 text-sm">Usually within 24–48 hours on working days.</p> },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center shrink-0`}>{item.icon}</div>
                  <div><p className="text-almond font-medium mb-1">{item.label}</p>{item.content}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-blue-400 hover:border-blue-400/50 transition-all"><Linkedin size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-purple-400 hover:border-purple-400/50 transition-all"><Github size={18} /></a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-2xl p-12 min-h-[400px]">
                <CheckCircle2 size={56} className="text-emerald-400 mb-4" />
                <h3 className="text-2xl font-bold text-almond mb-2">Message Sent!</h3>
                <p className="text-almond/60 mb-6">We'll get back to you within 24–48 hours.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Send another message</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
                <h2 className="text-2xl font-bold text-almond mb-2">Send us a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-almond/60 text-sm mb-1.5 block">Your Name</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rahul Sharma" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-almond/60 text-sm mb-1.5 block">Email Address</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-almond/60 text-sm mb-1.5 block">Subject</label>
                  <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Question about AI Practice" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-almond/60 text-sm mb-1.5 block">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell us how we can help..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-almond placeholder:text-almond/30 focus:outline-none focus:border-blue-500/50 transition-all resize-none" />
                </div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-300">Send Message</button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-almond text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="text-almond font-medium">{faq.q}</span>
                  <span className={`text-almond/40 text-lg transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-almond/60 text-sm leading-relaxed border-t border-white/10 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
