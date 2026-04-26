import React from 'react';
import { motion } from 'framer-motion';

const Preview = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-almond mb-4">
            A Dashboard built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">results</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl border border-white/10 bg-graphite-800/80 backdrop-blur-xl p-2 sm:p-4 shadow-2xl hover:shadow-neonBlue transition-all duration-500 group overflow-hidden"
        >
          {/* Mac window dots */}
          <div className="flex gap-2 mb-4 px-3 pt-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
            {/* Mock Sidebar */}
            <div className="hidden md:flex flex-col gap-3 bg-white/5 rounded-xl p-4 border border-white/5 col-span-1">
              <div className="h-8 w-3/4 bg-white/10 rounded-md mb-6 animate-pulse"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-full bg-white/5 rounded-md flex items-center px-3 gap-3 hover:bg-white/10 transition-colors">
                  <div className="w-5 h-5 rounded-md bg-white/10"></div>
                  <div className="h-3 w-1/2 bg-white/10 rounded-sm"></div>
                </div>
              ))}
            </div>

            {/* Mock Main Content */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white/5 rounded-xl p-4 border border-white/5">
                <div>
                  <div className="h-4 w-32 bg-white/20 rounded-sm mb-2"></div>
                  <div className="h-6 w-48 bg-white/10 rounded-sm"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-neonBlue"></div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 aspect-video flex flex-col justify-between group-hover:bg-white/10 transition-colors duration-500">
                  <div className="flex justify-between items-center">
                     <div className="h-3 w-24 bg-white/20 rounded-sm"></div>
                     <div className="w-6 h-6 rounded-md bg-blue-500/20"></div>
                  </div>
                  <div>
                    <div className="h-8 w-16 bg-blue-400/80 rounded-sm mb-2"></div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full w-[70%] bg-blue-500"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 aspect-video flex flex-col justify-between group-hover:bg-white/10 transition-colors duration-500">
                  <div className="flex justify-between items-center">
                     <div className="h-3 w-24 bg-white/20 rounded-sm"></div>
                     <div className="w-6 h-6 rounded-md bg-emerald-500/20"></div>
                  </div>
                  <div>
                    <div className="h-8 w-16 bg-emerald-400/80 rounded-sm mb-2"></div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full w-[85%] bg-emerald-500"></div>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex bg-white/5 rounded-xl p-5 border border-white/5 aspect-video flex-col justify-between group-hover:bg-white/10 transition-colors duration-500">
                  <div className="flex justify-between items-center">
                     <div className="h-3 w-24 bg-white/20 rounded-sm"></div>
                     <div className="w-6 h-6 rounded-md bg-purple-500/20"></div>
                  </div>
                  <div>
                    <div className="h-8 w-16 bg-purple-400/80 rounded-sm mb-2"></div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full w-[40%] bg-purple-500"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-5 border border-white/5 h-48 flex items-end gap-2 sm:gap-4 justify-between group-hover:bg-white/10 transition-colors duration-500">
                {/* Mock Chart bars */}
                {[40, 70, 45, 90, 65, 80, 55, 75, 50, 85].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="w-full bg-gradient-to-t from-purple-600/50 to-blue-400/80 rounded-t-sm hover:from-purple-500 hover:to-blue-300 transition-colors cursor-pointer" 
                  ></motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Overlay glow on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/10 transition-all duration-700 pointer-events-none"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Preview;
