import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../context/GroupContext";
import Avatar from "./Avatar";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { groups } = useGroups();
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{ display:"none", position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:199 }}
          className="hide-mobile"
        />
      )}

      <aside
        className={`sidebar${open ? " open" : ""}`}
        style={{
          width:252, flexShrink:0,
          background:"var(--surface)", borderRight:"1px solid var(--border)",
          display:"flex", flexDirection:"column", padding:"20px 12px",
          gap:2, overflowY:"auto", position:"sticky", top:0, height:"100vh",
        }}
      >
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 8px 20px" }}>
          <div style={{
            width:30, height:30, background:"var(--accent)", borderRadius:9,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:"#fff", fontWeight:800,
          }}>₹</div>
          <span style={{ fontSize:17, fontWeight:800, letterSpacing:"-0.6px" }}>
            Split<span style={{ color:"var(--accent)" }}>Smart</span>
          </span>
        </div>

        <NavLabel>Menu</NavLabel>
        <NavItem to="/dashboard"   active={pathname==="/dashboard"}   icon="⊞" label="Dashboard"    onClick={onClose} />
        <NavItem to="/add-expense" active={pathname==="/add-expense"} icon="+" label="Add Expense"   onClick={onClose} />

        <NavLabel style={{ marginTop:8 }}>Your Groups</NavLabel>
        {groups.length === 0
          ? <p style={{ fontSize:12, color:"var(--text-dim)", padding:"2px 10px" }}>No groups yet</p>
          : groups.slice(0,12).map(g => (
              <NavItem
                key={g.id}
                to={`/group/${g.id}`}
                active={pathname===`/group/${g.id}`}
                onClick={onClose}
                icon={
                  <div style={{
                    width:18, height:18, borderRadius:5,
                    background:"var(--surface4)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:9, fontWeight:700, color:"var(--text-muted)", flexShrink:0,
                  }}>{g.name[0]?.toUpperCase()}</div>
                }
                label={g.name}
              />
            ))
        }

        {/* User */}
        <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px" }}>
            <Avatar name={user?.displayName || "U"} size={30} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.displayName || "User"}
              </div>
              <div style={{ fontSize:11, color:"var(--text-dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display:"flex", alignItems:"center", gap:8, width:"100%",
              padding:"8px 10px", borderRadius:9, border:"none",
              background:"none", color:"var(--red)", cursor:"pointer",
              fontSize:13, fontFamily:"var(--font)", transition:"background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--red-dim)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            ↩ Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize:10, fontWeight:600, letterSpacing:"1.2px",
      textTransform:"uppercase", color:"var(--text-dim)",
      padding:"10px 10px 4px", ...style,
    }}>{children}</div>
  );
}

function NavItem({ to, active, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:9, padding:"8px 10px",
        borderRadius:9, textDecoration:"none", fontSize:13.5,
        transition:"background 0.12s, color 0.12s",
        background: active ? "var(--accent-dim)" : "transparent",
        color:      active ? "var(--accent)"    : "var(--text-muted)",
        fontWeight: active ? 500 : 400,
        overflow:"hidden",
      }}
    >
      {typeof icon === "string"
        ? <span style={{ fontSize:13, flexShrink:0 }}>{icon}</span>
        : icon
      }
      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
    </Link>
  );
}
