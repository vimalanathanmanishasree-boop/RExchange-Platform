import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

const links = [
  { to: "/feed", label: "Trade Post" },
  { to: "/leaderboard", label: "Karma Board" },
  { to: "/dashboard", label: "Impact" },
  { to: "/exchanges", label: "Exchanges" },
  { to: "/messages", label: "Messages" },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b-2 border-ink bg-parchment sticky top-0 z-40">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 gap-4">
        <Link to="/feed" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display text-2xl font-black tracking-tight">RExchange</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust hidden sm:inline">
            campus trade post
          </span>
        </Link>
        {user && (
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs uppercase tracking-wide">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 border-b-2 ${isActive ? "border-rust text-rust" : "border-transparent hover:border-ink/40"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 border-b-2 ${isActive ? "border-rust text-rust" : "border-transparent hover:border-ink/40"}`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <span className="tag bg-gold/20 border-gold text-ink">{user.karma} karma</span>
              <Link to="/profile" className="btn-ghost !py-1.5 !px-3">
                {user.name.split(" ")[0]}
              </Link>
              <button
                className="btn-ghost !py-1.5 !px-3"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary !py-1.5 !px-4">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
