"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, DollarSign, Building2, User, MoreHorizontal, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface KanbanCardProps {
  deal: any;
  isOverlay?: boolean;
}

export function KanbanCard({ deal, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal?.id,
    disabled: isOverlay
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  if (!deal) return null;

  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(deal.value || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-white dark:bg-[#0f0820] border border-[#ececef] dark:border-[#2a2f3a] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-brand/30 dark:hover:border-brand/40 transition-all cursor-grab active:cursor-grabbing ${
        isOverlay ? 'shadow-xl ring-2 ring-brand/50 rotate-2' : ''
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <Link 
          href={`/sales-pipeline/${deal.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[13px] font-bold text-[#202530] dark:text-gray-100 line-clamp-1 group-hover:text-brand transition-colors hover:underline"
        >
          {deal.title}
        </Link>
        <Link 
          href={`/sales-pipeline/${deal.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 text-gray-400 hover:text-brand transition-colors"
          title="View Deal Details"
        >
          <MoreHorizontal size={14} />
        </Link>
      </div>

      {/* Company & Owner */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-[11px] text-[#646b7a] dark:text-gray-400">
          <Building2 size={12} className="shrink-0 text-brand/60" />
          <span className="truncate">{deal.lead?.company || 'No Company'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#646b7a] dark:text-gray-400">
          <User size={12} className="shrink-0 text-emerald-500/60" />
          <span className="truncate">{deal.lead?.name || 'Unknown Lead'}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f5f6f8] dark:border-[#2a2f3a]">
        <div className="flex items-center gap-1 font-bold text-[13px] text-brand">
          <DollarSign size={14} className="text-brand/70" />
          {formattedValue}
        </div>
        
        {deal.probability !== undefined && (
          <div className="flex items-center gap-1.5">
             <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    deal.probability > 70 ? 'bg-emerald-500' : deal.probability > 30 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} 
                  style={{ width: `${deal.probability}%` }}
                />
             </div>
             <span className="text-[10px] font-bold text-gray-400">{deal.probability}%</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
          <Calendar size={12} />
          {deal.expectedCloseDate ? (
            <span>Close: {new Date(deal.expectedCloseDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          ) : (
            <span>No close date</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400" title="Last updated">
          <History size={12} />
          {formatDistanceToNow(new Date(deal.updatedAt || Date.now()), { addSuffix: true })}
        </div>
      </div>

      {/* Priority Indicator */}
      {deal.probability > 80 && (
        <div className="absolute top-0 right-0 h-8 w-8 overflow-hidden rounded-tr-xl">
           <div className="absolute top-0 right-0 h-[2px] w-[30px] bg-emerald-500 rotate-45 translate-x-[8px] translate-y-[4px] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      )}
    </div>
  );
}
