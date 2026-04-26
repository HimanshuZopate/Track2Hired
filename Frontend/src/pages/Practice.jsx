import { useState, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Target, Layers, LayoutList, RefreshCcw, RotateCcw, TrendingUp } from 'lucide-react';
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
  const [sessionQuestionIds, setSessionQuestionIds] = useState([]);
  const [sessionMessage, setSessionMessage] = useState('');
  const [sessionFinished, setSessionFinished] = useState(false);
  
  // Load initial stats
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setQuestions([]);
    setResults({});
    setSessionQuestionIds([]);
    setSessionMessage('');
    setSessionFinished(false);
  }, [topic]);

  const answeredCount = useMemo(() => Object.keys(results).length, [results]);
  const correctCount = useMemo(
    () => Object.values(results).filter((entry) => entry.isCorrect).length,
    [results],
  );
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  const fetchStats = async () => {
    try {
      const res = await practiceApi.getStats();
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const handleGenerate = async ({ resetSession = false } = {}) => {
    if (!topic) return;
    setGenerating(true);
    setSessionMessage('');
    try {
      const excludeQuestionIds = resetSession ? [] : sessionQuestionIds;
      const res = await practiceApi.generateQuestions({ topic, difficulty, type, count: 5, excludeQuestionIds });
      const nextQuestions = res.data.questions || [];

      if (nextQuestions.length > 0) {
        setQuestions(nextQuestions);
        setResults({});
        setSessionFinished(false);
        setSessionMessage(
          res.data.message || `Loaded ${nextQuestions.length} curated ${difficulty.toLowerCase()} questions for ${topic}.`,
        );
        setSessionQuestionIds((prev) => {
          const seed = resetSession ? [] : prev;
          return Array.from(new Set([...seed, ...nextQuestions.map((question) => question.id)]));
        });
      } else {
        setSessionFinished(true);
        setSessionMessage(
          res.data.message || `You have completed all currently available ${topic} questions for this session.`,
        );
      }
    } catch (e) {
      console.error("Failed to generate questions", e?.serverMessage || e?.message || e);
      setSessionMessage(e?.serverMessage || 'Unable to load questions right now. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleResetSession = () => {
    setQuestions([]);
    setResults({});
    setSessionQuestionIds([]);
    setSessionFinished(false);
    setSessionMessage('Session reset. Generate a fresh set whenever you are ready.');
  };

  const handleSubmitAnswer = async (questionId, userAnswer) => {
    setSubmittingId(questionId);
    try {
      const res = await practiceApi.attemptQuestion({ questionId, userAnswer });
      setResults(prev => {
        const nextResults = {
          ...prev,
          [questionId]: res.data
        };

        const nextAnsweredCount = Object.keys(nextResults).length;
        if (questions.length > 0 && nextAnsweredCount === questions.length) {
          setSessionMessage(`Batch complete. You answered ${Object.values(nextResults).filter((entry) => entry.isCorrect).length}/${questions.length} correctly. Load another set to continue.`);
        }

        return nextResults;
      });
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
                <div className="mt-4 flex flex-wrap gap-2">
                    {topic && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                            Topic: <span className="font-semibold text-almond">{topic}</span>
                        </span>
                    )}
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                        Difficulty: {difficulty}
                    </span>
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                        Type: {type}
                    </span>
                </div>
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
                                onClick={() => handleGenerate({ resetSession: false })}
                                disabled={!topic || generating}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition disabled:opacity-50 hover:bg-blue-500"
                            >
                                {generating ? <RefreshCcw size={16} className="animate-spin" /> : <LayoutList size={16} />}
                                {questions.length ? 'Load Fresh Questions' : 'Generate Questions'}
                            </button>

                            <button
                                onClick={handleResetSession}
                                disabled={generating && !sessionQuestionIds.length}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                            >
                                <RotateCcw size={16} /> Reset Session
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
                    {(topic || questions.length > 0) && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">Session Progress</p>
                                    <h3 className="mt-1 text-lg font-semibold text-almond">
                                        {answeredCount}/{questions.length || 0} answered • {correctCount} correct
                                    </h3>
                                </div>
                                <div className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
                                    {sessionQuestionIds.length} unique questions seen this session
                                </div>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <div className="mt-3 flex items-start gap-2 text-sm text-white/55">
                                <TrendingUp size={15} className="mt-0.5 text-blue-300" />
                                <p>
                                    {sessionMessage || 'Answer correctly to improve confidence in the linked skill and raise your readiness score.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {questions.length === 0 && !generating && (
                            <Motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/30"
                            >
                                <Target size={32} className="mb-4 opacity-50" />
                                <p>{sessionFinished ? sessionMessage : 'Select a topic to start practicing.'}</p>
                            </Motion.div>
                        )}

                        {generating && (
                            <Motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />
                                ))}
                            </Motion.div>
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
