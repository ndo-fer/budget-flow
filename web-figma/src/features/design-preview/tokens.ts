export const T = {
  // Copilot Money dark surfaces
  bg: "#000814",
  surface: "#010d1e",
  surface2: "#0a1628",
  border: "#11263b",
  borderHover: "#1e3a5f",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#7f8ba4",
  textMuted: "#3d5270",
  textLabel: "#597caa",

  // Copilot Money brand
  iris: "#1c6cff",      // primary CTA
  teal: "#00cc4b",      // income / positive
  crimson: "#ff4433",   // expense / negative
  sunbeam: "#fece4c",   // warning / highlight
  amethyst: "#9019e6",  // accent

  // Slush category colors (for cards)
  cat: {
    food:      { fill: "#fb4903", bg: "rgba(251,73,3,0.12)",    border: "rgba(251,73,3,0.2)" },
    transport: { fill: "#4da2ff", bg: "rgba(77,162,255,0.12)",  border: "rgba(77,162,255,0.2)" },
    shopping:  { fill: "#ffd731", bg: "rgba(255,215,49,0.12)",  border: "rgba(255,215,49,0.2)" },
    bills:     { fill: "#55db9c", bg: "rgba(85,219,156,0.12)",  border: "rgba(85,219,156,0.2)" },
    entertain: { fill: "#9c8bf9", bg: "rgba(156,139,249,0.12)", border: "rgba(156,139,249,0.2)" },
    other:     { fill: "#5c4ade", bg: "rgba(92,74,222,0.12)",   border: "rgba(92,74,222,0.2)" },
  },

  // Radii (Slush)
  r: {
    card: 32,
    btn: 40,
    chip: 40,
    sm: 16,
    icon: 20,
  },

  // Inset shadow (Copilot Money signature)
  inset: "rgba(255,255,255,0.06) 0px 1px 0px 0px inset, rgba(0,0,0,0.4) 0px -1px 0px 0px inset",
  glowIris: "0 8px 32px rgba(28,108,255,0.25)",
  glowTeal: "0 4px 20px rgba(0,204,75,0.2)",
};

export const font = (size: number, weight: number, color: string, extra?: object) => ({
  fontSize: size, fontWeight: weight, color, margin: 0, fontFamily: "'Inter', sans-serif", ...extra,
});
