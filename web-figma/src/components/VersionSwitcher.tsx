import { useState, useEffect } from "react";

/**
 * Floating version switcher — always visible when logged in.
 * V1 = current light app, V2 = dark hybrid design preview.
 */
export default function VersionSwitcher() {
  const [isV2, setIsV2] = useState(() => window.location.pathname === "/design-preview");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const onPop = () => setIsV2(window.location.pathname === "/design-preview");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const switchVersion = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      const next = isV2 ? "/home" : "/design-preview";
      window.history.pushState({}, "", next);
      window.dispatchEvent(new PopStateEvent("popstate"));
      setIsV2(!isV2);
      setAnimating(false);
    }, 150);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 16,
        zIndex: 9999,
      }}
    >
      <button
        onClick={switchVersion}
        title={isV2 ? "Switch to V1 (Current)" : "Switch to V2 (Dark Hybrid)"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 40,
          border: "none",
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          transition: "all 0.2s ease",
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.9)" : "scale(1)",
          // V1 = dark pill, V2 = light pill so it contrasts with its bg
          background: isV2
            ? "rgba(255,255,255,0.95)"
            : "rgba(0,8,20,0.92)",
          color: isV2 ? "#000814" : "#ffffff",
          boxShadow: isV2
            ? "0 4px 20px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.5) inset"
            : "0 4px 20px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Dot indicator */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isV2 ? "#000814" : "#1c6cff",
            display: "inline-block",
            flexShrink: 0,
            boxShadow: isV2 ? "none" : "0 0 6px #1c6cff",
          }}
        />
        <span>
          {isV2 ? "← V1 Live" : "V2 Preview →"}
        </span>
      </button>
    </div>
  );
}
