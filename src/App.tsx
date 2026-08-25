import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import Profile from "./pages/Profile";
import Exchanges from "./pages/Exchanges";
import Messages from "./pages/Messages";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
          <Route path="/listings/new" element={<RequireAuth><CreateListing /></RequireAuth>} />
          <Route path="/listings/:id/edit" element={<RequireAuth><CreateListing /></RequireAuth>} />
          <Route path="/listings/:id" element={<RequireAuth><ListingDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/:id" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/exchanges" element={<RequireAuth><Exchanges /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        </Routes>
      </main>
      <footer className="border-t-2 border-ink py-4 text-center font-mono text-[11px] uppercase tracking-widest text-ink/60">
        RExchange — a trust-driven campus trade post · built for verified students only
      </footer>
    </div>
  );
}
