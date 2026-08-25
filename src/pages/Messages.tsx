import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Messages() {
  const [threads, setThreads] = useState<any[]>([]);
  useEffect(() => {
    api.threads().then((d) => setThreads(d.threads));
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-4xl font-black mb-6">Conversations</h1>
      {threads.length === 0 && <p className="text-ink/60">No conversations yet. Message someone from a listing page.</p>}
      <div className="space-y-2">
        {threads.map((t, i) => (
          <Link key={i} to={`/listings/${t.listingId}`} className="card flex items-center justify-between hover:bg-clay/30">
            <div>
              <p className="font-semibold">{t.withUserName} <span className="text-ink/50 text-sm">on {t.listingTitle}</span></p>
              <p className="text-sm text-ink/70 line-clamp-1">{t.lastMessage}</p>
            </div>
            <span className="text-[10px] font-mono text-ink/50">{new Date(t.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
