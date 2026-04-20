import { useState, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../context/GroupContext";
import { fmt, avatarColor, initials } from "../utils";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";

const CreateGroupModal = lazy(() => import("../components/CreateGroupModal"));

export default function DashboardPage() {
  const { user } = useAuth();
  const { groups } = useGroups();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search],
  );

  const totalSpent = useMemo(
    () => groups.reduce((s,g) => s + (g.totalExpenses||0), 0),
    [groups],
  );

  return (
    <AppShell>
      {/* Top bar */}
      <header style={{
        display:"flex", alignItems:"center", gap:16, padding:"18px 36px",
        borderBottom:"1px solid var(--border)", position:"sticky", top:0,
        background:"var(--bg)", zIndex:10, flexWrap:"wrap",
      }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.4px" }}>
            Hey, {user?.displayName?.split(" ")[0] || "there"} 👋
          </h1>
          <p style={{ fontSize:12, color:"var(--text-dim)", marginTop:2 }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-dim)", fontSize:14, pointerEvents:"none" }}>⌕</span>
            <input
              className="ss-input"
              style={{ paddingLeft:30, width:190 }}
              placeholder="Search groups…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding:"8px 16px", background:"var(--accent)", color:"#fff",
              border:"none", borderRadius:10, fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:"var(--font)", whiteSpace:"nowrap",
            }}
          >+ New group</button>
        </div>
      </header>

      <main style={{ padding:"28px 36px", maxWidth:960, width:"100%" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:32 }} className="fade-up">
          <StatCard label="Groups"       value={groups.length}              color="var(--accent)" mono />
          <StatCard label="Total members" value={groups.reduce((s,g)=>s+(g.members?.length||0),0)} color="var(--blue)" mono />
          <StatCard label="Total tracked" value={fmt(totalSpent)}           color="var(--green)" />
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h2 style={{ fontSize:15, fontWeight:600 }}>Your groups</h2>
          <span style={{ fontSize:12, color:"var(--text-dim)" }}>{filtered.length} group{filtered.length!==1?"s":""}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} hasSearch={!!search} />
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }} className="stagger">
            {filtered.map(g => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </main>

      {showCreate && (
        <Suspense fallback={null}>
          <CreateGroupModal onClose={() => setShowCreate(false)} />
        </Suspense>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, color, mono }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:14, padding:"16px 20px",
    }}>
      <div style={{ fontSize:10.5, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", color:"var(--text-dim)", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color, fontFamily: mono?"var(--mono)":"var(--font)", letterSpacing:"-0.5px" }}>{value}</div>
    </div>
  );
}

function GroupCard({ group }) {
  const memberCount = group.members?.length || 0;
  return (
    <Link
      to={`/group/${group.id}`}
      className="fade-up"
      style={{
        display:"block", textDecoration:"none",
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:16, padding:"18px 20px",
        transition:"border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 30px rgba(124,111,255,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
    >
      <div style={{ fontSize:16, fontWeight:600, marginBottom:5, color:"var(--text)" }}>{group.name}</div>
      <div style={{ display:"flex", gap:14, fontSize:12, color:"var(--text-muted)", marginBottom:14 }}>
        <span>{memberCount} member{memberCount!==1?"s":""}</span>
        <span>{fmt(group.totalExpenses||0)} total</span>
      </div>
      <div style={{ display:"flex" }}>
        {(group.members||[]).slice(0,6).map((m,i) => {
          const { bg, fg } = avatarColor(m.name);
          return (
            <div key={m.uid||i} style={{
              width:28, height:28, borderRadius:"50%", background:bg, color:fg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:9, fontWeight:700, border:"2px solid var(--surface)",
              marginLeft: i===0 ? 0 : -7, zIndex:6-i,
            }}>{initials(m.name)}</div>
          );
        })}
        {memberCount > 6 && (
          <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--surface3)", color:"var(--text-dim)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:9, fontWeight:700, border:"2px solid var(--surface)", marginLeft:-7 }}>
            +{memberCount-6}
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ onCreate, hasSearch }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-dim)" }} className="fade-in">
      <div style={{ fontSize:48, marginBottom:14 }}>{hasSearch ? "🔍" : "🏝️"}</div>
      <div style={{ fontSize:16, color:"var(--text-muted)", marginBottom:6 }}>
        {hasSearch ? "No groups match your search" : "No groups yet"}
      </div>
      <div style={{ fontSize:13, marginBottom:20 }}>
        {hasSearch ? "Try a different keyword" : "Create a group to start splitting expenses"}
      </div>
      {!hasSearch && (
        <button onClick={onCreate} style={{
          padding:"10px 22px", background:"var(--accent)", color:"#fff",
          border:"none", borderRadius:10, fontSize:14, fontWeight:600,
          cursor:"pointer", fontFamily:"var(--font)",
        }}>Create your first group</button>
      )}
    </div>
  );
}
