"use client";

import { useMemo, useState } from "react";
import { Phone, Mail, Calendar, Clock, Search } from "lucide-react";

interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: string;
  preferredTime: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#C47A2B", CONFIRMED: "#2E6B47", COMPLETED: "#4B5563", CANCELLED: "#C42B2B",
};

export default function VideoBookingsClient({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [search, setSearch] = useState("");

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/video-bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => b.name.toLowerCase().includes(q) || b.phone.toLowerCase().includes(q));
  }, [bookings, search]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Video Shopping Bookings
        <span className="text-base font-normal text-gray-400 ml-2">({filtered.length})</span>
      </h1>
      <p className="text-sm text-gray-500 mb-4">Appointment requests from the "Video Shopping" button — call to confirm and share the video-call link.</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile number..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">
            {bookings.length === 0 ? "No bookings yet." : "No bookings match your search."}
          </p>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-gray-900">{b.name}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:text-gray-700"><Phone className="h-3 w-3" />{b.phone}</a>
                  {b.email && <a href={`mailto:${b.email}`} className="flex items-center gap-1 hover:text-gray-700"><Mail className="h-3 w-3" />{b.email}</a>}
                </div>
              </div>
              <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}
                className="text-xs font-semibold rounded-full px-3 py-1.5 border-0"
                style={{ background: `${STATUS_COLORS[b.status]}1A`, color: STATUS_COLORS[b.status] }}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(b.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.preferredTime}</span>
            </div>
            {b.notes && <p className="text-xs text-gray-500 italic">"{b.notes}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
