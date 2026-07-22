import { eventBus, AppEvent } from "./eventBus";

/**
 * Smart UI Behavior Engine
 * 
 * Handles automatic UI behavior based on system events.
 * UI becomes "alive" instead of static.
 */

export interface UIAlert {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  data?: any;
}

export interface UIMode {
  mode: "normal" | "offline-safe" | "maintenance" | "readonly";
  reason?: string;
}

class UIEngine {
  private currentMode: UIMode["mode"] = "normal";
  private alerts: UIAlert[] = [];

  /**
   * Initialize the UI engine with event handlers
   */
  init() {
    // Handle lead events
    eventBus.on("lead:created", (data) => {
      console.log("🎯 New lead injected into UI:", data.id);
      this.showAlert({
        type: "success",
        title: "New Lead Created",
        message: `Lead ${data.name || data.id} has been added`,
        data
      });
    });

    eventBus.on("lead:updated", (data) => {
      console.log("🔄 Lead updated in UI:", data.id);
    });

    eventBus.on("lead:deleted", (data) => {
      console.log("🗑️ Lead removed from UI:", data.id);
      this.showAlert({
        type: "info",
        title: "Lead Deleted",
        message: `Lead ${data.name || data.id} has been removed`,
        data
      });
    });

    // Handle database status
    eventBus.on("db:status", (status) => {
      console.log("📊 System health changed:", status.status);
      this.handleStatusChange(status);
    });

    // Handle AI insights
    eventBus.on("ai:insight", (insight) => {
      console.log("🧠 AI insight received:", insight.type);
      this.handleAIInsight(insight);
    });

    // Handle UI mode changes
    eventBus.on("ui:mode", (mode: UIMode) => {
      console.log("🎨 UI mode changed:", mode.mode);
      this.currentMode = mode.mode;
      this.applyUIMode(mode);
    });

    // Handle connection status
    eventBus.on("connection:status", (status) => {
      console.log("🔌 Connection status:", status.status);
      if (status.status === "disconnected") {
        eventBus.emit("ui:mode", {
          mode: "offline-safe",
          reason: "Backend disconnected"
        });
      } else if (status.status === "connected") {
        eventBus.emit("ui:mode", {
          mode: "normal",
          reason: "Backend reconnected"
        });
      }
    });
  }

  /**
   * Handle database/system status changes
   */
  private handleStatusChange(status: any) {
    if (status.status === "disconnected") {
      eventBus.emit("ui:mode", {
        mode: "offline-safe",
        reason: "Database disconnected"
      });
    } else if (status.status === "error") {
      eventBus.emit("ui:mode", {
        mode: "offline-safe",
        reason: "Database error"
      });
    } else if (status.status === "connected") {
      eventBus.emit("ui:mode", {
        mode: "normal",
        reason: "Database connected"
      });
    }
  }

  /**
   * Handle AI insights with priority-based behavior
   */
  private handleAIInsight(insight: any) {
    if (insight.priority === "high") {
      eventBus.emit("ui:alert", {
        type: "warning",
        title: "⚠️ High Priority AI Insight",
        message: insight.message,
        data: insight
      });
    } else if (insight.priority === "critical") {
      eventBus.emit("ui:alert", {
        type: "error",
        title: "🚨 Critical AI Alert",
        message: insight.message,
        data: insight
      });
    } else {
      // Normal priority - log only
      console.log("AI Insight:", insight.message);
    }
  }

  /**
   * Apply UI mode changes
   */
  private applyUIMode(mode: UIMode) {
    switch (mode.mode) {
      case "offline-safe":
        // Disable actions, show safe state
        document.body.classList.add("ui-offline");
        document.body.classList.remove("ui-maintenance", "ui-readonly");
        break;
      case "maintenance":
        // Show maintenance banner
        document.body.classList.add("ui-maintenance");
        document.body.classList.remove("ui-offline", "ui-readonly");
        break;
      case "readonly":
        // Disable write operations
        document.body.classList.add("ui-readonly");
        document.body.classList.remove("ui-offline", "ui-maintenance");
        break;
      case "normal":
      default:
        // Normal operation
        document.body.classList.remove("ui-offline", "ui-maintenance", "ui-readonly");
        break;
    }
  }

  /**
   * Show UI alert
   */
  private showAlert(alert: UIAlert) {
    this.alerts.push(alert);
    eventBus.emit("ui:alert", alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.alerts = this.alerts.filter(a => a !== alert);
    }, 5000);
  }

  /**
   * Get current UI mode
   */
  getMode(): UIMode["mode"] {
    return this.currentMode;
  }

  /**
   * Check if UI is in offline-safe mode
   */
  isOfflineSafe(): boolean {
    return this.currentMode === "offline-safe";
  }

  /**
   * Check if UI is in normal mode
   */
  isNormal(): boolean {
    return this.currentMode === "normal";
  }
}

export const uiEngine = new UIEngine();
