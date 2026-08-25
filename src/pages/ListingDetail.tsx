import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, Listing, User, mediaUrl } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function ListingDetail() {
  const { id } = useParams();
  const listingId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [exchange, setExchange] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [contactRevealed, setContactRevealed] = useState(false);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const pollRef = useRef<number | null>(null);

  const isOwner = user && listing && user.id === listing.ownerId;

  const load = useCallback(async () => {
    try {
      const data = await api.getListing(listingId);
      setListing(data.listing);
      setOwner(data.owner);
    } catch (err: any) {
      setError(err.message);
    }
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!listing || !user || isOwner) return;
    api.listExchanges().then((data) => {
      const ex = data.exchanges.find((e: any) => e.listingId === listingId && e.requesterId === user.id);
      setExchange(ex || null);
    });
  }, [listing, user, listingId, isOwner]);

  const otherUserId = isOwner ? null : owner?.id;
  const pollChat = useCallback(async () => {
    if (!user || !owner) return;
    const withUserId = isOwner ? (exchange?.requesterId ?? null) : owner.id;
    if (!withUserId) return;
    try {
      const data = await api.getMessages(listingId, withUserId);
      setMessages(data.messages);
      setContactRevealed(data.contactRevealed);
      setContactEmail(data.contactEmail);
    } catch {
      /* ignore transient poll errors */
    }
  }, [user, owner, isOwner, exchange, listingId]);

  useEffect(() => {
    pollChat();
    pollRef.current = window.setInterval(pollChat, 4000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [pollChat]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !owner) return;
    const recipientId = isOwner ? exchange?.requesterId : owner.id;
    if (!recipientId) return;
    await api.sendMessage(listingId, recipientId, text.trim());
    setText("");
    pollChat();
  }

  async function requestExchange() {
    try {
      const { exchange: ex } = await api.requestExchange(listingId);
      setExchange(ex);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function doAction(action: string) {
    if (!exchange) return;
    const { exchange: ex } = await api.exchangeAction(exchange.id, action);
    setExchange(ex);
    load();
  }

  async function submitReport() {
    if (!reportReason.trim()) return;
    await api.report("listing", listingId, reportReason.trim());
    setReportOpen(false);
    setReportReason("");
    alert("Report submitted. Our moderation team will take a look.");
  }

  if (error) return <p className="text-rust font-mono">{error}</p>;
  if (!listing) return <p className="font-mono text-sm">Loading...</p>;

  const cover = listing.photoKeys?.[0] ? mediaUrl(listing.photoKeys[0]) : null;

  return (
    <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
      <div>
        {cover && <img src={cover} alt={listing.title} className="w-full max-h-96 object-cover border-2 border-ink mb-4" />}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="tag">{listing.category}</span>
          <span className="tag">{listing.status}</span>
          {listing.exchangeModes.map((m) => <span key={m} className="tag bg-clay/60">{m}</span>)}
        </div>
        <h1 className="font-display text-4xl font-black mb-2">{listing.title}</h1>
        <p className="text-ink/80 whitespace-pre-wrap mb-4">{listing.description}</p>
        <div className="flex gap-4 font-mono text-sm text-ink/70 mb-4">
          <span>{listing.condition}</span>
          <span>{listing.karmaValue > 0 ? `${listing.karmaValue} karma` : listing.price ? `₹${listing.price}` : "Free"}</span>
          {listing.expiryDate && <span>Expires {new Date(listing.expiryDate).toLocaleDateString()}</span>}
          <span>{listing.views} views</span>
        </div>

        {owner && (
          <Link to={`/profile/${owner.id}`} className="card flex items-center gap-3 mb-4 hover:bg-clay/30">
            <div className="w-10 h-10 rounded-full bg-moss text-parchment flex items-center justify-center font-display font-bold">
              {owner.name[0]}
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                {owner.name} {owner.verified && <span className="tag border-moss text-mossdark">verified</span>}
              </p>
              <p className="text-xs text-ink/60">{owner.department} · {owner.karma} karma</p>
            </div>
          </Link>
        )}

        {!isOwner && (
          <div className="flex gap-3 mb-4">
            {!exchange && listing.status === "Active" && (
              <button className="btn-primary" onClick={requestExchange}>Request exchange</button>
            )}
            {exchange && exchange.status === "Requested" && <span className="tag border-gold">Request pending owner approval</span>}
            {exchange && exchange.status === "Pending" && (
              <>
                <span className="tag border-moss text-mossdark">Approved — coordinate the trade</span>
                {!contactRevealed && (
                  <button className="btn-ghost" onClick={() => doAction("reveal")}>Reveal my contact info</button>
                )}
              </>
            )}
            {exchange && exchange.status === "Completed" && <RateBox exchange={exchange} />}
            <button className="btn-ghost text-rust" onClick={() => setReportOpen((v) => !v)}>Report</button>
          </div>
        )}

        {isOwner && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <Link to={`/listings/${listing.id}/edit`} className="btn-ghost">Edit</Link>
            <button
              className="btn-ghost text-rust"
              onClick={async () => {
                if (confirm("Delete this listing?")) {
                  await api.deleteListing(listing.id);
                  navigate("/feed");
                }
              }}
            >
              Delete
            </button>
          </div>
        )}

        {reportOpen && (
          <div className="card mb-4">
            <label className="label">Why are you reporting this listing?</label>
            <textarea className="input mb-2" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
            <button className="btn-primary" onClick={submitReport}>Submit report</button>
          </div>
        )}
      </div>

      <div className="card flex flex-col h-[32rem]">
        <h2 className="font-display font-bold text-lg mb-2">Chat about this listing</h2>
        {contactRevealed && contactEmail && (
          <div className="text-xs font-mono border border-moss bg-moss/10 p-2 mb-2">
            Contact revealed: <strong>{contactEmail}</strong>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
          {messages.length === 0 && <p className="text-sm text-ink/50">No messages yet. Say hello.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] p-2 border ${m.senderId === user?.id ? "ml-auto bg-moss/10 border-moss" : "border-ink/30"}`}>
              <p className="text-sm">{m.body}</p>
              <p className="text-[10px] font-mono text-ink/50">{new Date(m.createdAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
        {(isOwner ? exchange || true : owner) && (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input className="input" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn-solid">Send</button>
          </form>
        )}
        <p className="text-[10px] text-ink/40 mt-1 font-mono">Chat refreshes every 4s (polling, not websockets).</p>
      </div>
    </div>
  );
}

function RateBox({ exchange }: { exchange: any }) {
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");
  const [done, setDone] = useState(false);

  if (done) return <span className="tag border-moss text-mossdark">Thanks for rating!</span>;

  return (
    <div className="card">
      <p className="font-semibold mb-2">Rate this exchange</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setStars(s)} className={`text-2xl ${s <= stars ? "text-gold" : "text-ink/20"}`}>★</button>
        ))}
      </div>
      <textarea className="input mb-2" placeholder="Leave a short review" value={review} onChange={(e) => setReview(e.target.value)} />
      <button
        className="btn-primary"
        onClick={async () => {
          try {
            await api.rate(exchange.id, stars, review);
            setDone(true);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      >
        Submit rating
      </button>
    </div>
  );
}
