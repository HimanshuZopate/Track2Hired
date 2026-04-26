import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, Bell, ArrowRight } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const sections = [
  {
    icon: <Database size={24} className="text-blue-400" />,
    title: '1. Information We Collect',
    content: `When you register for Track2Hired, we collect the following information:

• Account Information: Your name, email address, year of study, branch, and college name.
• Usage Data: Your practice session history, skill scores, task completions, streak counts, and resume interactions.
• Device Information: Browser type, operating system, and IP address for security and analytics purposes.

We do not collect payment information as Track2Hired is free to use.`,
  },
  {
    icon: <Eye size={24} className="text-purple-400" />,
    title: '2. How We Use Your Information',
    content: `The information we collect is used exclusively to:

• Provide, maintain, and improve the Track2Hired platform.
• Personalize your learning experience and AI-generated practice questions.
• Send notifications about your progress, streaks, and platform updates.
• Analyze aggregate usage patterns to improve features.
• Ensure platform security and prevent abuse.

We do not use your data for advertising or share it with marketing companies.`,
  },
  {
    icon: <Lock size={24} className="text-emerald-400" />,
    title: '3. Data Security',
    content: `We take data security seriously:

• All data is encrypted in transit using TLS/HTTPS.
• Passwords are hashed using bcrypt with salt rounds — we never store plain-text passwords.
• Database access is restricted to authorised backend services only.
• We perform regular security reviews of our codebase.

While we implement industry-standard safeguards, no system is 100% immune to breaches. We encourage you to use a strong, unique password.`,
  },
  {
    icon: <Shield size={24} className="text-amber-400" />,
    title: '4. Data Sharing',
    content: `We do not sell, trade, or rent your personal information to any third party.

We may share data in the following limited circumstances:
• With service providers who assist us in operating the platform (e.g., cloud hosting), bound by strict confidentiality agreements.
• If required by law, court order, or government regulation.
• In the event of a merger or acquisition, with your data transferred under the same protections.

Your data stays within our ecosystem.`,
  },
  {
    icon: <Bell size={24} className="text-pink-400" />,
    title: '5. Cookies',
    content: `Track2Hired uses cookies and localStorage to:

• Maintain your login session securely.
• Remember your UI preferences.
• Analyse anonymous usage patterns via lightweight analytics.

You can clear cookies and local storage at any time through your browser settings. Doing so will log you out and reset your preferences.`,
  },
  {
    icon: <Shield size={24} className="text-teal-400" />,
    title: '6. Your Rights',
    content: `As a Track2Hired user, you have the right to:

• Access the personal data we hold about you.
• Request correction of inaccurate information.
• Request deletion of your account and associated data.
• Withdraw consent for data processing at any time.

To exercise any of these rights, please contact us at track2hired@prpote.edu.in. We will respond within 7 working days.`,
  },
  {
    icon: <Eye size={24} className="text-blue-400" />,
    title: '7. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we do, we will:

• Post the updated policy on this page with a revised "Last Updated" date.
• Notify registered users via email for material changes.

Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="bg-graphite-900 text-almond min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
              <Shield size={16} /> Privacy Policy
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-almond mb-6">
              Your privacy, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">our priority</span>
            </h1>
            <p className="text-almond/60 text-lg leading-relaxed max-w-2xl mx-auto">
              We are committed to being transparent about how we collect, use, and protect your data.
            </p>
            <p className="text-almond/40 text-sm mt-4">Last Updated: April 25, 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-7 py-5 mb-10">
            <p className="text-almond/80 text-sm leading-relaxed">
              <strong className="text-blue-300">Summary:</strong> Track2Hired is an academic project developed at P R Pote College Of Engineering And Management, Amravati. We collect only the data necessary to run the platform, we never sell your data, and you can request deletion at any time. Read the full policy below for details.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">{section.icon}</div>
                  <h2 className="text-almond font-bold text-lg">{section.title}</h2>
                </div>
                <div className="text-almond/60 text-sm leading-relaxed whitespace-pre-line">{section.content}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-almond/50 text-sm mb-6">
              Questions about this policy? Reach out at{' '}
              <a href="mailto:track2hired@prpote.edu.in" className="text-blue-400 hover:text-blue-300 transition-colors">track2hired@prpote.edu.in</a>
            </p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/15 text-almond/80 text-sm font-medium hover:bg-white/10 hover:text-white transition-all">
              Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
