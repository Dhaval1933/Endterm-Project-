// ── Avatar colors ─────────────────────────────────────────────────────────────
const COLORS = [
  { bg:"#7C6FFF", fg:"#fff" }, { bg:"#2EE8A0", fg:"#0A0A0F" },
  { bg:"#FF6B8A", fg:"#fff" }, { bg:"#FFB547", fg:"#0A0A0F" },
  { bg:"#5BA3FF", fg:"#fff" }, { bg:"#F471B5", fg:"#fff" },
  { bg:"#A78BFA", fg:"#fff" }, { bg:"#34D399", fg:"#0A0A0F" },
];
export function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}
export function initials(name = "") {
  return (name || "?").split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Currency ──────────────────────────────────────────────────────────────────
export function fmt(n) {
  return "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Date ──────────────────────────────────────────────────────────────────────
export function fmtDate(ts) {
  if (!ts) return "";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return ""; }
}

// ── Guest UID ─────────────────────────────────────────────────────────────────
export function guestUid() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id:"food",          label:"Food & Dining",  icon:"🍕" },
  { id:"transport",     label:"Transport",       icon:"🚗" },
  { id:"hotel",         label:"Hotel / Stay",    icon:"🏨" },
  { id:"entertainment", label:"Entertainment",   icon:"🎬" },
  { id:"groceries",     label:"Groceries",       icon:"🛒" },
  { id:"utilities",     label:"Utilities",       icon:"⚡" },
  { id:"rent",          label:"Rent",            icon:"🏠" },
  { id:"shopping",      label:"Shopping",        icon:"🛍️" },
  { id:"health",        label:"Health",          icon:"💊" },
  { id:"other",         label:"Other",           icon:"💸" },
];
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ── Smart settlement algorithm ─────────────────────────────────────────────
// Net-balance greedy approach: minimizes number of transactions
export function calculateSettlements(expenses = [], members = []) {
  const balances = {};
  members.forEach(m => { balances[m.uid] = 0; });

  expenses.forEach(exp => {
    const payerUid = exp.paidBy?.uid;
    if (!payerUid) return;
    balances[payerUid] = (balances[payerUid] || 0) + (Number(exp.amount) || 0);
    (exp.splits || []).forEach(s => {
      balances[s.uid] = (balances[s.uid] || 0) - (Number(s.amount) || 0);
    });
  });

  const creditors = [], debtors = [];
  Object.entries(balances).forEach(([uid, bal]) => {
    const m = members.find(x => x.uid === uid) || { uid, name: uid };
    if (bal >  0.005) creditors.push({ ...m, amount: bal });
    if (bal < -0.005) debtors.push({   ...m, amount: -bal });
  });

  const transactions = [];
  const C = creditors.map(x => ({ ...x }));
  const D = debtors.map(x => ({ ...x }));
  let ci = 0, di = 0;
  while (ci < C.length && di < D.length) {
    const amount = Math.round(Math.min(C[ci].amount, D[di].amount) * 100) / 100;
    if (amount > 0.005) transactions.push({ from: D[di], to: C[ci], amount });
    C[ci].amount -= amount;
    D[di].amount -= amount;
    if (C[ci].amount < 0.005) ci++;
    if (D[di].amount < 0.005) di++;
  }

  return { balances, transactions };
}
