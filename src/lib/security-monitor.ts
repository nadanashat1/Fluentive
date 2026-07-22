interface SecurityUser {
  id?: string;
  email?: string;
}

export function initSecurityMonitoring(user: SecurityUser) {
  // ✅ DEV MODE: Disable security monitoring to prevent 429 errors
  if (process.env.NODE_ENV === 'development') {
    console.log('[Security Monitor] DEV MODE: Security monitoring disabled');
    return;
  }

  const sendLog = async (data: any) => {
    try {
      await fetch("/api/v2/security-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          ...data
        })
      });
    } catch (err) {
      console.error("Log failed", err);
    }
  };

  // PrintScreen / key detection
  window.addEventListener("keydown", (e) => {
    if (e.key === "PrintScreen") {
      sendLog({
        action: "PRINT_SCREEN_KEY",
        key: e.key
      });
    }
  });

  // Tab switch
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      sendLog({
        action: "TAB_SWITCH"
      });
    }
  });

  // DevTools detection (basic)
  setInterval(() => {
    const devtoolsOpen =
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160;
    if (devtoolsOpen) {
      sendLog({
        action: "DEVTOOLS_OPEN"
      });
    }
  }, 3000);

  // Copy attempt
  document.addEventListener("copy", () => {
    sendLog({
      action: "COPY"
    });
  });

  // Right click
  document.addEventListener("contextmenu", () => {
    sendLog({
      action: "RIGHT_CLICK"
    });
  });
}
