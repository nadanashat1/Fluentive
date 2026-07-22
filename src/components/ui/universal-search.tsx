"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight, Briefcase, User, Users, Folder } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function UniversalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useState<HTMLInputElement | null>(null);

  // Debounce the query to prevent API spam while typing
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Global Shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        const input = document.getElementById("global-search-input");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data || [];
    },
    enabled: debouncedQuery.length >= 2,
  });


  const getIcon = (type: string) => {
    switch(type) {
      case 'LEAD': return <User size={16} className="text-blue-500" />;
      case 'DEAL': return <Briefcase size={16} className="text-brand" />;
      case 'CANDIDATE': return <Users size={16} className="text-amber-500" />;
      case 'EMPLOYEE': return <Folder size={16} className="text-emerald-500" />;
      default: return <Search size={16} />;
    }
  };

  return (
    <div className="relative z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-gray-400" size={16} />
        <input
          id="global-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search leads, deals, candidates (Ctrl+K)..."
          className="w-[300px] h-9 pl-9 pr-4 rounded-full bg-gray-100 dark:bg-[#1a0b2e] border-none text-[13px] font-medium focus:ring-2 focus:ring-brand/20 transition-all outline-none"
        />
        {/* Keyboard Shortcut Hint */}
        <div className="absolute right-3 px-1.5 py-0.5 rounded bg-white dark:bg-[#0b0614] border border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 font-mono shadow-sm">
          ⌘K
        </div>
      </div>

      <AnimatePresence>
        {isOpen && query.length > 0 && (
          <>
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
              className="absolute top-12 left-0 w-[400px] bg-white dark:bg-[#150a24] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-brand">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : results && results.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Top Results</div>
                  {results.map((r: any) => (
                    <Link 
                      href={r.url} 
                      key={r.id} 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a0b2e] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 dark:bg-[#0b0614] rounded-lg group-hover:bg-white dark:group-hover:bg-gray-800 transition">
                          {getIcon(r.type)}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white">{r.title}</p>
                          <p className="text-[11px] text-gray-500">{r.type} • {r.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-brand transition -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[13px] text-gray-500">
                  No enterprise results found for "{query}".
                </div>
              )}
              
              {/* AI Suggestion Layer */}
              <div className="bg-gradient-to-r from-brand/10 to-purple-600/10 p-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-bold text-brand flex items-center gap-1">
                  ✨ Ask AI to analyze these results...
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
