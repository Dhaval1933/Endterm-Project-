import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); 
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  const signup = useCallback(async (email, password, name) => {
    setAuthLoading(true);
    try {
      // 1. Create the Auth Account
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Set the Display Name
      await updateProfile(cred.user, { displayName: name });
      
      // 3. Create User Document in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, 
        name, 
        email,
        createdAt: serverTimestamp(),
      });
      
      return cred.user;
    } catch (error) {
      console.error("AuthContext Signup Error:", error);
      throw error; // This passes the REAL error to your Signup Page
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("AuthContext Login Error:", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return (
    <Ctx.Provider value={{ user, authLoading, signup, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);