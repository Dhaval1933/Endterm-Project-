import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGroups } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { fmt, fmtDate, calculateSettlements, CATEGORY_MAP } from "../utils";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";

export default function GroupPage() {
  const { id } = useParams();
  const { groups, setCurrentGroup, expenses, settleDebt } = useGroups();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("expenses");
  const [search, setSearch] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const group = useMemo(() => groups.find(g => g.id === id), [groups, id]);

  useEffect(() => { if (group) setCurrentGroup(group); }, [group?.id]);

  // Compute balances on non-settlement expenses, then apply settlements on top
  const { balances, transactions } = useMemo(() => {
    if (!group) return { balances:{}, transactions:[] };
    return calculateSettlements(expenses, group.members||[]);
  }, [expenses, group]);

  const myBalance = balances[user?.uid] || 0;

  const filteredExpenses = useMemo(() => expenses.filter(e => {
    if (search && !e.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMember!=="all" && e.paidBy?.uid!==filterMember && !e.splits?.some(s=>s.uid===filterMember)) return false;
    if (filterCat!=="all" && e.category!==filterCat) return false;
    return true;
  }), [expenses, search, filterMember, filterCat]);

  if (!group) return (
    <AppShell>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <Spinner size={36} />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <header style={{
        display:"flex", alignItems:"center", gap:14, padding:"16px 36px",
        borderBottom:"1px solid var(--border)", position:"sticky", top:0,
        background:"var(--bg)", zIndex:10, flexWrap:"wrap",
      }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:13, fontFamily:"var(--font)", display:"flex", alignItems:"center", gap:5 }}>
          ← Back
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.4px" }}>{group.name}</h1>
          <p style={{ fontSize:12, color:"var(--text-dim)" }}>{group.members?.length} members</p>
        </div>
        <Link to={`/add-expense?group=${id}`} style={{
          padding:"8px 16px", background:"var(--accent)", color:"#fff",
          border:"none", borderRadius:10, fontSize:13, fontWeight:600,
          textDecoration:"none", whiteSpace:"nowrap",
        }}>+ Add expense</Link>
      </header>

      <main style={{ padding:"24px 36px", maxWidth:860, width:"100%" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:22 }} className="fade-up">
          <MiniStat label="Total spent" value={fmt(group.totalExpenses||0)} color="var(--accent)" />
          <MiniStat
            label="Your balance"
            value={(myBalance>=0?"+":"−")+fmt(Math.abs(myBalance))}
            color={myBalance>0?"var(--green)":myBalance<0?"var(--red)":"var(--text-dim)"}
          />
          <MiniStat label="Expenses" value={expenses.filter(e=>!e.isSettlement).length} />
          <MiniStat label="Settlements" value={expenses.filter(e=>e.isSettlement).length} color="var(--blue)" />
        </div>

        {/* Members row */}
        <div style={{
          background:"var(--surface)", border:"1px solid var(--border)",
          borderRadius:14, padding:"14px 18px", marginBottom:20,
          display:"flex", flexWrap:"wrap", gap:9, alignItems:"center",
        }} className="fade-up">
          <span style={{ fontSize:11, fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.7px" }}>Members</span>
          {(group.members||[]).map((m,i) => {
            const bal = balances[m.uid]||0;
            return (
              <div key={m.uid||i} style={{
                display:"flex", alignItems:"center", gap:7, padding:"5px 12px 5px 6px",
                background:"var(--surface2)", borderRadius:100, border:"1px solid var(--border)",
              }}>
                <Avatar name={m.name} size={22} />
                <span style={{ fontSize:12.5 }}>{m.uid===user?.uid?`${m.name} (you)`:m.name}</span>
                {Math.abs(bal)>0.01 && (
                  <span style={{ fontSize:11, fontFamily:"var(--mono)", fontWeight:600, color:bal>0?"var(--green)":"var(--red)" }}>
                    {bal>0?"+":"−"}{fmt(Math.abs(bal))}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, borderBottom:"1px solid var(--border)", marginBottom:22 }}>
          {["expenses","settlements","balances"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"9px 16px", background:"none", border:"none",
              borderBottom: tab===t ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom:-1,
              color: tab===t ? "var(--accent)" : "var(--text-muted)",
              fontWeight: tab===t ? 600 : 400, fontSize:13.5,
              cursor:"pointer", fontFamily:"var(--font)", textTransform:"capitalize",
            }}>{t}</button>
          ))}
        </div>

        {tab==="expenses" && (
          <ExpensesTab
            expenses={filteredExpenses}
            members={group.members||[]}
            currentUid={user?.uid}
            search={search} setSearch={setSearch}
            filterMember={filterMember} setFilterMember={setFilterMember}
            filterCat={filterCat} setFilterCat={setFilterCat}
          />
        )}
        {tab==="settlements" && (
          <SettlementsTab transactions={transactions} currentUid={user?.uid} groupId={id} />
        )}
        {tab==="balances" && (
          <BalancesTab balances={balances} members={group.members||[]} />
        )}
      </main>
    </AppShell>
  );
}

// ── Mini stat card ─────────────────────────────────────────────────────────────
function MiniStat({ label, value, color="var(--text)" }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px" }}>
      <div style={{ fontSize:10.5, fontWeight:600, letterSpacing:"0.8px", textTransform:"uppercase", color:"var(--text-dim)", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"var(--mono)", letterSpacing:"-0.5px" }}>{value}</div>
    </div>
  );
}

// ── Expenses tab ───────────────────────────────────────────────────────────────
function ExpensesTab({ expenses, members, currentUid, search, setSearch, filterMember, setFilterMember, filterCat, setFilterCat }) {
  const usedCats = useMemo(() => [...new Set(expenses.map(e=>e.category).filter(Boolean))],[expenses]);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 180px" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-dim)", fontSize:13, pointerEvents:"none" }}>⌕</span>
          <input className="ss-input" style={{ paddingLeft:30 }} placeholder="Search expenses…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="ss-select" style={{ flex:"0 0 140px" }} value={filterMember} onChange={e=>setFilterMember(e.target.value)}>
          <option value="all">All members</option>
          {members.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
        </select>
        <select className="ss-select" style={{ flex:"0 0 160px" }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {usedCats.map(c => <option key={c} value={c}>{CATEGORY_MAP[c]?.icon} {CATEGORY_MAP[c]?.label||c}</option>)}
        </select>
      </div>

      {expenses.length===0 ? (
        <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--text-dim)" }} className="fade-in">
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15, color:"var(--text-muted)" }}>No expenses found</div>
          <div style={{ fontSize:13, marginTop:4 }}>Try adjusting filters or add an expense</div>
        </div>
      ) : (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden" }}>
          {expenses.map((exp,i) => (
            <ExpenseRow key={exp.id} expense={exp} currentUid={currentUid} last={i===expenses.length-1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({ expense, currentUid, last }) {
  const cat = CATEGORY_MAP[expense.category] || CATEGORY_MAP.other;
  const paidByMe = expense.paidBy?.uid === currentUid;
  const myShare  = expense.splits?.find(s => s.uid===currentUid);
  return (
    <div
      style={{
        display:"flex", alignItems:"center", gap:13, padding:"13px 18px",
        borderBottom: last ? "none" : "1px solid var(--border)",
        opacity: expense.isSettlement ? 0.6 : 1,
        transition:"background 0.12s",
      }}
      onMouseEnter={e => e.currentTarget.style.background="var(--surface2)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}
    >
      <div style={{
        width:38, height:38, borderRadius:10, flexShrink:0,
        background: expense.isSettlement ? "var(--green-dim)" : "var(--accent-dim)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
      }}>
        {expense.isSettlement ? "✓" : (cat?.icon||"💸")}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {expense.description}
        </div>
        <div style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:2, display:"flex", gap:6, flexWrap:"wrap" }}>
          <span>Paid by <strong>{paidByMe?"you":expense.paidBy?.name}</strong></span>
          <span style={{ color:"var(--text-dim)" }}>·</span>
          <span>{fmtDate(expense.createdAt)}</span>
          {!expense.isSettlement && <><span style={{ color:"var(--text-dim)" }}>·</span><span>{expense.splitType==="equal"?"equal":"custom"}</span></>}
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:700, fontFamily:"var(--mono)" }}>{fmt(expense.amount)}</div>
        {!expense.isSettlement && myShare && !paidByMe && (
          <div style={{ fontSize:11, color:"var(--red)", marginTop:2 }}>you owe {fmt(myShare.amount)}</div>
        )}
        {!expense.isSettlement && paidByMe && (expense.splits?.length||0)>1 && myShare && (
          <div style={{ fontSize:11, color:"var(--green)", marginTop:2 }}>
            you lent {fmt(expense.amount - myShare.amount)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settlements tab ────────────────────────────────────────────────────────────
function SettlementsTab({ transactions, currentUid, groupId }) {
  const { settleDebt } = useGroups();
  const [settling, setSettling] = useState(null);

  async function handleSettle(t) {
    const key = `${t.from.uid}_${t.to.uid}`;
    setSettling(key);
    try {
      await settleDebt(groupId, { fromUid:t.from.uid, fromName:t.from.name, toUid:t.to.uid, toName:t.to.name, amount:t.amount });
    } catch(err) { console.error(err); }
    finally { setSettling(null); }
  }

  if (!transactions.length) return (
    <div style={{ textAlign:"center", padding:"56px 20px" }} className="fade-in">
      <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
      <div style={{ fontSize:16, fontWeight:600, color:"var(--green)", marginBottom:6 }}>All settled up!</div>
      <div style={{ fontSize:13, color:"var(--text-dim)" }}>No outstanding balances in this group</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:12, color:"var(--text-dim)", marginBottom:14 }}>
        {transactions.length} transaction{transactions.length!==1?"s":""} to settle all debts (minimized)
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {transactions.map((t,i) => {
          const isMe = t.from.uid===currentUid;
          const key  = `${t.from.uid}_${t.to.uid}`;
          return (
            <div key={i} className="fade-up" style={{
              display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
              background: isMe?"var(--red-dim)":"var(--surface2)",
              border:`1px solid ${isMe?"var(--red-border)":"var(--border)"}`,
              borderRadius:12,
            }}>
              <Avatar name={t.from.name} size={34} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>
                  <span style={{ color:isMe?"var(--red)":"var(--text)" }}>{t.from.uid===currentUid?"You":t.from.name}</span>
                  <span style={{ color:"var(--text-dim)", margin:"0 8px" }}>→</span>
                  <span style={{ color:t.to.uid===currentUid?"var(--green)":"var(--text)" }}>{t.to.uid===currentUid?"You":t.to.name}</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:3 }}>
                  {isMe?"You owe":`${t.from.name} owes`} {t.to.uid===currentUid?"you":t.to.name}
                </div>
              </div>
              <Avatar name={t.to.name} size={34} />
              <div style={{ fontFamily:"var(--mono)", fontSize:16, fontWeight:700, color:isMe?"var(--red)":"var(--green)", minWidth:80, textAlign:"right" }}>
                {fmt(t.amount)}
              </div>
              {isMe && (
                <button
                  onClick={() => handleSettle(t)}
                  disabled={settling===key}
                  style={{
                    padding:"7px 14px", background:"var(--green-dim)",
                    border:"1px solid var(--green-border)", borderRadius:8,
                    color:"var(--green)", cursor:"pointer", fontSize:12.5,
                    fontFamily:"var(--font)", fontWeight:500, whiteSpace:"nowrap",
                    opacity: settling===key ? 0.6 : 1,
                  }}
                >
                  {settling===key?"…":"Mark settled"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Balances tab ───────────────────────────────────────────────────────────────
function BalancesTab({ balances, members }) {
  const sorted = useMemo(() => [...members].sort((a,b)=>(balances[b.uid]||0)-(balances[a.uid]||0)),[members,balances]);
  const max = useMemo(() => Math.max(...Object.values(balances).map(Math.abs),1),[balances]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }} className="stagger">
      {sorted.map(m => {
        const bal = balances[m.uid]||0;
        const pct = (Math.abs(bal)/max)*100;
        const color = bal>0.01?"var(--green)":bal<-0.01?"var(--red)":"var(--text-dim)";
        return (
          <div key={m.uid} className="fade-up" style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <Avatar name={m.name} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:500 }}>{m.name}</div>
                <div style={{ fontSize:11.5, color:"var(--text-dim)" }}>
                  {bal>0.01?"is owed money":bal<-0.01?"owes money":"all settled"}
                </div>
              </div>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:"var(--mono)", color }}>
                {bal>0?"+":bal<0?"−":""}{fmt(Math.abs(bal))}
              </div>
            </div>
            <div style={{ height:4, background:"var(--surface3)", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.6s ease" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}


