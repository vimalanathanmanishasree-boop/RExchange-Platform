import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { api } from "../lib/api";

const COLORS = ["#3c5b41", "#c1502e", "#c99a3d", "#294130", "#8a6a1f", "#1c1a17"];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.dashboard().then(setData); }, []);
  if (!data) return null;
  const { totals, byCategory, byMode, monthlyCompletions } = data;

  return (
    <div>
      <h1 className="font-display text-4xl font-black mb-2">Campus Impact Dashboard</h1>
      <p className="text-sm text-ink/70 mb-6">Aggregate stats across every verified exchange on RExchange.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Items reused", totals.itemsReused],
          ["Exchanges completed", totals.exchangesCompleted],
          ["Karma circulated", totals.totalKarmaCirculated],
          ["Verified students", `${totals.verifiedUsers}/${totals.users}`],
        ].map(([label, value]) => (
          <div key={label as string} className="card text-center">
            <p className="font-display text-3xl font-black">{value}</p>
            <p className="text-xs uppercase tracking-wide text-ink/60 font-mono mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-xl font-bold mb-3">Listings by category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ddc8" />
              <XAxis type="number" stroke="#1c1a17" fontSize={12} />
              <YAxis type="category" dataKey="category" width={130} stroke="#1c1a17" fontSize={11} />
              <Tooltip contentStyle={{ background: "#fffcf5", border: "2px solid #1c1a17" }} />
              <Bar dataKey="count" fill="#3c5b41" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-bold mb-3">Exchange modes offered</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byMode} dataKey="count" nameKey="mode" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.mode}>
                {byMode.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#fffcf5", border: "2px solid #1c1a17" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-display text-xl font-bold mb-3">Completed exchanges over time</h2>
          {monthlyCompletions.length === 0 ? (
            <p className="text-sm text-ink/60">Not enough completed exchanges yet to chart a trend.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyCompletions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7ddc8" />
                <XAxis dataKey="month" stroke="#1c1a17" fontSize={12} />
                <YAxis stroke="#1c1a17" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#fffcf5", border: "2px solid #1c1a17" }} />
                <Bar dataKey="count" fill="#c1502e" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
