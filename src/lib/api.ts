export interface User {
  id: number;
  email: string;
  name: string;
  department: string;
  year: string;
  hostelBlock: string;
  photoKey?: string | null;
  bio: string;
  verified: boolean;
  role: string;
  karma: number;
}

export interface Listing {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  exchangeModes: string[];
  karmaValue: number;
  price: number | null;
  photoKeys: string[];
  expiryDate: string | null;
  status: string;
  subjectCode: string | null;
  upvotes: number;
  views: number;
  createdAt: string;
}

async function request(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (email: string, password: string, name: string) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  verifyOtp: (email: string, code: string) =>
    request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, code }) }),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/me"),
  updateProfile: (fields: Record<string, string>) =>
    request("/profile", { method: "PUT", body: JSON.stringify(fields) }),
  upload: (fileBase64: string, contentType: string, kind: "listing" | "profile") =>
    request("/upload", { method: "POST", body: JSON.stringify({ fileBase64, contentType, kind }) }),
  listListings: (params: Record<string, string> = {}) =>
    request(`/listings?${new URLSearchParams(params).toString()}`),
  getListing: (id: number) => request(`/listings?id=${id}`),
  createListing: (fields: Record<string, unknown>) =>
    request("/listings", { method: "POST", body: JSON.stringify(fields) }),
  updateListing: (id: number, fields: Record<string, unknown>) =>
    request(`/listings?id=${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
  deleteListing: (id: number) => request(`/listings?id=${id}`, { method: "DELETE" }),
  upvoteListing: (listingId: number) =>
    request("/listings/upvote", { method: "POST", body: JSON.stringify({ listingId }) }),
  listExchanges: () => request("/exchanges"),
  requestExchange: (listingId: number) =>
    request("/exchanges", { method: "POST", body: JSON.stringify({ listingId }) }),
  exchangeAction: (id: number, action: string) =>
    request(`/exchanges?id=${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  threads: () => request("/messages/threads"),
  getMessages: (listingId: number, withUserId: number) =>
    request(`/messages?listingId=${listingId}&withUserId=${withUserId}`),
  sendMessage: (listingId: number, recipientId: number, body: string) =>
    request("/messages", { method: "POST", body: JSON.stringify({ listingId, recipientId, body }) }),
  rate: (exchangeId: number, stars: number, review: string) =>
    request("/ratings", { method: "POST", body: JSON.stringify({ exchangeId, stars, review }) }),
  getRatings: (userId: number) => request(`/ratings?userId=${userId}`),
  report: (targetType: string, targetId: number, reason: string) =>
    request("/reports", { method: "POST", body: JSON.stringify({ targetType, targetId, reason }) }),
  adminReports: () => request("/reports"),
  updateReport: (id: number, status: string) =>
    request(`/reports?id=${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adminDomains: () => request("/admin?resource=domains"),
  addDomain: (domain: string) =>
    request("/admin?resource=domains", { method: "POST", body: JSON.stringify({ domain }) }),
  removeDomain: (id: number) => request(`/admin?resource=domains&id=${id}`, { method: "DELETE" }),
  adminUsers: () => request("/admin?resource=users"),
  setUserRole: (id: number, role: string) =>
    request(`/admin?resource=users&id=${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminListings: () => request("/admin?resource=listings"),
  adminDeleteListing: (id: number) => request(`/admin?resource=listings&id=${id}`, { method: "DELETE" }),
  leaderboard: (groupBy: string, windowDays = 30) =>
    request(`/leaderboard?groupBy=${groupBy}&windowDays=${windowDays}`),
  dashboard: () => request("/dashboard"),
  skillSlots: (listingId: number) => request(`/skill-slots?listingId=${listingId}`),
  createSlot: (listingId: number, startsAt: string, durationMinutes: number) =>
    request("/skill-slots", { method: "POST", body: JSON.stringify({ listingId, startsAt, durationMinutes }) }),
  bookSlot: (id: number) => request(`/skill-slots?id=${id}`, { method: "PATCH", body: "{}" }),
};

export function mediaUrl(key?: string | null): string | null {
  if (!key) return null;
  return `/api/media?key=${encodeURIComponent(key)}`;
}
