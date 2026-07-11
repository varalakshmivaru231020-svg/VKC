"use client";

import { useState } from "react";
import { Phone, Mail, Calendar, Clock } from "lucide-react";

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

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/video-bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Video Shopping Bookings</h1>
      <p className="text-sm text-gray-500 mb-6">Appointment requests from the "Video Shopping" button — call to confirm and share the video-call link.</p>

      <div className="space-y-3">
        {bookings.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No bookings yet.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-gray-900">{b.name}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.phone}</span>
                  {b.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{b.email}</span>}
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
