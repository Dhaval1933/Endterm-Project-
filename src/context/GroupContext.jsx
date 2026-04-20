import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import {
  collection, doc, addDoc, getDoc, updateDoc,
  onSnapshot, query, where, orderBy,
  serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { guestUid } from "../utils";

const Ctx = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "SET_GROUPS":    return { ...state, groups: action.payload };
    case "SET_CURRENT":  return { ...state, current: action.payload, expenses: [] };
    case "SET_EXPENSES": return { ...state, expenses: action.payload };
    default: return state;
  }
}

export function GroupProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { groups: [], current: null, expenses: [] });

  // ── Real-time groups listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "groups"),
      where("memberIds", "array-contains", user.uid),
    );
    const unsub = onSnapshot(q, snap =>
      dispatch({ type: "SET_GROUPS", payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
    );
    return unsub;
  }, [user]);

  // ── Real-time expenses listener ────────────────────────────────────────────
  useEffect(() => {
    if (!state.current) return;
    const q = query(
      collection(db, "groups", state.current.id, "expenses"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, snap =>
      dispatch({ type: "SET_EXPENSES", payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) })
    );
    return unsub;
  }, [state.current?.id]);

  // ── Create group ───────────────────────────────────────────────────────────
  const createGroup = useCallback(async (name, guestMembers) => {
    if (!user) return;
    const me      = { uid: user.uid, name: user.displayName || "Me", email: user.email || "" };
    const members = [me, ...guestMembers];
    const ref = await addDoc(collection(db, "groups"), {
      name,
      members,
      memberIds: members.map(m => m.uid),
      totalExpenses: 0,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  // ── Add expense ────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (groupId, expense) => {
    await addDoc(collection(db, "groups", groupId, "expenses"), {
      ...expense,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "groups", groupId), {
      totalExpenses: increment(Number(expense.amount)),
    });
  }, []);

  // ── Settle up ─────────────────────────────────────────────────────────────
  const settleDebt = useCallback(async (groupId, s) => {
    await addDoc(collection(db, "groups", groupId, "expenses"), {
      description: `${s.fromName} paid ${s.toName}`,
      amount: s.amount,
      paidBy:      { uid: s.fromUid, name: s.fromName },
      splits:      [{ uid: s.toUid,  name: s.toName, amount: s.amount }],
      splitType:   "settlement",
      category:    "other",
      isSettlement: true,
      createdAt: serverTimestamp(),
    });
  }, []);

  const setCurrentGroup = useCallback(g => dispatch({ type: "SET_CURRENT", payload: g }), []);

  return (
    <Ctx.Provider value={{ ...state, createGroup, addExpense, settleDebt, setCurrentGroup }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGroups = () => useContext(Ctx);
