import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, XCircle, ChevronRight, Hash, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function PracticeCard({ question, onSubmit, submitting, result }) {
  const [mcqSelection, setMcqSelection] = useState('');
  const [theoryAnswer, setTheoryAnswer] = useState('');

  const isMcq = question.type === 'MCQ';
  const Icon = isMcq ? Hash : BookOpen;
  
  const hasResult = !!result;

  const handleSubmit = () => {
    const ans = isMcq ? mcqSelection : theoryAnswer;
    if (!ans) return;
    onSubmit(question.id, ans);
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10"
        style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(24,24,28,0.6))',
            boxShadow: hasResult 
                ? result.isCorrect 
                    ? '0 0 0 1px rgba(16,185,129,0.3), 0 10px 40px rgba(16,185,129,0.1)' 
                    : '0 0 0 1px rgba(239,68,68,0.3), 0 10px 40px rgba(239,68,68,0.1)'
                : '0 4px 20px rgba(0,0,0,0.3)'
        }}
    >
      <div className="border-b border-white/[0.06] px-6 py-5">
        <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-300 border border-blue-500/20">
                <Icon size={12} />
                {question.type}
            </span>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border ${
               question.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 
               question.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 
               'bg-red-500/10 text-red-300 border-red-500/20'
            }`}>
               {question.difficulty}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white/70 border border-white/10">
               {question.topicName}
            </span>
            {question.tags && question.tags.length > 0 && question.tags.map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                    {tag}
                </span>
            ))}
        </div>
        <h3 className="text-lg font-medium leading-relaxed text-almond">
            {question.question}
        </h3>
      </div>

      {/* Answer Area */}
      <div className="p-6">
        {!hasResult ? (
          <div>
            {isMcq ? (
                <div className="grid grid-cols-1 gap-3">
                    {question.options?.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => setMcqSelection(opt)}
                            className={`flex min-h-[3rem] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                                mcqSelection === opt
                                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                        >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                mcqSelection === opt ? 'border-blue-400' : 'border-white/30'
                            }`}>
                                {mcqSelection === opt && <div className="h-2 w-2 rounded-full bg-blue-400" />}
                            </div>
                            <span>
                                <span className="font-semibold text-blue-400/80 mr-2">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="relative">
                    <textarea
                        rows="5"
                        value={theoryAnswer}
                        onChange={(e) => setTheoryAnswer(e.target.value)}
                        placeholder="Type your detailed answer here... Keywords matter!"
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-almond placeholder-white/20 outline-none transition focus:border-purple-500/50 focus:bg-white/[0.04]"
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-white/40">
                        <span>Characters: {theoryAnswer.length} (minimum 10)</span>
                    </div>
                </div>
            )}
            
            <div className="mt-6 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting || (isMcq ? !mcqSelection : theoryAnswer.length < 10)}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition disabled:opacity-50 disabled:shadow-none"
                >
                    {submitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>Submit Answer <Send size={14} /></>
                    )}
                </motion.button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
            >
                <div className={`flex items-start gap-4 rounded-xl border p-4 ${
                    result.isCorrect ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10'
                }`}>
                    <div className="mt-0.5 shrink-0">
                        {result.isCorrect ? <CheckCircle2 className="text-emerald-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${result.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                            {result.isCorrect ? 'Correct Answer!' : 'Incorrect'}
                        </h4>
                        {!isMcq && (
                            <p className="mt-1 text-xs text-white/60">
                                Match Score: <span className="font-semibold text-white/80">{result.score}%</span> 
                                ({result.matchedKeywords}/{result.totalKeywords} keywords found)
                            </p>
                        )}
                        
                        <div className="mt-4 space-y-3">
                            <div>
                                <span className="text-xs uppercase text-white/40 tracking-wider">Correct Answer</span>
                                <p className="mt-1 rounded-lg bg-green-500/10 p-3 text-sm text-green-200 border border-green-500/20">
                                    {result.correctAnswer}
                                </p>
                            </div>
                            
                            {result.explanation && (
                                <div>
                                    <span className="text-xs uppercase text-white/40 tracking-wider">Explanation</span>
                                    <p className="mt-1 p-1 text-sm text-white/70">
                                        {result.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
