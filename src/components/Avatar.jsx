import { avatarColor, initials } from "../utils";

export default function Avatar({ name = "", size = 32, style = {} }) {
  const { bg, fg } = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: "50%", background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.max(9, Math.floor(size * 0.34)),
      fontWeight: 700, letterSpacing: "-0.3px", userSelect: "none", flexShrink: 0,
      ...style,
    }}>
      {initials(name)}
    </div>
  );
}
