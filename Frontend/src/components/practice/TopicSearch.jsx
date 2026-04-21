import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { practiceApi } from '../../services/api';

export default function TopicSearch({ selectedTopic, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (selectedTopic) {
      setQuery(selectedTopic);
    }
  }, [selectedTopic]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() && query !== selectedTopic) {
        setLoading(true);
        try {
          const res = await practiceApi.searchTopics(query);
          setResults(res.data.topics || []);
          setIsOpen(true);
        } catch (error) {
          console.error("Failed to search topics", error);
        } finally {
          setLoading(false);
        }
      } else if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedTopic]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
        Select Topic
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') {
                onSelect('');
            }
          }}
          placeholder="e.g. React, Node.js, MongoDB..."
          className="w-full rounded-xl border border-white/10 bg-[#14151a] py-3 pl-10 pr-10 text-sm text-almond placeholder-white/20 outline-none transition focus:border-blue-500/50 focus:bg-white/[0.04]"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#18181c] shadow-2xl backdrop-blur-xl">
          <ul className="max-h-60 overflow-y-auto p-1">
            {results.map((topic) => (
              <li
                key={topic._id}
                onClick={() => {
                  setQuery(topic.name);
                  onSelect(topic.name);
                  setIsOpen(false);
                }}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm text-white/80 transition hover:bg-blue-500/10 hover:text-blue-300"
              >
                <div className="flex items-center justify-between">
                    <span className="font-medium">{topic.name}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40 object-right">
                        {topic.category}
                    </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && query && results.length === 0 && !loading && (
         <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#18181c] p-4 text-center text-sm text-white/40 shadow-2xl">
            No topics found matching "{query}"
        </div>
      )}
    </div>
  );
}
