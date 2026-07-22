// Centralized motion system for sidebar
// This ensures consistent animation behavior and performance
export const sidebarMotion = {
  // Base transitions
  item: "transition-all duration-200 ease-out",
  hover: "hover:translate-x-[2px] hover:scale-[1.01]",
  active: "duration-300 ease-out",
  
  // Icon animations - enhanced with Framer Motion variants
  icon: {
    // Base hover animation (applied to all icons)
    hover: {
      scale: 1.08,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
    // Glow effect on hover
    glow: {
      filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))",
      transition: { duration: 0.2 },
    },
  },
  
  // Icon-specific animation variants
  iconVariants: {
    // Default - subtle bounce
    default: {
      hover: {
        scale: 1.08,
        y: -2,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 25,
        },
      },
    },
    // Globe/earth - continuous rotation on hover
    globe: {
      hover: {
        rotate: 360,
        scale: 1.08,
        y: -2,
        transition: {
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear" as const,
          },
          scale: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
          },
          y: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
          },
        },
      },
    },
    // Activity/analytics - pulse animation
    activity: {
      hover: {
        scale: [1, 1.1, 1],
        y: -2,
        transition: {
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
          y: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
          },
        },
      },
    },
    // Settings - gentle partial spin
    settings: {
      hover: {
        rotate: 15,
        scale: 1.08,
        y: -2,
        transition: {
          type: "spring" as const,
          stiffness: 300,
          damping: 30,
        },
      },
    },
    // Users - floating bounce
    users: {
      hover: {
        y: [-2, -6, -2],
        scale: 1.08,
        transition: {
          y: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
          scale: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
          },
        },
      },
    },
    // Book - open/close animation on click (3D flip from spine)
    book: {
      hover: {
        scale: 1.08,
        y: -2,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 25,
        },
      },
      tap: {
        rotateY: [0, -180, 0],
        transition: {
          rotateY: {
            duration: 0.6,
            ease: "easeInOut" as const,
          },
        },
      },
    },
  },
  
  // Fallback CSS for reduced motion
  iconFallback: "transition-all duration-200 ease-out group-hover:-translate-y-[2px] group-hover:scale-110 active:scale-95",
  iconLabel: "transition-all duration-200 group-hover:translate-x-[1px]",
  
  // Button states
  button: "transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]",
  
  // Performance hints
  willChange: "will-change: transform",
  
  // Motion budget rules
  // 1 micro motion → hover (scale, translate)
  // 1 medium motion → route change (opacity, fade)
  // 1 global motion → ambient system (blur, pulse)
};

// Icon type classification for animation selection
export const getIconAnimationType = (label: string): keyof typeof sidebarMotion.iconVariants => {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('globe') || lowerLabel.includes('world') || lowerLabel.includes('earth')) {
    return 'globe';
  }
  if (lowerLabel.includes('activity') || lowerLabel.includes('analytics') || lowerLabel.includes('chart')) {
    return 'activity';
  }
  if (lowerLabel.includes('settings') || lowerLabel.includes('config') || lowerLabel.includes('preference')) {
    return 'settings';
  }
  if (lowerLabel.includes('users') || lowerLabel.includes('people') || lowerLabel.includes('team') || lowerLabel.includes('hr')) {
    return 'users';
  }
  if (lowerLabel.includes('courses') || lowerLabel.includes('course') || lowerLabel.includes('book')) {
    return 'book';
  }
  
  return 'default';
};
