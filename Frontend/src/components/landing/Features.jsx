import React from 'react';
import { motion } from 'framer-motion';
import { Brain, FileCheck, Target, CheckSquare, Flame } from 'lucide-react';

const features = [
  {
    icon: <Brain size={32} className="text-purple-400" />,
    title: "AI Interview Practice",
    description: "Simulate real-world technical interviews with our advanced AI engine and get instant feedback.",
    glowColor: "hover:shadow-neonPurple"
  },
  {
    icon: <FileCheck size={32} className="text-emerald-400" />,
    title: "Resume Analyzer",
    description: "Get actionable insights to improve your resume score and bypass ATS screening.",
    glowColor: "hover:shadow-neonEmerald"
  },
  {
    icon: <Target size={32} className="text-blue-400" />,
    title: "Skill Tracking",
    description: "Monitor your technical proficiency and identify gaps in your knowledge.",
    glowColor: "hover:shadow-neonBlue"
  },
  {
    icon: <CheckSquare size={32} className="text-amber-400" />,
    title: "Task Manager",
    description: "Organize your daily preparation, assignments, and application deadlines efficiently.",
    glowColor: "hover:shadow-neonAmber"
  },
  {
    icon: <Flame size={32} className="text-orange-400" />,
    title: "Streak System",
    description: "Build consistency and stay motivated with daily tracking and rewards.",
    glowColor: "hover:shadow-neonAmber"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-almond mb-4">
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">succeed</span>
          </h2>
          <p className="text-almond/60 text-lg max-w-2xl mx-auto font-light">
            Powerful tools designed specifically for students and professionals to land their dream jobs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${feature.glowColor}`}
            >
              <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-almond mb-3">{feature.title}</h3>
              <p className="text-almond/60 leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
