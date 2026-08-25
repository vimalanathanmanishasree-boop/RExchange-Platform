import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"reports" | "domains" | "users" | "listings">("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  async function loadAll() {
    const [r, d, u, l] = await Promise.all([
      api.adminReports(),
      api.adminDomains(),
      api.adminUsers(),
      api.adminListings(),
    ]);
    setReports(r.reports);
    setDomains(d.domains);
    setUsers(u.users);
    setListings(l.listings);
  }

  useEffect(() => { if (user?.role === "admin") loadAll(); }, [user]);

  if (user && user.role !== "admin") return <Navigate to="/feed" replace />;

  return (
    <div>
      <h1 className="font-display text-4xl font-black mb-6">Admin console</h1>
      <div className="flex gap-2 mb-6 font-mono text-xs uppercase">
        {(["reports", "domains", "users", "listings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn-ghost !py-1.5 !px-3 ${tab === t ? "bg-clay" : ""}`}>{t}</button>
        ))}
      </div>

      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 && <p className="text-ink/60">No reports filed.</p>}
          {reports.map((r) => (
            <div key={r.id} className="card flex justify-between items-center gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{r.targetType} #{r.targetId}</p>
                <p className="text-sm text-ink/70">{r.reason}</p>
                <p className="text-[10px] font-mono text-ink/50">Reported {new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tag">{r.status}</span>
                <select
                  className="input !w-auto"
                  value={r.status}
                  onChange={async (e) => {
                    await api.updateReport(r.id, e.target.value);
                    loadAll();
                  }}
                >
                  {["Open", "Reviewed", "Dismissed", "Actioned"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "domains" && (
        <div className="card max-w-lg">
          <h2 className="font-display text-xl font-bold mb-3">Email whitelist</h2>
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="college.edu" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
            <button
              className="btn-primary"
              onClick={async () => {
                if (!newDomain.trim()) return;
                await api.addDomain(newDomain.trim());
                setNewDomain("");
                loadAll();
              }}
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {domains.map((d) => (
              <li key={d.id} className="flex justify-between items-center border-b border-ink/10 pb-1">
                <span className="font-mono text-sm">{d.domain}</span>
                <button className="text-rust text-xs underline" onClick={async () => { await api.removeDomain(d.id); loadAll(); }}>remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card flex justify-between items-center">
              <div>
                <p className="font-semibold">{u.name} <span className="text-ink/50 text-sm">{u.email}</span></p>
                <p className="text-xs text-ink/60">{u.department} · {u.karma} karma · {u.verified ? "verified" : "unverified"}</p>
              </div>
              <select
                className="input !w-auto"
                value={u.role}
                onChange={async (e) => { await api.setUserRole(u.id, e.target.value); loadAll(); }}
              >
                <option value="student">student</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "listings" && (
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} className="card flex justify-between items-center">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="text-xs text-ink/60">{l.category} · {l.status}</p>
              </div>
              <button className="text-rust text-xs underline" onClick={async () => { await api.adminDeleteListing(l.id); loadAll(); }}>remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
