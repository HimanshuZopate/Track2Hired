export default function DifficultySelector({ selected, onSelect }) {
  const difficulties = [
    { id: 'Easy', color: 'emerald' },
    { id: 'Medium', color: 'amber' },
    { id: 'Hard', color: 'red' },
  ];

  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
        Difficulty
      </label>
      <div className="flex rounded-xl border border-white/10 bg-[#14151a] p-1">
        {difficulties.map((diff) => {
          const isActive = selected === diff.id;
          
          let colorClasses = '';
          if (isActive) {
            if (diff.color === 'emerald') colorClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
            if (diff.color === 'amber') colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
            if (diff.color === 'red') colorClasses = 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
          } else {
            colorClasses = 'text-white/40 hover:text-white/70 border-transparent';
          }

          return (
            <button
              key={diff.id}
              onClick={() => onSelect(diff.id)}
              className={`relative flex-1 rounded-lg border py-2 text-sm font-medium transition-all duration-300 ${colorClasses}`}
            >
              {diff.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
