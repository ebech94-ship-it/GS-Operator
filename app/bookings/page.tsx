"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Booking = {
  id: string;
  bookingReference?: string;
  passengerName?: string;
  passengerPhone?: string;
  operatorId?: string;
  tripId?: string;
  from?: string;
  to?: string;
  date?: string;
  departure?: string;
  arrival?: string;
  passengers?: number;
  seats?: string;
  pricePerPassenger?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingStatus?: string;
  createdAt?: any;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      try {
        const bookingsQuery = query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(bookingsQuery);

        if (cancelled) return;

        const loadedBookings = snapshot.docs.map((bookingDoc) => ({
          id: bookingDoc.id,
          ...bookingDoc.data(),
        })) as Booking[];

        setBookings(loadedBookings);
      } catch (error) {
        console.error("BOOKINGS LOAD ERROR:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(
      (booking) => booking.bookingStatus === "confirmed"
    );

    const paid = bookings.filter(
      (booking) => booking.paymentStatus === "paid"
    );

    const passengers = confirmed.reduce(
      (total, booking) =>
        total + Number(booking.passengers || 0),
      0
    );

    const revenue = paid.reduce(
      (total, booking) =>
        total + Number(booking.totalAmount || 0),
      0
    );

    return {
      total: bookings.length,
      confirmed: confirmed.length,
      passengers,
      revenue,
    };
  }, [bookings]);

  const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number) =>
    Number(amount || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {/* HEADER */}
      <div className="mb-7">
        <h1 className="text-3xl font-black text-[#0B1F3A]">
          Bookings
        </h1>

        <p className="mt-1 text-sm text-[#7B8794]">
          Manage passenger reservations and trip bookings.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={stats.total}
        />

        <StatCard
          label="Confirmed"
          value={stats.confirmed}
        />

        <StatCard
          label="Passengers"
          value={stats.passengers}
        />

        <StatCard
          label="Booking revenue"
          value={`${formatAmount(stats.revenue)} FCFA`}
        />
      </div>

      {/* BOOKINGS */}
      <div className="overflow-hidden rounded-3xl border border-[#E7EBF0] bg-white shadow-sm">
        <div className="border-b border-[#EEF1F4] px-6 py-5">
          <h2 className="text-lg font-black text-[#0B1F3A]">
            Recent bookings
          </h2>

          <p className="mt-1 text-xs text-[#8A96A6]">
            Reservations created through GodSpeed Mobility.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[#8A96A6]">
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FC] text-2xl">
              🎟️
            </div>

            <h3 className="font-bold text-[#0B1F3A]">
              No bookings yet
            </h3>

            <p className="mt-1 text-sm text-[#8A96A6]">
              Passenger bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-[#FAFBFC] text-left text-[11px] font-black uppercase tracking-wider text-[#8A96A6]">
                  <th className="px-6 py-4">
                    Booking
                  </th>

                  <th className="px-6 py-4">
                    Passenger
                  </th>

                  <th className="px-6 py-4">
                    Route
                  </th>

                  <th className="px-6 py-4">
                    Trip
                  </th>

                  <th className="px-6 py-4">
                    Seats
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() =>
                      setSelectedBooking(booking)
                    }
                    className="cursor-pointer border-t border-[#EEF1F4] transition hover:bg-[#F8FAFD]"
                  >
                    <td className="px-6 py-5">
                      <p className="font-black text-[#0B1F3A]">
                        {booking.bookingReference || "—"}
                      </p>

                      <p className="mt-1 text-xs text-[#8A96A6]">
                        {formatDate(booking.date)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-[#26364A]">
                        {booking.passengerName || "Passenger"}
                      </p>

                      <p className="mt-1 text-xs text-[#8A96A6]">
                        {booking.passengerPhone || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-[#26364A]">
                        {booking.from || "—"}
                        {" → "}
                        {booking.to || "—"}
                      </p>

                      <p className="mt-1 text-xs text-[#1976D2]">
                        {booking.departure || "—"}
                        {" – "}
                        {booking.arrival || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[140px] truncate text-xs font-semibold text-[#6F7C8C]">
                        {booking.tripId || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-[#26364A]">
                        {booking.seats || "—"}
                      </p>

                      <p className="mt-1 text-xs text-[#8A96A6]">
                        {booking.passengers || 0} passenger
                        {Number(booking.passengers || 0) === 1
                          ? ""
                          : "s"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-black text-[#0B1F3A]">
                        {formatAmount(
                          booking.totalAmount
                        )}{" "}
                        FCFA
                      </p>

                      <p className="mt-1 text-xs text-[#8A96A6]">
                        {booking.paymentMethod || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge
                        status={
                          booking.bookingStatus ||
                          "pending"
                        }
                      />

                      <p className="mt-2 text-[10px] font-bold uppercase text-[#1E9B55]">
                        {booking.paymentStatus ||
                          "unpaid"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06152B]/50 p-5"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-[#EEF1F4] px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#8A96A6]">
                  Booking reference
                </p>

                <h2 className="mt-1 text-xl font-black text-[#0B1F3A]">
                  {selectedBooking.bookingReference ||
                    "—"}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedBooking(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FA] text-lg font-bold text-[#6F7C8C] hover:bg-[#EEF1F4]"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Detail
                label="Passenger"
                value={
                  selectedBooking.passengerName ||
                  "—"
                }
              />

              <Detail
                label="Phone"
                value={
                  selectedBooking.passengerPhone ||
                  "—"
                }
              />

              <Detail
                label="From"
                value={selectedBooking.from || "—"}
              />

              <Detail
                label="To"
                value={selectedBooking.to || "—"}
              />

              <Detail
                label="Date"
                value={formatDate(selectedBooking.date)}
              />

              <Detail
                label="Departure"
                value={
                  selectedBooking.departure || "—"
                }
              />

              <Detail
                label="Arrival"
                value={
                  selectedBooking.arrival || "—"
                }
              />

              <Detail
                label="Passengers"
                value={String(
                  selectedBooking.passengers || 0
                )}
              />

              <Detail
                label="Seat(s)"
                value={
                  selectedBooking.seats || "—"
                }
              />

              <Detail
                label="Payment method"
                value={
                  selectedBooking.paymentMethod ||
                  "—"
                }
              />

              <Detail
                label="Payment status"
                value={
                  selectedBooking.paymentStatus ||
                  "—"
                }
              />

              <Detail
                label="Booking status"
                value={
                  selectedBooking.bookingStatus ||
                  "—"
                }
              />
            </div>

            <div className="border-t border-[#EEF1F4] bg-[#FAFBFC] px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#6F7C8C]">
                  Total paid
                </span>

                <span className="text-xl font-black text-[#1976D2]">
                  {formatAmount(
                    selectedBooking.totalAmount
                  )}{" "}
                  FCFA
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-[#8A96A6]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#0B1F3A]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const confirmed = status === "confirmed";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        confirmed
          ? "bg-[#EAF8F0] text-[#1E9B55]"
          : "bg-[#FFF4E5] text-[#C77A00]"
      }`}
    >
      {status}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F7F9FB] p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-[#8A96A6]">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-[#26364A]">
        {value}
      </p>
    </div>
  );
}