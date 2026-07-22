"use client";



import { useState, useEffect } from "react";

import Link from "next/link";

import { Plus, Users, BarChart3, Settings, FileText, MessageSquare, Zap, X } from "lucide-react";



interface QuickActionsProps {

  onClose?: () => void;

}



export function QuickActions({ onClose }: QuickActionsProps) {

  const actions = [

    {

      icon: Plus,

      label: "Add New Lead",

      description: "Create a new lead entry quickly",

      href: "/leads/new",

      color: "bg-brand/10 text-brand"

    },

    {

      icon: Users,

      label: "View All Leads",

      description: "Browse and manage your leads",

      href: "/leads",

      color: "bg-blue-500/10 text-blue-500"

    },

    {

      icon: BarChart3,

      label: "Dashboard",

      description: "See your analytics and stats",

      href: "/dashboard",

      color: "bg-emerald-500/10 text-emerald-500"

    },

    {

      icon: Zap,

      label: "AI Insights",

      description: "Get AI-powered lead analysis",

      href: "/ai",

      color: "bg-purple-500/10 text-purple-500"

    },

    {

      icon: MessageSquare,

      label: "Activity Logs",

      description: "See what's been happening",

      href: "/activity-logs",

      color: "bg-amber-500/10 text-amber-500"

    },

    {

      icon: FileText,

      label: "Reports",

      description: "Generate and view your reports",

      href: "#",

      color: "bg-cyan-500/10 text-cyan-500"

    },

    {

      icon: Settings,

      label: "Settings",

      description: "Manage your account settings",

      href: "/settings",

      color: "bg-gray-500/10 text-gray-500"

    }

  ];



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-md rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6 shadow-xl">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Quick Actions</h2>

          {onClose && (

            <button

              onClick={onClose}

              title="Close"

              className="text-[#8b8f9b] dark:text-gray-400 hover:text-[#2f3440] dark:hover:text-gray-200 transition-colors"

            >

              <X size={20} />

            </button>

          )}

        </div>

        <div className="space-y-2">

          {actions.map((action) => {

            const Icon = action.icon;

            return (

              <Link

                key={action.label}

                href={action.href}

                onClick={onClose}

                className="flex items-center gap-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] p-3 hover:bg-[#f8f9fa] dark:hover:bg-[#0f0820] transition-colors group"

              >

                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>

                  <Icon size={20} />

                </div>

                <div className="flex-1">

                  <p className="text-sm font-semibold text-[#2f3440] dark:text-gray-200">{action.label}</p>

                  <p className="text-xs text-[#8b8f9b] dark:text-gray-500">{action.description}</p>

                </div>

              </Link>

            );

          })}

        </div>

        <div className="mt-4 pt-4 border-t border-[#f0f1f3] dark:border-[#2a2f3a]">

          <p className="text-[11px] text-[#8b8f9b] dark:text-gray-500 text-center">

            Press <kbd className="px-1.5 py-0.5 rounded bg-[#f0f1f3] dark:bg-[#2a2f3a] text-[10px]">K</kbd> to toggle quick actions

          </p>

        </div>

      </div>

    </div>

  );

}

