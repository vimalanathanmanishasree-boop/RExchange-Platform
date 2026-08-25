import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, mediaUrl } from "../lib/api";
import { useAuth } from "../lib/auth-context";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { id } = useParams();
  const { user, refresh } = useAuth();
  const viewingSelf = !id || Number(id) === user?.id;

  const [profile, setProfile] = useState<any>(user);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", year: "", hostelBlock: "", bio: "" });

  useEffect(() => {
    if (viewingSelf && user) {
      setProfile(user);
      setForm({ name: user.name, department: user.department, year: user.year, hostelBlock: user.hostelBlock, bio: user.bio });
      api.getRatings(user.id).then((d) => { setRatings(d.ratings); setAvg(d.average); });
    } else if (id) {
      api.getRatings(Number(id)).then((d) => { setRatings(d.ratings); setAvg(d.average); });
    }
  }, [viewingSelf, user, id]);

  if (!viewingSelf) {
    return (
      <div className="max-w-xl mx-auto card">
        <p className="text-sm text-ink/60">Viewing another student's profile is limited to rating history in this build.</p>
        <h2 className="font-display text-2xl font-bold mt-2">Rating history</h2>
        {avg !== null && <p className="font-mono text-sm mb-2">Average: {avg.toFixed(1)} ★ ({ratings.length} reviews)</p>}
        {ratings.map((r) => (
          <div key={r.id} className="border-t border-ink/10 py-2">
            <p className="font-mono text-sm">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</p>
            <p className="text-sm text-ink/70">{r.review}</p>
          </div>
        ))}
      </div>
    );
  }

  if (!profile) return null;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const { key } = await api.upload(base64, file.type, "profile");
    await api.updateProfile({ photoKey: key });
    await refresh();
  }

  async function save() {
    await api.updateProfile(form);
    await refresh();
    setEditing(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card flex gap-5 items-start mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-moss text-parchment flex items-center justify-center font-display text-3xl font-bold overflow-hidden">
            {profile.photoKey ? <img src={mediaUrl(profile.photoKey)!} className="w-full h-full object-cover" /> : profile.name[0]}
          </div>
          <label className="text-[10px] font-mono underline cursor-pointer block mt-1 text-center">
            change
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-black flex items-center gap-2">
            {profile.name} {profile.verified && <span className="tag border-moss text-mossdark">verified</span>}
          </h1>
          <p className="text-sm text-ink/70">{profile.email}</p>
          <div className="flex gap-3 mt-2 font-mono text-xs">
            <span className="tag bg-gold/20 border-gold">{profile.karma} karma</span>
            {avg !== null && <span className="tag">{avg.toFixed(1)} ★ ({ratings.length})</span>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl font-bold">Profile details</h2>
          <button className="btn-ghost !py-1 !px-3" onClick={() => setEditing((v) => !v)}>{editing ? "Cancel" : "Edit"}</button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <input className="input" placeholder="Year/Semester" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <input className="input" placeholder="Hostel/Block (optional)" value={form.hostelBlock} onChange={(e) => setForm({ ...form, hostelBlock: e.target.value })} />
            <textarea className="input" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="label">Department</dt><dd>{profile.department || "—"}</dd></div>
            <div><dt className="label">Year</dt><dd>{profile.year || "—"}</dd></div>
            <div><dt className="label">Hostel/Block</dt><dd>{profile.hostelBlock || "—"}</dd></div>
            <div><dt className="label">Bio</dt><dd>{profile.bio || "—"}</dd></div>
          </dl>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="font-display text-2xl font-bold mb-3">Ratings received</h2>
        {ratings.length === 0 && <p className="text-sm text-ink/60">No ratings yet.</p>}
        {ratings.map((r) => (
          <div key={r.id} className="border-t border-ink/10 py-2">
            <p className="font-mono text-sm">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</p>
            <p className="text-sm text-ink/70">{r.review}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
