"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


type Trip = {
  id: string;
  operatorId: string;
  vehicleId: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  date: string;
  occupiedSeats: string[];
};
type Location = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  active?: boolean;
};

const vehicles = [
  { id: "gs-tech-a", name: "GS TECH A" },
];


function LocationModal({
  visible,
  title,
  french,
  selected,
  locations,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  french: string;
  selected: string;
  locations: Location[];
  onClose: () => void;
  onSelect: (city: string) => void;
}) {
  const [search, setSearch] = useState("");

  if (!visible) {
    return null;
  }

  const query = search.trim().toLowerCase();

const filteredLocations = locations.filter((location) => {
  if (!query) return true;

  return (
    location.name.toLowerCase().includes(query) ||
    (location.region ?? "").toLowerCase().includes(query)
  );
});

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-[rgba(5,18,35,0.42)]"
      onClick={onClose}
    >
      <div      
  className="flex max-h-[90vh] w-full flex-col rounded-t-[30px] bg-[#F5F7FA] px-5 pb-7 pt-3 shadow-2xl sm:mx-auto sm:max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HANDLE */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#CBD3DD]" />

        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0B1F3A]">
              {title}
            </h2>

            <p className="mt-1 text-[10px] text-[#7B899A]">
              {french}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7ECF2] text-[#526274] transition hover:bg-[#DDE4EC]"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* TITLE */}
        <p className="mb-3 text-[13px] font-bold text-[#62748A]">
          Choose a city
        </p>

        {/* SEARCH */}
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search city..."
          className="mb-3 h-12 w-full rounded-[14px] border border-[#EDF0F4] bg-white px-4 text-sm text-[#172B4D] outline-none transition focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
        />

        {/* CITY LIST */}
       <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {filteredLocations.map((location) => {
            const isSelected = selected === location.name;

            return (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  onSelect(location.name);
                  setSearch("");
                }}
                className={`mb-2 flex h-[62px] w-full items-center rounded-[17px] border px-3 text-left transition ${
                  isSelected
                    ? "border-[#1976D2] bg-[#E8F1FB]"
                    : "border-[#EDF0F4] bg-white hover:border-[#1976D2]"
                }`}
              >
                {/* ICON */}
                <div className="mr-3 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] bg-[#F0F4F8]">
                  <span>📍</span>
                </div>

                {/* CITY */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold ${
                      isSelected
                        ? "text-[#1976D2]"
                        : "text-[#172B4D]"
                    }`}
                  >
                    {location.name}
                  </p>

                  {location.region && (
                    <p className="mt-0.5 text-[10px] text-[#7B899A]">
                      {location.region}
                    </p>
                  )}
                </div>

                {/* CHECK */}
                {isSelected && (
                  <span className="ml-3 text-xl font-black text-[#1976D2]">
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {filteredLocations.length === 0 && (
            <p className="py-6 text-center text-xs text-[#8A96A6]">
              No matching city found.
            </p>
          )}
        </div>

        {/* FOOTER */}
        <p className="mt-2 text-center text-[10px] text-[#8A96A6]">
          More GodSpeed destinations coming soon.
        </p>
      </div>
    </div>
  );
}


export default function TripsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");

  const [from, setFrom] = useState("Kumba");
  const [to, setTo] = useState("Yaoundé");
  const [date, setDate] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
const [loadingLocations, setLoadingLocations] = useState(true);
const [showFrom, setShowFrom] = useState(false);
const [showTo, setShowTo] = useState(false);

  useEffect(() => {
    let active = true;
async function fetchLocations() {
  try {
    const snapshot = await getDocs(collection(db, "locations"));

    if (!active) return;

   const loadedLocations = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...(doc.data() as Omit<Location, "id">),
})) as Location[];

const activeLocations = loadedLocations.filter(
  (location) => location.active !== false
);

setLocations(activeLocations);

    
  } finally {
    if (active) {
      setLoadingLocations(false);
    }
  }
}

fetchLocations();
    async function fetchTrips() {
      try {
        const snapshot = await getDocs(collection(db, "trips"));

        if (!active) return;

        const loadedTrips = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trip[];

        setTrips(loadedTrips);
      } catch {
        if (active) {
          setError("Unable to load trips.");
        }
      } finally {
        if (active) {
          setLoadingTrips(false);
        }
      }
    }

    fetchTrips();

    return () => {
      active = false;
    };
  }, []);

  async function loadTrips() {
    try {
      const snapshot = await getDocs(collection(db, "trips"));

      const loadedTrips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trip[];

      setTrips(loadedTrips);
    } catch {
      setError("Unable to load trips.");
    }
  }

  async function handleCreateTrip(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (
      !from ||
      !to ||
      !date ||
      !departure ||
      !arrival ||
      !duration ||
      !price
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "trips"), {
        operatorId: "godspeed-tech",
        vehicleId,
        from,
        to,
        departure,
        arrival,
        duration,
        price: Number(price),
        date,
        occupiedSeats: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFrom("Kumba");
      setTo("Yaoundé");
      setDate("");
      setDeparture("");
      setArrival("");
      setVehicleId(vehicles[0].id);
      setDuration("");
      setPrice("");
      setShowForm(false);

      await loadTrips();
    } catch {
      setError("Unable to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#0B1F3A]">
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-[#1976D2]">
              GODSPEED MOBILITY
            </p>

            <h1 className="mt-1 text-2xl font-extrabold">
              Trips
            </h1>

            <p className="text-sm text-slate-500">
              Voyages
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="rounded-xl bg-[#1976D2] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            + New Trip
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-lg sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold">
                Create New Trip
              </h2>

              <p className="text-sm text-slate-500">
                Créer un nouveau voyage
              </p>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-5">
             
            <div className="grid gap-4 sm:grid-cols-2">
  <div>
    <label className="mb-2 block text-sm font-bold">
      From • Départ
    </label>

    <button
      type="button"
      onClick={() => setShowFrom(true)}
      disabled={loadingLocations}
      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-left outline-none transition hover:border-[#1976D2] disabled:opacity-60"
    >
      <span className="font-medium text-[#172B4D]">
        {loadingLocations ? "Loading locations..." : from || "Select departure"}
      </span>
    </button>
  </div>

  <div>
    <label className="mb-2 block text-sm font-bold">
      To • Destination
    </label>

    <button
      type="button"
      onClick={() => setShowTo(true)}
      disabled={loadingLocations}
      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-left outline-none transition hover:border-[#1976D2] disabled:opacity-60"
    >
      <span className="font-medium text-[#172B4D]">
        {loadingLocations ? "Loading locations..." : to || "Select destination"}
      </span>
    </button>
  </div>
</div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Travel Date • Date du voyage
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Departure • Départ
                  </label>

                  <input
                    type="time"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Arrival • Arrivée
                  </label>

                  <input
                    type="time"
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Vehicle • Véhicule
                </label>

                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Duration • Durée
                </label>

                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="6h 30m"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Price • Tarif (FCFA)
                </label>

                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="8000"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 flex-1 rounded-2xl bg-[#1976D2] font-bold text-white disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Trip • Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-14 rounded-2xl bg-slate-100 px-6 font-bold text-[#0B1F3A]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold">
              Your Trips
            </h2>

            <p className="text-xs text-slate-500">
              Vos voyages
            </p>
          </div>

          {loadingTrips ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">
              Loading trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-bold">
                No trips yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first trip to start publishing journeys.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-extrabold">
                        {trip.from} → {trip.to}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {trip.date} • {trip.departure} → {trip.arrival}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Vehicle: {trip.vehicleId} • Duration: {trip.duration}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-extrabold text-[#1976D2]">
                        {trip.price.toLocaleString()} FCFA
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {trip.occupiedSeats.length} seats occupied
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <LocationModal
  visible={showFrom}
  title="Departure"
  french="Point de départ"
  selected={from}
  locations={locations}
  onClose={() => setShowFrom(false)}
  onSelect={(city) => {
    setFrom(city);
    setShowFrom(false);
  }}
/>

<LocationModal
  visible={showTo}
  title="Destination"
  french="Destination"
  selected={to}
  locations={locations}
  onClose={() => setShowTo(false)}
  onSelect={(city) => {
    setTo(city);
    setShowTo(false);
  }}
/>
    </main>
  );
}