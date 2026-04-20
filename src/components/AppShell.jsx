import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Mobile header */}
        <div style={{
          padding:"12px 16px", borderBottom:"1px solid var(--border)",
          background:"var(--bg)", display:"flex", alignItems:"center", gap:12,
        }}
          className="hide-mobile"
          id="mobile-header"
        >
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background:"none", border:"none", color:"var(--text)", cursor:"pointer", fontSize:20, padding:2 }}
          >☰</button>
          <span style={{ fontSize:16, fontWeight:700 }}>
            Split<span style={{ color:"var(--accent)" }}>Smart</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
