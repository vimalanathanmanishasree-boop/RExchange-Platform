import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center font-mono text-sm">Loading session...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
