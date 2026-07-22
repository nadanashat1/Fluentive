"use client";

import { useEffect, useState } from 'react';
import { Clock, Play, Pause, Power, Timer, Zap, ZapOff } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';

export function TimeTrackingWidget() {
  const { user } = useUser();
  const [isWorking, setIsWorking] = useState(false);
  const [session, setSession] = useState<{
    totalSeconds: number;
    isActive: boolean;
    isIdle: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Initialize working state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('work_mode_enabled');
      setIsWorking(saved === 'true');
    }
  }, []);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/time-tracking/my-time');
      if (data && data.data && data.data.length > 0) {
        const current = data.data[0];
        setSession({
          totalSeconds: current.totalSeconds,
          isActive: current.isActive,
          isIdle: current.isIdle
        });
        setElapsed(current.totalSeconds);
        
        // Sync working state with backend if it's active
        if (current.isActive && !isWorking) {
           setIsWorking(true);
           localStorage.setItem('work_mode_enabled', 'true');
        }
      }
    } catch (e) {
      console.error('Failed to fetch time tracking status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 60000); // 60s polling
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user, isWorking]);

  // Local timer
  useEffect(() => {
    if (isWorking && !session?.isIdle) {
      const timer = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isWorking, session?.isIdle]);

  const toggleWorkMode = async () => {
    const newState = !isWorking;
    setIsWorking(newState);
    localStorage.setItem('work_mode_enabled', String(newState));
    
    if (!newState) {
      // Manual end session
      try {
        await apiFetch('/api/time-tracking/end-session', { method: 'POST' });
        setSession(prev => prev ? { ...prev, isActive: false } : null);
      } catch (e) {}
    } else {
      // Force a heartbeat to start session immediately
      try {
        await apiFetch("/api/time-tracking/heartbeat", {
          method: "POST",
          body: JSON.stringify({ isIdle: false })
        });
        fetchStatus();
      } catch (e) {}
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !user) return null;

  return (
    <div className="flex items-center gap-3 rounded-full bg-white dark:bg-[#1a0b2e] border border-[#ececef] dark:border-[#2a2f3a] px-3 py-1.5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2 pr-1 border-r border-[#ececef] dark:border-[#2a2f3a]">
        <div className="relative flex h-2 w-2">
          {isWorking && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${session?.isIdle ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${!isWorking ? 'bg-gray-300 dark:bg-gray-600' : (session?.isIdle ? 'bg-yellow-500' : 'bg-emerald-500')}`}></span>
        </div>
        <span className={`text-[12px] font-bold font-mono ${isWorking ? 'text-[#2f3440] dark:text-gray-200' : 'text-gray-400'}`}>
          {formatTime(elapsed)}
        </span>
      </div>

      <button 
        onClick={toggleWorkMode}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
          isWorking 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100' 
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
        }`}
      >
        {isWorking ? (
          <>
            <Zap size={10} className="fill-current" />
            <span>WORKING</span>
          </>
        ) : (
          <>
            <ZapOff size={10} />
            <span>OFF DUTY</span>
          </>
        )}
      </button>

      <div className="h-4 w-px bg-[#ececef] dark:bg-[#2a2f3a]"></div>

      <AnimatePresence>
        {isWorking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
             <span className="text-[10px] text-gray-400 font-medium">
               {session?.isIdle ? 'Idle Detection On' : 'Tracking Activity'}
             </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
