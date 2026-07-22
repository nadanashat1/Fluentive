"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MoreVertical, Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  value: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, value, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[320px] h-full rounded-xl transition-colors shrink-0 ${
        isOver ? 'bg-brand/5 dark:bg-brand/10 ring-2 ring-brand/20' : 'bg-[#eff1f6]/50 dark:bg-[#1a0b2e]/50'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 flex flex-col gap-1 sticky top-0 bg-inherit rounded-t-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-[#2f3440] dark:text-gray-100 uppercase tracking-wider">
              {title}
            </h3>
            <span className="flex items-center justify-center h-5 px-1.5 min-w-[20px] rounded-full bg-white dark:bg-brand/20 border border-[#dbc4cf] dark:border-brand/30 text-[10px] font-bold text-brand">
              {count}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-500">
              <Plus size={14} />
            </button>
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-500">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-semibold text-[#8b8f9b] dark:text-gray-500 uppercase">
            Forecast
          </span>
          <span className="text-[12px] font-bold text-[#444a57] dark:text-gray-300">
            {formattedValue}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
