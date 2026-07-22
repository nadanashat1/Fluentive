"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class SafeChart extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 p-6 text-center dark:bg-[#0f0820]">
          <AlertCircle className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {this.props.fallbackMessage ?? "Unable to render chart"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
