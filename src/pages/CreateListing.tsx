import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

const CATEGORIES = ["Textbooks", "Electronics", "Event Tickets", "Notes & Study Material", "Skills/Services", "Miscellaneous"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Worn"];
const MODES = ["Barter", "Karma Points", "Free Giveaway", "Paid Resale"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateListing() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("Good");
  const [modes, setModes] = useState<string[]>([]);
  const [karmaValue, setKarmaValue] = useState("0");
  const [price, setPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      api.getListing(Number(id)).then(({ listing }) => {
        setTitle(listing.title);
        setDescription(listing.description);
        setCategory(listing.category);
        setCondition(listing.condition);
        setModes(listing.exchangeModes);
        setKarmaValue(String(listing.karmaValue));
        setPrice(listing.price ? String(listing.price) : "");
        setExpiryDate(listing.expiryDate ? listing.expiryDate.slice(0, 10) : "");
        setSubjectCode(listing.subjectCode || "");
        setPhotoKeys(listing.photoKeys || []);
      });
    }
  }, [editing, id]);

  function toggleMode(m: string) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { key } = await api.upload(base64, file.type, "listing");
      setPhotoKeys((prev) => [...prev, key]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (modes.length === 0) {
      setError("Select at least one exchange mode");
      return;
    }
    setBusy(true);
    const payload = {
      title,
      description,
      category,
      condition,
      exchangeModes: modes,
      karmaValue: Number(karmaValue) || 0,
      price: price ? Number(price) : null,
      photoKeys,
      expiryDate: expiryDate || null,
      subjectCode: subjectCode || null,
    };
    try {
      if (editing) {
        await api.updateListing(Number(id), payload);
        navigate(`/listings/${id}`);
      } else {
        const { listing } = await api.createListing(payload);
        navigate(`/listings/${listing.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-4xl font-black mb-6">{editing ? "Edit listing" : "Pin a new listing"}</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Exchange modes</label>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => toggleMode(m)}
                className={`tag cursor-pointer ${modes.includes(m) ? "bg-moss text-parchment border-moss" : "bg-transparent"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Karma value</label>
            <input className="input" type="number" min={0} value={karmaValue} onChange={(e) => setKarmaValue(e.target.value)} />
          </div>
          <div>
            <label className="label">Price (₹, only if Paid Resale)</label>
            <input className="input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        {category === "Event Tickets" && (
          <div>
            <label className="label">Expiry date (event date)</label>
            <input className="input" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
        )}
        {category === "Notes & Study Material" && (
          <div>
            <label className="label">Subject code (for Notes Vault search)</label>
            <input className="input" placeholder="e.g. CS201" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Photos</label>
          <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} />
          <div className="flex gap-2 mt-2 flex-wrap">
            {photoKeys.map((k) => (
              <span key={k} className="tag bg-clay/60">photo attached</span>
            ))}
          </div>
        </div>
        {error && <p className="text-rust text-sm font-mono">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || uploading}>
          {busy ? "Saving..." : editing ? "Save changes" : "Post listing"}
        </button>
      </form>
    </div>
  );
}
