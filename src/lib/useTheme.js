import { ACCENTS } from "../store/useAppStore";

export function useTheme(theme, accent) {
  const dark = theme === "dark";
  const ac = ACCENTS[accent] || ACCENTS.blue;

  const c = {
    bg:     dark ? "#111210" : "#FAFAF8",
    bg2:    dark ? "#1A1918" : "#F3F2EF",
    bg3:    dark ? "#232220" : "#ECEAE5",
    card:   dark ? "#1E1D1B" : "#FFFFFF",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    text:   dark ? "#E8E4DC" : "#1A1614",
    text2:  dark ? "#8A857A" : "#6B6560",
    text3:  dark ? "#4A4640" : "#9E9890",
  };

  const card = { background: c.card, border: `0.5px solid ${c.border}`, borderRadius: 14, padding: "16px 18px" };

  const input = { background: c.bg2, border: `0.5px solid ${c.border}`, borderRadius: 8, padding: "8px 10px", color: c.text, fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit" };

  const btn = { background: "transparent", border: `0.5px solid ${c.border}`, borderRadius: 8, padding: "7px 14px", color: c.text, cursor: "pointer", fontSize: 12, fontFamily: "inherit" };

  const label = { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: c.text2, fontWeight: 500 };

  const tag = {
    deep:  { bg: "#E6F1FB", text: "#0C447C" },
    light: { bg: "#E1F5EE", text: "#085041" },
    read:  { bg: "#EEEDFE", text: "#3C3489" },
    any:   { bg: c.bg3,     text: c.text2 },
  };

  return { dark, c, ac, card, input, btn, label, tag };
}