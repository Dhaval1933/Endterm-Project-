import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGroups } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { fmt, CATEGORIES, CATEGORY_MAP } from "../utils";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";

export default function AddExpensePage() {
  const { groups, addExpense } = useGroups();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [form, setForm] = useState({
    groupId:   sp.get("group") || "",
    description: "",
    amount:    "",
    paidByUid: user?.uid || "",
    splitType: "equal",
    category:  "food",
    date:      new Date().toISOString().split("T")[0],
  });
  const [customSplits, setCustomSplits] = useState({});
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedGroup = useMemo(() => groups.find(g=>g.id===form.groupId),[groups,form.groupId]);

  useEffect(() => {
    if (!selectedGroup) return;
    const all = (selectedGroup.members||[]).map(m=>m.uid);
    setSelectedMembers(all);
    const init = {};
    all.forEach(uid => { init[uid]=""; });
    setCustomSplits(init);
    setForm(f => ({ ...f, paidByUid: user?.uid || "" }));
  }, [selectedGroup?.id]);

  const set = useCallback(k => e => setForm(f=>({...f,[k]:e.target.value})),[]);

  const toggleMember = useCallback(uid =>
    setSelectedMembers(prev => prev.includes(uid) ? prev.filter(u=>u!==uid) : [...prev,uid])
  ,[]);

  const equalShare = useMemo(() => {
    if (!form.amount||!selectedMembers.length) return 0;
    return Math.round((parseFloat(form.amount)/selectedMembers.length)*100)/100;
  },[form.amount,selectedMembers]);

  const customTotal = useMemo(() =>
    selectedMembers.reduce((s,uid)=>s+(parseFloat(customSplits[uid])||0),0)
  ,[customSplits,selectedMembers]);

  const paidByMember = useMemo(() =>
    selectedGroup?.members?.find(m=>m.uid===form.paidByUid)
  ,[selectedGroup,form.paidByUid]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const amount = parseFloat(form.amount);
    if (!form.groupId)        { setError("Please select a group"); return; }
    if (!form.description)    { setError("Please enter a description"); return; }
    if (!amount||amount<=0)   { setError("Please enter a valid amount"); return; }
    if (!form.paidByUid)      { setError("Please select who paid"); return; }
    if (!selectedMembers.length){ setError("Select at least one participant"); return; }

    let splits;
    if (form.splitType==="equal") {
      const share = Math.round((amount/selectedMembers.length)*100)/100;
      splits = selectedMembers.map(uid => {
        const m = selectedGroup.members.find(x=>x.uid===uid);
        return { uid, name:m?.name||uid, amount:share };
      });
    } else {
      if (Math.abs(customTotal-amount)>0.02) {
        setError(`Splits must add up to ${fmt(amount)}. Currently: ${fmt(customTotal)}`);
        return;
      }
      splits = selectedMembers.map(uid => {
        const m = selectedGroup.members.find(x=>x.uid===uid);
        return { uid, name:m?.name||uid, amount:parseFloat(customSplits[uid])||0 };
      });
    }

    setLoading(true);
    try {
      await addExpense(form.groupId, {
        description: form.description.trim(),
        amount,
        paidBy: { uid:form.paidByUid, name:paidByMember?.name||"Unknown" },
        splits,
        splitType: form.splitType,
        category:  form.category,
        date:      form.date,
      });
      navigate(`/group/${form.groupId}`);
    } catch(err) {
      setError(err.message||"Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <header style={{
        display:"flex", alignItems:"center", gap:14, padding:"16px 36px",
        borderBottom:"1px solid var(--border)", position:"sticky", top:0,
        background:"var(--bg)", zIndex:10,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:13, fontFamily:"var(--font)", display:"flex", alignItems:"center", gap:5 }}>
          ← Back
        </button>
        <h1 style={{ fontSize:18, fontWeight:700 }}>Add expense</h1>
      </header>

      <main style={{ padding:"28px 36px", maxWidth:640, width:"100%" }}>
        {error && (
          <div style={{
            background:"var(--red-dim)", border:"1px solid var(--red-border)",
            borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, color:"var(--red)",
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }} className="fade-up">

          {/* Group */}
          <Field label="Group *">
            <select className="ss-select" value={form.groupId} onChange={set("groupId")} required>
              <option value="">Select a group…</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>

          {/* Description + Amount */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Description *">
              <input className="ss-input" placeholder="Dinner, hotel, cab…"
                value={form.description} onChange={set("description")} required autoFocus />
            </Field>
            <Field label="Amount (₹) *">
              <input className="ss-input" type="number" placeholder="0.00" min="0.01" step="0.01"
                value={form.amount} onChange={set("amount")} required />
            </Field>
          </div>

          {/* Category + Date */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Category">
              <select className="ss-select" value={form.category} onChange={set("category")}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input className="ss-input" type="date" value={form.date} onChange={set("date")} />
            </Field>
          </div>

          {/* Paid by */}
          {selectedGroup && (
            <Field label="Paid by *">
              <select className="ss-select" value={form.paidByUid} onChange={set("paidByUid")} required>
                <option value="">Who paid?</option>
                {(selectedGroup.members||[]).map(m => (
                  <option key={m.uid} value={m.uid}>
                    {m.uid===user?.uid?`${m.name} (you)`:m.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Participants */}
          {selectedGroup && (
            <Field label="Split between">
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:4 }}>
                {(selectedGroup.members||[]).map(m => {
                  const sel = selectedMembers.includes(m.uid);
                  return (
                    <button key={m.uid} type="button" onClick={() => toggleMember(m.uid)} style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"5px 12px 5px 7px", borderRadius:100,
                      border:`1px solid ${sel?"var(--accent)":"var(--border)"}`,
                      background: sel?"var(--accent-dim)":"var(--surface2)",
                      color: sel?"var(--accent)":"var(--text-muted)",
                      cursor:"pointer", fontSize:13, fontFamily:"var(--font)",
                      transition:"all 0.15s",
                    }}>
                      <Avatar name={m.name} size={20} />
                      {m.uid===user?.uid?"You":m.name}
                      {sel&&<span style={{fontSize:10}}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Split type */}
          <Field label="Split type">
            <div style={{ display:"flex", gap:8 }}>
              {[{id:"equal",label:"⚖ Equal"},{id:"custom",label:"✏ Custom"}].map(t => (
                <button key={t.id} type="button"
                  onClick={() => setForm(f=>({...f,splitType:t.id}))}
                  style={{
                    padding:"8px 18px",
                    background: form.splitType===t.id?"var(--accent)":"var(--surface2)",
                    color:      form.splitType===t.id?"#fff":"var(--text-muted)",
                    border:`1px solid ${form.splitType===t.id?"var(--accent)":"var(--border)"}`,
                    borderRadius:9, fontSize:13, cursor:"pointer",
                    fontFamily:"var(--font)", fontWeight:500, transition:"all 0.15s",
                  }}
                >{t.label}</button>
              ))}
            </div>
          </Field>

          {/* Split preview */}
          {selectedGroup && selectedMembers.length>0 && (
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:12 }}>
                {form.splitType==="equal"?"Each person pays":"Enter each person's share"}
              </div>
              {(selectedGroup.members||[]).filter(m=>selectedMembers.includes(m.uid)).map(m => (
                <div key={m.uid} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <Avatar name={m.name} size={28} />
                  <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{m.uid===user?.uid?"You":m.name}</span>
                  {form.splitType==="equal" ? (
                    <span style={{ fontFamily:"var(--mono)", fontSize:14, fontWeight:600, color:"var(--accent)" }}>
                      {form.amount ? fmt(equalShare) : "—"}
                    </span>
                  ) : (
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--text-dim)", fontSize:13, pointerEvents:"none" }}>₹</span>
                      <input type="number" placeholder="0.00" min="0" step="0.01"
                        value={customSplits[m.uid]||""}
                        onChange={e => setCustomSplits(s=>({...s,[m.uid]:e.target.value}))}
                        className="ss-input"
                        style={{ width:110, paddingLeft:24, textAlign:"right" }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {form.splitType==="custom"&&form.amount&&(
                <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, fontSize:12, color:"var(--text-muted)" }}>
                  <span>Total assigned</span>
                  <span style={{ fontFamily:"var(--mono)", color:Math.abs(customTotal-(parseFloat(form.amount)||0))<0.02?"var(--green)":"var(--red)" }}>
                    {fmt(customTotal)} / {fmt(parseFloat(form.amount)||0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display:"flex", gap:10, paddingTop:4 }}>
            <button type="button" onClick={() => navigate(-1)} style={{
              padding:"10px 20px", background:"none", border:"1px solid var(--border)",
              borderRadius:10, color:"var(--text-muted)", cursor:"pointer", fontSize:13.5, fontFamily:"var(--font)",
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex:1, padding:"11px",
              background: loading?"var(--surface3)":"var(--accent)",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600, cursor: loading?"not-allowed":"pointer",
              fontFamily:"var(--font)", transition:"opacity 0.15s",
            }}>
              {loading?"Adding…":"Add expense →"}
            </button>
          </div>
        </form>
      </main>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, letterSpacing:"0.6px", textTransform:"uppercase", color:"var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
