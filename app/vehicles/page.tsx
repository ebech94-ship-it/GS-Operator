"use client";

import { useState } from "react";

type Seat = {
  id: string;
  row: number;
  position: "left" | "right" | "rear";
  column: number;
};

type Vehicle = {
  id: string;
  operatorId: string;
  name: string;
  image: string;
  plateNumber?: string;
  vehicleType?: string;
  capacity: number;
  seatLayout: Seat[];
  amenities?: string[];
  active?: boolean;
};

const GS_TECH_A_SEATS: Seat[] = [
  { id: "A1", row: 0, position: "right", column: 0 },
  { id: "A2", row: 0, position: "right", column: 1 },
  { id: "A3", row: 1, position: "left", column: 0 },
  { id: "A4", row: 1, position: "left", column: 1 },
  { id: "A5", row: 1, position: "left", column: 2 },
  { id: "A6", row: 1, position: "right", column: 0 },
  { id: "A7", row: 1, position: "right", column: 1 },
];

const VEHICLES: Vehicle[] = [
  {
    id: "gs-tech-a",
    operatorId: "godspeed-tech",
    name: "GS TECH A",
    image: "",
    vehicleType: "Coach Bus",
    capacity: 70,
    seatLayout: GS_TECH_A_SEATS,
    amenities: ["Air Conditioning", "Comfortable Seats"],
    active: true,
  },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(VEHICLES);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Coach Bus");
  const [capacity, setCapacity] = useState("70");

  function addVehicle() {
    if (!name.trim() || !capacity.trim()) return;

    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      operatorId: "godspeed-tech",
      name: name.trim(),
      image: "",
      plateNumber: plateNumber.trim(),
      vehicleType,
      capacity: Number(capacity),
      seatLayout: [],
      amenities: [],
      active: true,
    };

    setVehicles((current) => [...current, newVehicle]);

    setName("");
    setPlateNumber("");
    setVehicleType("Coach Bus");
    setCapacity("70");
    setShowForm(false);
  }

  function toggleVehicle(id: string) {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === id
          ? { ...vehicle, active: !vehicle.active }
          : vehicle
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F6FB] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2]">
              GODSPEED MOBILITY
            </p>

            <h1 className="mt-1 text-2xl font-extrabold text-[#06152B] sm:text-3xl">
              Vehicles
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your fleet
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-[#0B1F3A] px-4 py-3 text-sm font-bold text-white shadow-lg transition active:scale-95"
          >
            + Vehicle
          </button>
        </div>

        {/* ADD VEHICLE */}
        {showForm && (
          <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#06152B]">
              Add New Vehicle
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Ajouter un véhicule
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vehicle name"
                className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
              />

              <input
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="Plate number"
                className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
              />

              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
              >
                <option>Coach Bus</option>
                <option>Minibus</option>
                <option>Van</option>
                <option>Car</option>
              </select>

              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Capacity"
                className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={addVehicle}
                className="flex-1 rounded-2xl bg-[#1976D2] py-3.5 text-sm font-bold text-white"
              >
                Save Vehicle
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* VEHICLES */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="overflow-hidden rounded-3xl border border-blue-50 bg-white shadow-sm"
            >
              {/* TOP */}
              <div className="bg-[#06152B] px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold">
                      {vehicle.name}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-blue-200">
                      {vehicle.vehicleType}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      vehicle.active
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {vehicle.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F5F8FC] p-4">
                    <p className="text-[11px] font-semibold text-slate-400">
                      Capacity
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                      {vehicle.capacity}
                    </p>
                    <p className="text-[11px] text-slate-400">seats</p>
                  </div>

                  <div className="rounded-2xl bg-[#F5F8FC] p-4">
                    <p className="text-[11px] font-semibold text-slate-400">
                      Seats
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                      {vehicle.seatLayout.length}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      configured
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Plate Number
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0B1F3A]">
                    {vehicle.plateNumber || "Not assigned"}
                  </p>
                </div>

                {vehicle.amenities &&
                  vehicle.amenities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vehicle.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-[#1976D2]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                <button
                  onClick={() => toggleVehicle(vehicle.id)}
                  className="mt-5 w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-[#0B1F3A] transition active:scale-[0.98]"
                >
                  {vehicle.active
                    ? "Deactivate Vehicle"
                    : "Activate Vehicle"}
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}