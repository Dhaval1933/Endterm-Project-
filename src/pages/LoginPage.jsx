import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, signup, authLoading } = useAuth();
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signup(form.email, form.password, form.name);
      else                   await login(form.email, form.password);
    } catch (err) {
      const msg = err.message?.replace("Firebase: ","").replace(/\(auth\/.*?\)\.?/g,"").trim();
      setError(msg || "Something went wrong");
    }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg)" }}>

      {/* ── Left: form ── */}
      <div style={{ flex:"0 0 420px", display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
        <div style={{ width:"100%", maxWidth:380 }} className="fade-up">

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:40 }}>
            <div style={{ width:36, height:36, background:"var(--accent)", borderRadius:11,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#fff", fontWeight:800 }}>₹</div>
            <span style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.7px" }}>
              Split<span style={{ color:"var(--accent)" }}>Smart</span>
            </span>
          </div>

          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.6px", marginBottom:6 }}>
            {mode==="login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color:"var(--text-muted)", fontSize:14, marginBottom:28 }}>
            {mode==="login" ? "Sign in to manage your group expenses" : "Start splitting smarter with your crew"}
          </p>

          {error && (
            <div style={{
              background:"var(--red-dim)", border:"1px solid var(--red-border)",
              borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"var(--red)",
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="signup" && (
              <Field label="Full name">
                <input className="ss-input" placeholder="Arjun Sharma"
                  value={form.name} onChange={set("name")} required autoFocus />
              </Field>
            )}
            <Field label="Email address">
              <input className="ss-input" type="email" placeholder="you@email.com"
                value={form.email} onChange={set("email")} required />
            </Field>
            <Field label="Password">
              <input className="ss-input" type="password" placeholder="••••••••"
                value={form.password} onChange={set("password")} required minLength={6} />
            </Field>

            <button type="submit" disabled={authLoading} style={{
              marginTop:6, width:"100%", padding:"11px",
              background:"var(--accent)", color:"#fff", border:"none",
              borderRadius:10, fontSize:14, fontWeight:600,
              cursor: authLoading ? "not-allowed" : "pointer",
              fontFamily:"var(--font)", opacity: authLoading ? 0.7 : 1,
              transition:"opacity 0.15s, transform 0.12s",
            }}
              onMouseEnter={e => { if(!authLoading) e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; }}
            >
              {authLoading ? "Please wait…" : mode==="login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:13, color:"var(--text-muted)", marginTop:20 }}>
            {mode==="login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(m => m==="login"?"signup":"login"); setError(""); }}
              style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:13, fontFamily:"var(--font)" }}
            >
              {mode==="login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* ── Right: preview ── */}
      <div style={{
        flex:1, background:"var(--surface)", borderLeft:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:48,
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(124,111,255,0.1) 0%, transparent 70%)",
          top:"-10%", left:"0%", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(46,232,160,0.07) 0%, transparent 70%)",
          bottom:"0%", right:"-5%", pointerEvents:"none" }}/>
        <PreviewCard />
      </div>
    </div>
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

function PreviewCard() {
  const expenses = [
    { desc:"Hotel booking", paid:"Priya", amount:"₹6,400", splits:["Rahul","Anjali","You"] },
    { desc:"Beach dinner",  paid:"Rahul", amount:"₹2,100", splits:["Priya","You"] },
    { desc:"Cab to airport",paid:"You",   amount:"₹840",   splits:["Priya","Rahul","Anjali"] },
  ];
  return (
    <div style={{ width:"100%", maxWidth:360, position:"relative", zIndex:1 }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px", marginBottom:4 }}>Goa Trip 2025 🏖️</div>
        <div style={{ fontSize:13, color:"var(--text-muted)" }}>4 members · ₹14,680 total</div>
      </div>
      {expenses.map((e,i) => (
        <div key={i} style={{
          background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:14, padding:"13px 16px", marginBottom:10,
          animation:`fadeUp 0.4s ${i*90}ms both`,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{e.desc}</div>
              <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>paid by {e.paid}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"var(--mono)", color:"var(--accent)" }}>{e.amount}</div>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {e.splits.map(s => (
              <span key={s} style={{ fontSize:11, padding:"2px 8px", borderRadius:100, background:"var(--surface3)", color:"var(--text-muted)" }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
      <div style={{
        background:"var(--green-dim)", border:"1px solid var(--green-border)",
        borderRadius:12, padding:"11px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div style={{ fontSize:13, color:"var(--green)", fontWeight:500 }}>Your net balance</div>
        <div style={{ fontSize:17, fontWeight:700, fontFamily:"var(--mono)", color:"var(--green)" }}>+₹2,180.00</div>
      </div>
    </div>
  );
}
