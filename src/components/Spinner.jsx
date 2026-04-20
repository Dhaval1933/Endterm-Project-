export default function Spinner({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2px solid var(--border)",
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.65s linear infinite",
      flexShrink: 0,
    }} />
  );
}

export function FullPageSpinner() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={36} />
    </div>
  );
}
