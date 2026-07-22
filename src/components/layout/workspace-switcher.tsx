"use client";

import { useState } from "react";
import { ChevronDown, LayoutGrid, Check, Plus, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ENTERPRISE WORKSPACE SWITCHER
 * Allows users to toggle between different organization departments or business units.
 */

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState({ id: '1', name: 'Global Workspace', icon: '🌐' });
  
  const workspaces = [
    { id: '1', name: 'Global Workspace', icon: '🌐' },
    { id: '2', name: 'Marketing Dept', icon: '📣' },
    { id: '3', name: 'Sales Operations', icon: '📈' },
    { id: '4', name: 'Engineering', icon: '🛠️' },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
      >
        <div className="h-7 w-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs font-bold">
          {currentWorkspace.icon}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Workspace</p>
          <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{currentWorkspace.name}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-12 left-0 w-64 bg-white dark:bg-[#150a24] border border-gray-100 dark:border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Workspace</div>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setCurrentWorkspace(w);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition ${
                      currentWorkspace.id === w.id ? 'bg-brand/5 text-brand' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        {w.icon}
                      </div>
                      <span className="text-sm font-bold">{w.name}</span>
                    </div>
                    {currentWorkspace.id === w.id && <Check size={16} />}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
                <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition">
                  <div className="h-8 w-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <span className="text-sm font-bold">New Workspace</span>
                </button>
                <button className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <Building2 size={16} />
                  </div>
                  <span className="text-sm font-bold">Org Settings</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
