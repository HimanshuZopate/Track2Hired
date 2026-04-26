import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Code2, LineChart, Trophy } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus size={28} />,
    title: "Add Skills",
    description: "Input your tech stack and target role."
  },
  {
    icon: <Code2 size={28} />,
    title: "Practice Questions",
    description: "Take AI-driven mock interviews."
  },
  {
    icon: <LineChart size={28} />,
    title: "Track Progress",
    description: "Monitor improvements over time."
  },
  {
    icon: <Trophy size={28} />,
    title: "Get Hired",
    description: "Ace the real interview with confidence."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-almond mb-4">
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">works</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[40px] left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-graphite-800 border-2 border-white/10 flex items-center justify-center mb-6 text-almond group-hover:border-purple-400 group-hover:text-purple-400 group-hover:shadow-neonPurple transition-all duration-300 relative bg-graphite-900">
                  {step.icon}
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm border-4 border-graphite-900 shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-almond mb-2">{step.title}</h3>
                <p className="text-almond/60 font-light max-w-[200px]">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
