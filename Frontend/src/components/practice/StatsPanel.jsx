import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

export default function StatsPanel({ stats }) {
    if (!stats) return null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center"
                >
                    <Target className="mx-auto mb-2 text-blue-400" size={20} />
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Total Attempts</p>
                    <p className="text-2xl font-bold text-almond">{stats.totalAttempts}</p>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center"
                >
                    <TrendingUp className="mx-auto mb-2 text-emerald-400" size={20} />
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-emerald-300">{stats.accuracy}%</p>
                </motion.div>
            </div>

            {/* Topics Breakdown */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
                <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <h4 className="text-xs font-medium uppercase tracking-widest text-white/50">Topic Analysis</h4>
                </div>
                
                {stats.topics && stats.topics.length > 0 ? (
                    <div className="space-y-3">
                        {stats.topics.map(t => (
                            <div key={t.topic} className="flex items-center justify-between">
                                <span className="text-sm text-white/70">{t.topic}</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${
                                                t.accuracy >= 70 ? 'bg-emerald-400' : t.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                            }`} 
                                            style={{ width: `${t.accuracy}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-xs font-medium text-white/80">{t.accuracy}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-xs text-white/30 py-2">Not enough data. Practice more!</p>
                )}
            </motion.div>

            {/* AI Suggestions mock / DB Suggestions */}
            {stats.suggestions && stats.suggestions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-5"
                >
                    <div className="mb-3 flex items-center gap-2">
                        <Lightbulb size={14} className="text-purple-400" />
                        <h4 className="text-xs font-medium uppercase tracking-widest text-purple-300/80">Improvement Plan</h4>
                    </div>
                    <ul className="list-inside list-disc space-y-1 text-sm text-purple-100/70">
                        {stats.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}
