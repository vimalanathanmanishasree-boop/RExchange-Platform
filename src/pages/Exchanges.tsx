import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const statusColor: Record<string, string> = {
  Requested: "border-gold",
  Pending: "border-moss text-mossdark",
  Completed: "border-ink",
  Rejected: "border-rust text-rust",
  Cancelled: "border-ink/40 text-ink/50",
};

export default function Exchanges() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);

  async function load() {
    const data = await api.listExchanges();
    setExchanges(data.exchanges);
  }
  useEffect(() => { load(); }, []);

  async function act(id: number, action: string) {
    await api.exchangeAction(id, action);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-black mb-6">Your exchanges</h1>
      {exchanges.length === 0 && <p className="text-ink/60">No exchange activity yet. Browse the trade post to get started.</p>}
      <div className="space-y-3">
        {exchanges.map((ex) => {
          const iAmOwner = ex.ownerId === user?.id;
          return (
            <div key={ex.id} className="card flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Link to={`/listings/${ex.listingId}`} className="font-display font-bold text-lg hover:underline">
                  {ex.listing?.title || "Listing"}
                </Link>
                <p className="text-xs text-ink/60 font-mono">
                  {iAmOwner ? `Requested by ${ex.requester?.name}` : `Owner: ${ex.owner?.name}`} · {new Date(ex.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`tag ${statusColor[ex.status] || ""}`}>{ex.status}</span>
              <div className="flex gap-2">
                {iAmOwner && ex.status === "Requested" && (
                  <>
                    <button className="btn-solid !py-1 !px-3" onClick={() => act(ex.id, "accept")}>Accept</button>
                    <button className="btn-ghost !py-1 !px-3 text-rust" onClick={() => act(ex.id, "reject")}>Reject</button>
                  </>
                )}
                {iAmOwner && ex.status === "Pending" && (
                  <button className="btn-primary !py-1 !px-3" onClick={() => act(ex.id, "complete")}>Mark completed</button>
                )}
                {!["Completed", "Rejected", "Cancelled"].includes(ex.status) && (
                  <button className="btn-ghost !py-1 !px-3" onClick={() => act(ex.id, "cancel")}>Cancel</button>
                )}
                {ex.status === "Completed" && <span className="font-mono text-xs">+{ex.karmaAwarded} karma</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
