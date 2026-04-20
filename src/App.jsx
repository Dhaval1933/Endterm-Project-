import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GroupProvider } from "./context/GroupContext";

const LoginPage      = lazy(() => import("./pages/LoginPage"));
const DashboardPage  = lazy(() => import("./pages/DashboardPage"));
const GroupPage      = lazy(() => import("./pages/GroupPage"));
const AddExpensePage = lazy(() => import("./pages/AddExpensePage"));

function Fallback() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ width:32, height:32, border:"2px solid var(--border)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <Fallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <GroupProvider>{children}</GroupProvider>;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <Fallback />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/group/:id" element={
          <ProtectedRoute><GroupPage /></ProtectedRoute>
        } />
        <Route path="/add-expense" element={
          <ProtectedRoute><AddExpensePage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
