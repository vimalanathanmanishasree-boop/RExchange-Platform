import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Leaderboard() {
  const [groupBy, setGroupBy] = useState("department");
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.leaderboard(groupBy, windowDays).then(setData);
  }, [groupBy, windowDays]);

  if (!data) return null;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl font-black">Karma Leaderboard</h1>
          <p className="text-sm text-ink/70">Ranked by trust and trade activity.</p>
        </div>
        <div className="flex gap-2">
          <select className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="department">By department</option>
            <option value="hostelBlock">By hostel/block</option>
          </select>
          <select className="input" value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-xl font-bold mb-3">Top students</h2>
          <ol className="space-y-2">
            {data.individualLeaders.map((u: any, i: number) => (
              <li key={u.id} className="flex items-center justify-between border-b border-ink/10 pb-2">
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm w-6 ${i < 3 ? "text-rust font-bold" : "text-ink/50"}`}>#{i + 1}</span>
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-ink/60">{u.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{u.karma}</p>
                  <p className="text-[10px] text-moss font-mono">+{u.recentKarma} recent</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-bold mb-3">By {groupBy === "hostelBlock" ? "hostel/block" : "department"}</h2>
          <div className="space-y-3">
            {data.groupLeaders.map((g: any) => {
              const max = data.groupLeaders[0]?.totalKarma || 1;
              return (
                <div key={g.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{g.name}</span>
                    <span className="font-mono">{g.totalKarma} pts · {g.members} members</span>
                  </div>
                  <div className="h-3 bg-clay border border-ink/20">
                    <div className="h-full bg-moss" style={{ width: `${(g.totalKarma / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
