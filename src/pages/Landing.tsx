import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { Navigate } from "react-router-dom";

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/feed" replace />;

  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center py-8">
      <div>
        <p className="tag border-rust text-rust mb-4">Verified students only</p>
        <h1 className="font-display text-6xl md:text-7xl font-black leading-[0.95] mb-6">
          Trade what you're
          <br />
          done with. <span className="text-rust italic">Earn</span> karma
          <br />
          for it.
        </h1>
        <p className="max-w-md text-ink/80 mb-8 leading-relaxed">
          RExchange is the campus bulletin board for textbooks, tickets, notes, gear, and
          skills — barter it, give it away, or price it in karma points. Every trade builds a
          trust score that follows you across campus.
        </p>
        <div className="flex gap-3">
          <Link to="/auth" className="btn-primary">
            Get started
          </Link>
          <a href="#how" className="btn-ghost">
            How it works
          </a>
        </div>
      </div>
      <div className="card -rotate-1 shadow-[6px_6px_0_0_rgba(28,26,23,0.9)]">
        <p className="font-mono text-xs uppercase tracking-widest text-rust mb-2">Pinned to the board</p>
        <h3 className="font-display text-2xl font-bold mb-1">Quantum Mechanics Notes</h3>
        <p className="text-sm text-ink/70 mb-3">PHY301 · Full semester, solved problem sets</p>
        <div className="flex gap-2 mb-3">
          <span className="tag">Free Giveaway</span>
          <span className="tag">Karma Points</span>
        </div>
        <p className="font-mono text-sm">15 karma · Good condition</p>
      </div>
      <div id="how" className="md:col-span-2 grid md:grid-cols-4 gap-4 pt-10 border-t-2 border-ink/20">
        {[
          ["01", "Verify", "Sign up with your college email and confirm a one-time code."],
          ["02", "List or browse", "Post what you no longer need, or search the board by category and karma."],
          ["03", "Chat & agree", "Message the owner in-app. Contact info stays hidden until you both opt in."],
          ["04", "Trade & rate", "Complete the exchange, earn karma, and leave each other an honest rating."],
        ].map(([num, title, body]) => (
          <div key={num}>
            <p className="font-mono text-rust text-sm mb-1">{num}</p>
            <h4 className="font-display font-bold text-lg mb-1">{title}</h4>
            <p className="text-sm text-ink/70">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
