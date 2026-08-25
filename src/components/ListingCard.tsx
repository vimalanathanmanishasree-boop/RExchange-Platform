import React from "react";
import { Link } from "react-router-dom";
import { Listing, mediaUrl } from "../lib/api";

const categoryColor: Record<string, string> = {
  Textbooks: "border-moss text-mossdark",
  Electronics: "border-rust text-rust",
  "Event Tickets": "border-gold text-[#8a6a1f]",
  "Notes & Study Material": "border-ink text-ink",
  "Skills/Services": "border-moss text-mossdark",
  Miscellaneous: "border-ink/50 text-ink/70",
};

function timeUntil(date: string | null) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hrs = ms / (1000 * 60 * 60);
  if (hrs < 24) return `${Math.round(hrs)}h left`;
  return `${Math.round(hrs / 24)}d left`;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const urgent = listing.category === "Event Tickets" && listing.expiryDate && new Date(listing.expiryDate).getTime() - Date.now() < 48 * 60 * 60 * 1000;
  const cover = listing.photoKeys?.[0] ? mediaUrl(listing.photoKeys[0]) : null;

  return (
    <Link to={`/listings/${listing.id}`} className="card flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(28,26,23,0.9)] transition-all">
      {cover && <img src={cover} alt={listing.title} className="w-full h-36 object-cover border border-ink/20 mb-1" />}
      <div className="flex items-start justify-between gap-2">
        <span className={`tag ${categoryColor[listing.category] || ""}`}>{listing.category}</span>
        {urgent && <span className="tag border-rust bg-rust text-parchment animate-pulse">SOS · {timeUntil(listing.expiryDate)}</span>}
      </div>
      <h3 className="font-display font-bold text-lg leading-tight">{listing.title}</h3>
      <p className="text-sm text-ink/70 line-clamp-2">{listing.description}</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {listing.exchangeModes.map((m) => (
          <span key={m} className="tag bg-clay/60">{m}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 font-mono text-xs text-ink/70">
        <span>{listing.karmaValue > 0 ? `${listing.karmaValue} karma` : listing.price ? `₹${listing.price}` : "Free"}</span>
        <span>{listing.condition} · ▲{listing.upvotes}</span>
      </div>
    </Link>
  );
}
