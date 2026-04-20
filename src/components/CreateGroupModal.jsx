import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "../context/GroupContext";
import { guestUid } from "../utils";

export default function CreateGroupModal({ onClose }) {
  const { createGroup } = useGroups();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [members, setMembers] = useState([{ name:"", email:"" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addMember    = useCallback(() => setMembers(m => [...m, { name:"", email:"" }]), []);
  const removeMember = useCallback(i  => setMembers(m => m.filter((_,idx) => idx!==i)), []);
  const updateMember = useCallback((i,k,v) =>
    setMembers(m => m.map((x,idx) => idx===i ? {...x,[k]:v} : x)), []);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(""); setLoading(true);
    try {
      const guests = members
        .filter(m => m.name.trim())
        .map(m => ({ uid: guestUid(), name: m.name.trim(), email: m.email.trim() }));
      const id = await createGroup(name.trim(), guests);
      onClose();
      navigate(`/group/${id}`);
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:300, padding:20,
      }}
      onClick={e => e.target===e.currentTarget && onClose()}
    >
      <div className="slide-in" style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:18, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto",
      }}>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Create group</h2>
        <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:22 }}>
          Add your friends, roommates, or travel buddies
        </p>

        {error && (
          <div style={{
            background:"var(--red-dim)", border:"1px solid var(--red-border)",
            borderRadius:9, padding:"9px 13px", marginBottom:14, fontSize:13, color:"var(--red)",
          }}>{error}</div>
        )}

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Field label="Group name *">
            <input className="ss-input" placeholder="Goa Trip, Flat 4B, Office Lunch…"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </Field>

          <div>
            <label style={lbl}>Members (besides yourself)</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:6 }}>
              {members.map((m, i) => (
                <div key={i} style={{ display:"flex", gap:8 }}>
                  <input className="ss-input" placeholder="Name" value={m.name}
                    onChange={e => updateMember(i,"name",e.target.value)} style={{ flex:1 }} />
                  <input className="ss-input" placeholder="Email (optional)" value={m.email}
                    onChange={e => updateMember(i,"email",e.target.value)} style={{ flex:1.3 }} />
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(i)}
                      style={{ background:"var(--red-dim)", border:"none", borderRadius:8, color:"var(--red)", cursor:"pointer", padding:"0 11px", fontSize:14, flexShrink:0 }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addMember}
              style={{
                marginTop:8, background:"none", border:"1px dashed var(--border)",
                borderRadius:8, color:"var(--text-muted)", cursor:"pointer",
                padding:"7px 14px", fontSize:12.5, fontFamily:"var(--font)", width:"100%",
                transition:"border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}
            >+ Add another member</button>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex:1, padding:"10px",
              background: loading ? "var(--surface3)" : "var(--accent)",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"var(--font)",
            }}>
              {loading ? "Creating…" : "Create group →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}
const lbl = { fontSize:11, fontWeight:600, letterSpacing:"0.7px", textTransform:"uppercase", color:"var(--text-muted)" };
const ghostBtn = { padding:"10px 20px", background:"none", border:"1px solid var(--border)", borderRadius:10, color:"var(--text-muted)", cursor:"pointer", fontSize:13.5, fontFamily:"var(--font)" };
