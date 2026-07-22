"use client";

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { DEAL_STAGES } from '@/lib/constants/deal-stages';

const STAGES = [...DEAL_STAGES]; // Include all stages

interface KanbanBoardProps {
  deals: any[];
  onDragEnd: (event: any) => void;
}

export function KanbanBoard({ deals, onDragEnd }: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEndInternal = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndInternal}
    >
      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <KanbanColumn
              key={stage}
              id={stage}
              title={stage.replace(/_/g, ' ')}
              count={stageDeals.length}
              value={stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)}
            >
              <SortableContext
                items={stageDeals.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3 min-h-[150px]">
                  {stageDeals.map((deal) => (
                    <KanbanCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <div className="rotate-3 scale-105 opacity-90 transition-transform">
            <KanbanCard deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
