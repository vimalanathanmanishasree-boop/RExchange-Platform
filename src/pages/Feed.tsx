import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Listing } from "../lib/api";
import ListingCard from "../components/ListingCard";

const CATEGORIES = ["Textbooks", "Electronics", "Event Tickets", "Notes & Study Material", "Skills/Services", "Miscellaneous"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Worn"];
const MODES = ["Barter", "Karma Points", "Free Giveaway", "Paid Resale"];

export default function Feed() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [mode, setMode] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("relevant");
  const [minKarma, setMinKarma] = useState("");
  const [maxKarma, setMaxKarma] = useState("");

  async function load() {
    setLoading(true);
    const params: Record<string, string> = { sort };
    if (category) params.category = category;
    if (condition) params.condition = condition;
    if (mode) params.mode = mode;
    if (q) params.q = q;
    if (minKarma) params.minKarma = minKarma;
    if (maxKarma) params.maxKarma = maxKarma;
    try {
      const data = await api.listListings(params);
      setListings(data.listings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, condition, mode, sort]);

  const urgentTickets = listings.filter(
    (l) => l.category === "Event Tickets" && l.expiryDate && new Date(l.expiryDate).getTime() - Date.now() < 48 * 60 * 60 * 1000
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl font-black">The Trade Post</h1>
          <p className="text-sm text-ink/70">Browse what's up on the board right now.</p>
        </div>
        <Link to="/listings/new" className="btn-primary">+ Pin a listing</Link>
      </div>

      {urgentTickets.length > 0 && (
        <div className="border-2 border-rust bg-rust/10 p-3 mb-6 flex items-center gap-3">
          <span className="tag border-rust bg-rust text-parchment shrink-0">TICKET SOS</span>
          <p className="text-sm">
            {urgentTickets.length} event ticket{urgentTickets.length > 1 ? "s" : ""} expiring within 48 hours — grab them before they're gone.
          </p>
        </div>
      )}

      <div className="card mb-6 grid md:grid-cols-6 gap-3">
        <input className="input md:col-span-2" placeholder="Search title or description..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">Any exchange mode</option>
          {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevant">Most relevant</option>
          <option value="newest">Newest</option>
          <option value="expiring">Expiring soon</option>
        </select>
        <input className="input" placeholder="Min karma" type="number" value={minKarma} onChange={(e) => setMinKarma(e.target.value)} />
        <input className="input" placeholder="Max karma" type="number" value={maxKarma} onChange={(e) => setMaxKarma(e.target.value)} />
        <button className="btn-solid md:col-span-1" onClick={load}>Apply</button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-56 animate-pulse bg-clay/40" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-16">
          <p className="font-display text-2xl font-bold mb-2">Nothing here yet</p>
          <p className="text-ink/70 mb-4">Be the first to pin something to the board.</p>
          <Link to="/listings/new" className="btn-primary">Create a listing</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
