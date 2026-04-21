import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Layers, LayoutList, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopicSearch from '../components/practice/TopicSearch';
import DifficultySelector from '../components/practice/DifficultySelector';
import PracticeCard from '../components/practice/PracticeCard';
import StatsPanel from '../components/practice/StatsPanel';
import { practiceApi } from '../services/api';

export default function Practice() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [type, setType] = useState('Mixed');
  
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState({});
  const [stats, setStats] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  
  // Load initial stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await practiceApi.getStats();
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    setResults({});
    try {
      const res = await practiceApi.generateQuestions({ topic, difficulty, type, count: 5 });
      setQuestions(res.data.questions || []);
    } catch (e) {
      console.error("Failed to generate questions", e);
      // Fallback/UI error handling could go here
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAnswer = async (questionId, userAnswer) => {
    setSubmittingId(questionId);
    try {
      const res = await practiceApi.validateAnswer({ questionId, userAnswer });
      setResults(prev => ({
        ...prev,
        [questionId]: res.data
      }));
      // Refresh stats quietly after each answer
      fetchStats();
    } catch (e) {
      console.error("Validation failed", e);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="mission-dashboard flex">
      <div className="mission-bg-orb orb-blue" />
      <div className="mission-bg-orb orb-purple" />
      
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 overflow-y-auto z-10 relative">
        <div className="mx-auto max-w-6xl space-y-8">
            
            <header>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-blue-400/80">
                    <Target size={14} /> Interview Practice
                </div>
                <h1 className="text-3xl font-bold text-almond">Interview Practice</h1>
                <p className="mt-2 text-sm text-white/50">Practice real interview questions based on your skills.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Config & Stats */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-glass">
                        <h3 className="mb-6 text-sm font-semibold text-almond flex items-center gap-2">
                            <Layers size={16} /> Session Configuration
                        </h3>
                        
                        <div className="space-y-5">
                            <TopicSearch selectedTopic={topic} onSelect={setTopic} />
                            
                            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
                            
                            <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                                    Question Type
                                </label>
                                <div className="flex gap-2">
                                    {['MCQ', 'Theory', 'Mixed'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
                                                type === t 
                                                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' 
                                                    : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button
                                onClick={handleGenerate}
                                disabled={!topic || generating}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition disabled:opacity-50 hover:bg-blue-500"
                            >
                                {generating ? <RefreshCcw size={16} className="animate-spin" /> : <LayoutList size={16} />}
                                Generate Questions
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Panel */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                        <StatsPanel stats={stats} />
                    </div>
                </div>

                {/* Right Column: Questions Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="popLayout">
                        {questions.length === 0 && !generating && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/30"
                            >
                                <Target size={32} className="mb-4 opacity-50" />
                                <p>Select a topic to start practicing.</p>
                            </motion.div>
                        )}

                        {generating && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />
                                ))}
                            </motion.div>
                        )}

                        {!generating && questions.map((q) => (
                            <PracticeCard 
                                key={q.id} 
                                question={q} 
                                onSubmit={handleSubmitAnswer}
                                submitting={submittingId === q.id}
                                result={results[q.id]}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
