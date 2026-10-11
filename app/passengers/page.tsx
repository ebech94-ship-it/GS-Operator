"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Booking = {
  id: string;
  passengerId?: string;
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
  totalAmount?: number;
  paymentStatus?: string;
  bookingStatus?: string;
 createdAt?: Timestamp | Date | string | number;
};

type Passenger = {
  id: string;
  name: string;
  phone: string;
  bookings: number;
  trips: number;
  totalSpent: number;
  lastTrip?: Booking;
};

function getTimestampValue(
  value?: Timestamp | Date | string | number
): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function PassengersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassenger, setSelectedPassenger] =
    useState<Passenger | null>(null);
  const [search, setSearch] = useState("");

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

        const loadedBookings = snapshot.docs.map(
          (bookingDoc) => ({
            id: bookingDoc.id,
            ...bookingDoc.data(),
          })
        ) as Booking[];

        setBookings(loadedBookings);
      } catch (error) {
        console.error(
          "PASSENGERS LOAD ERROR:",
          error
        );
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

  const passengers = useMemo(() => {
    const passengerMap = new Map<
      string,
      Passenger
    >();

    bookings.forEach((booking) => {
      const passengerId =
        booking.passengerId ||
        booking.passengerPhone ||
        booking.passengerName ||
        booking.id;

      const existing =
        passengerMap.get(passengerId);

      if (!existing) {
        passengerMap.set(passengerId, {
          id: passengerId,
          name:
            booking.passengerName ||
            "Passenger",
          phone:
            booking.passengerPhone ||
            "—",
          bookings: 1,
          trips: Number(
            booking.passengers || 1
          ),
          totalSpent:
            Number(booking.totalAmount || 0),
          lastTrip: booking,
        });
      } else {
        existing.bookings += 1;

        existing.trips += Number(
          booking.passengers || 1
        );

        existing.totalSpent += Number(
          booking.totalAmount || 0
        );

        
if (
  !existing.lastTrip ||
  getTimestampValue(booking.createdAt) >
    getTimestampValue(existing.lastTrip.createdAt)
) {
  existing.lastTrip = booking;
}

      }
    });

    return Array.from(passengerMap.values());
  }, [bookings]);

  const filteredPassengers = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) return passengers;

    return passengers.filter(
      (passenger) =>
        passenger.name
          .toLowerCase()
          .includes(value) ||
        passenger.phone
          .toLowerCase()
          .includes(value)
    );
  }, [passengers, search]);

  const totalPassengers = passengers.length;

  const totalBookings = passengers.reduce(
    (sum, passenger) =>
      sum + passenger.bookings,
    0
  );

  const totalTrips = passengers.reduce(
    (sum, passenger) =>
      sum + passenger.trips,
    0
  );

  const totalRevenue = passengers.reduce(
    (sum, passenger) =>
      sum + passenger.totalSpent,
    0
  );

  const formatAmount = (amount: number) =>
    amount.toLocaleString("en-US");

  const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {/* HEADER */}
      <div className="mb-7">
        <h1 className="text-3xl font-black text-[#0B1F3A]">
          Passengers
        </h1>

        <p className="mt-1 text-sm text-[#7B8794]">
          View passengers who have booked trips with
          your agency.
        </p>
      </div>

      {/* STATS */}
      <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Passengers"
          value={totalPassengers}
        />

        <StatCard
          label="Bookings"
          value={totalBookings}
        />

        <StatCard
          label="Passenger trips"
          value={totalTrips}
        />

        <StatCard
          label="Passenger revenue"
          value={`${formatAmount(
            totalRevenue
          )} FCFA`}
        />
      </div>

      {/* SEARCH */}
      <div className="mb-5 rounded-3xl border border-[#E7EBF0] bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search passenger name or phone..."
            className="w-full rounded-2xl border border-[#E1E6EC] bg-[#F8FAFC] px-5 py-3.5 text-sm font-medium text-[#26364A] outline-none transition focus:border-[#1976D2] focus:bg-white"
          />
        </div>
      </div>

      {/* PASSENGERS */}
      <div className="overflow-hidden rounded-3xl border border-[#E7EBF0] bg-white shadow-sm">
        <div className="border-b border-[#EEF1F4] px-6 py-5">
          <h2 className="text-lg font-black text-[#0B1F3A]">
            Passenger directory
          </h2>

          <p className="mt-1 text-xs text-[#8A96A6]">
            Passenger information is derived from
            confirmed booking activity.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[#8A96A6]">
            Loading passengers...
          </div>
        ) : filteredPassengers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FC] text-2xl">
              👥
            </div>

            <h3 className="font-bold text-[#0B1F3A]">
              {search
                ? "No passengers found"
                : "No passengers yet"}
            </h3>

            <p className="mt-1 text-sm text-[#8A96A6]">
              {search
                ? "Try another name or phone number."
                : "Passengers will appear here after they make bookings."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#FAFBFC] text-left text-[11px] font-black uppercase tracking-wider text-[#8A96A6]">
                  <th className="px-6 py-4">
                    Passenger
                  </th>

                  <th className="px-6 py-4">
                    Phone
                  </th>

                  <th className="px-6 py-4">
                    Bookings
                  </th>

                  <th className="px-6 py-4">
                    Trips
                  </th>

                  <th className="px-6 py-4">
                    Last route
                  </th>

                  <th className="px-6 py-4">
                    Spent
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPassengers.map(
                  (passenger) => (
                    <tr
                      key={passenger.id}
                      onClick={() =>
                        setSelectedPassenger(
                          passenger
                        )
                      }
                      className="cursor-pointer border-t border-[#EEF1F4] transition hover:bg-[#F8FAFD]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF2FB] text-sm font-black text-[#1976D2]">
                            {passenger.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-[#26364A]">
                              {passenger.name}
                            </p>

                            <p className="mt-1 text-[10px] text-[#8A96A6]">
                              Passenger
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-[#526173]">
                        {passenger.phone}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-[#EEF5FC] px-3 py-1 text-xs font-black text-[#1976D2]">
                          {passenger.bookings}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-[#26364A]">
                        {passenger.trips}
                      </td>

                      <td className="px-6 py-5">
                        {passenger.lastTrip ? (
                          <>
                            <p className="font-bold text-[#26364A]">
                              {passenger.lastTrip.from ||
                                "—"}
                              {" → "}
                              {passenger.lastTrip.to ||
                                "—"}
                            </p>

                            <p className="mt-1 text-xs text-[#1976D2]">
                              {formatDate(
                                passenger.lastTrip.date
                              )}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black text-[#0B1F3A]">
                          {formatAmount(
                            passenger.totalSpent
                          )}{" "}
                          FCFA
                        </p>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PASSENGER DETAIL */}
      {selectedPassenger && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#06152B]/50 p-5"
          onClick={() =>
            setSelectedPassenger(null)
          }
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-[#EEF1F4] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2FB] font-black text-[#1976D2]">
                  {selectedPassenger.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#0B1F3A]">
                    {selectedPassenger.name}
                  </h2>

                  <p className="text-xs text-[#8A96A6]">
                    {selectedPassenger.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedPassenger(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FA] text-lg font-bold text-[#6F7C8C] hover:bg-[#EEF1F4]"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <Detail
                label="Bookings"
                value={String(
                  selectedPassenger.bookings
                )}
              />

              <Detail
                label="Trips"
                value={String(
                  selectedPassenger.trips
                )}
              />

              <Detail
                label="Total spent"
                value={`${formatAmount(
                  selectedPassenger.totalSpent
                )} FCFA`}
              />
            </div>

            {selectedPassenger.lastTrip && (
              <div className="mx-6 mb-6 rounded-2xl bg-[#F7F9FB] p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8A96A6]">
                  Latest booking
                </p>

                <p className="mt-2 font-black text-[#0B1F3A]">
                  {selectedPassenger.lastTrip.from ||
                    "—"}
                  {" → "}
                  {selectedPassenger.lastTrip.to ||
                    "—"}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MiniDetail
                    label="Date"
                    value={formatDate(
                      selectedPassenger.lastTrip.date
                    )}
                  />

                  <MiniDetail
                    label="Departure"
                    value={
                      selectedPassenger.lastTrip
                        .departure || "—"
                    }
                  />

                  <MiniDetail
                    label="Seats"
                    value={
                      selectedPassenger.lastTrip
                        .seats || "—"
                    }
                  />
                </div>
              </div>
            )}
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

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase text-[#8A96A6]">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-[#26364A]">
        {value}
      </p>
    </div>
  );
}