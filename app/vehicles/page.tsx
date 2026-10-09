"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

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

function createSeatLayout(capacity: number): Seat[] {
  const seats: Seat[] = [];

  for (let index = 0; index < capacity; index++) {
    const row = Math.floor(index / 4);
    const position =
      index >= capacity - (capacity % 4 || 4)
        ? "rear"
        : index % 4 < 2
        ? "left"
        : "right";

    const column = index % 2;

    seats.push({
      id: `A${index + 1}`,
      row,
      position,
      column,
    });
  }

  return seats;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Coach Bus");
  const [capacity, setCapacity] = useState("70");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  async function loadVehicles() {
    try {
      const snapshot = await getDocs(collection(db, "vehicles"));

      const loadedVehicles = snapshot.docs.map((vehicleDoc) => ({
        id: vehicleDoc.id,
        ...vehicleDoc.data(),
      })) as Vehicle[];

      setVehicles(loadedVehicles);
    } catch (error) {
      console.error("VEHICLES LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

   useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      try {
        const snapshot = await getDocs(collection(db, "vehicles"));

        if (cancelled) return;

        const loadedVehicles = snapshot.docs.map((vehicleDoc) => ({
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
        })) as Vehicle[];

        setVehicles(loadedVehicles);
      } catch (error) {
        if (!cancelled) {
          console.error("VEHICLES LOAD ERROR:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function addVehicle() {
    const cleanName = name.trim();
    const cleanPlate = plateNumber.trim();
    const seatCapacity = Number(capacity);

    if (!cleanName) {
      alert("Enter a vehicle name.");
      return;
    }

    if (!seatCapacity || seatCapacity < 1) {
      alert("Enter a valid vehicle capacity.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = "";

      if (imageFile) {
        const safeFileName = imageFile.name.replace(
          /[^a-zA-Z0-9.-]/g,
          "-"
        );

        const imageRef = ref(
          storage,
          `vehicles/${Date.now()}-${safeFileName}`
        );

        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const seatLayout = createSeatLayout(seatCapacity);

      await addDoc(collection(db, "vehicles"), {
        operatorId: "godspeed-tech",
        name: cleanName,
        image: imageUrl,
        plateNumber: cleanPlate,
        vehicleType,
        capacity: seatCapacity,
        seatLayout,
        amenities: [],
        active: true,
      });

      setName("");
      setPlateNumber("");
      setVehicleType("Coach Bus");
      setCapacity("70");
      setImageFile(null);
      setImagePreview("");
      setShowForm(false);

      await loadVehicles();
    } catch (error) {
      console.error("ADD VEHICLE ERROR:", error);
      alert("Could not save vehicle. Check Firebase permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVehicle(vehicle: Vehicle) {
    try {
      const nextActive = !vehicle.active;

      await updateDoc(doc(db, "vehicles", vehicle.id), {
        active: nextActive,
      });

      setVehicles((current) =>
        current.map((item) =>
          item.id === vehicle.id
            ? { ...item, active: nextActive }
            : item
        )
      );
    } catch (error) {
      console.error("VEHICLE STATUS ERROR:", error);
      alert("Could not update vehicle status.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F6FB] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2]">
              GODSPEED MOBILITY
            </p>

            <h1 className="mt-1 text-2xl font-extrabold text-[#06152B] sm:text-3xl">
              Vehicles
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your fleet and seating configuration
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
          <section className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="bg-[#06152B] px-5 py-5 text-white">
              <p className="text-xs font-bold tracking-[0.16em] text-blue-200">
                FLEET MANAGEMENT
              </p>

              <h2 className="mt-1 text-xl font-extrabold">
                Add New Vehicle
              </h2>

              <p className="mt-1 text-xs text-blue-200">
                Ajouter un véhicule
              </p>
            </div>

            <div className="p-5">
              {/* IMAGE */}
              <div className="mb-5">
                <p className="mb-2 text-sm font-bold text-[#0B1F3A]">
                  Vehicle Image
                </p>

                {imagePreview ? (
                  <div className="mb-3 overflow-hidden rounded-3xl border border-slate-100">
                    <img
                      src={imagePreview}
                      alt="Vehicle preview"
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-44 items-center justify-center rounded-3xl bg-[#F5F8FC] text-sm font-semibold text-slate-400">
                    Vehicle photo preview
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-4 text-sm font-bold text-[#1976D2] transition hover:bg-blue-50">
                  Choose Vehicle Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-[11px] text-slate-400">
                  Recommended: clear photo of the actual vehicle. Maximum 5MB.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Vehicle Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Example: GS TECH A"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Plate Number
                  </label>

                  <input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Example: LT 1234 AB"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm uppercase outline-none focus:border-[#1976D2]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Vehicle Type
                  </label>

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
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    Seat Capacity
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Example: 70"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-[#F8FAFD] px-4 text-sm outline-none focus:border-[#1976D2]"
                  />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Seat layout will automatically match this capacity.
                  </p>
                </div>
              </div>

              {/* PREVIEW */}
              {Number(capacity) > 0 && (
                <div className="mt-5 rounded-2xl bg-[#F5F8FC] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        SEAT CONFIGURATION
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                        {Number(capacity)} seats
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400">
                        GENERATED
                      </p>

                      <p className="text-sm font-extrabold text-[#1976D2]">
                        A1 → A{Number(capacity)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={addVehicle}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-[#1976D2] py-3.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Saving Vehicle..." : "Save Vehicle"}
                </button>

                <button
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Loading fleet...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && vehicles.length === 0 && (
          <div className="rounded-3xl border border-blue-50 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-2xl">
              🚌
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-[#0B1F3A]">
              No vehicles yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add your first vehicle to start assigning buses to trips.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-2xl bg-[#1976D2] px-5 py-3 text-sm font-bold text-white"
            >
              Add First Vehicle
            </button>
          </div>
        )}

        {/* VEHICLES */}
        {!loading && vehicles.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="overflow-hidden rounded-3xl border border-blue-50 bg-white shadow-sm"
              >
                {/* VEHICLE IMAGE */}
                {vehicle.image ? (
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-[#06152B]">
                    <div className="text-center">
                      <div className="text-5xl">🚌</div>
                      <p className="mt-2 text-xs font-semibold text-blue-200">
                        No vehicle image
                      </p>
                    </div>
                  </div>
                )}

                {/* HEADER */}
                <div className="bg-[#06152B] px-5 py-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold">
                        {vehicle.name}
                      </h2>

                      <p className="mt-1 text-xs font-medium text-blue-200">
                        {vehicle.vehicleType || "Vehicle"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
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

                      <p className="text-[11px] text-slate-400">
                        seats
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F5F8FC] p-4">
                      <p className="text-[11px] font-semibold text-slate-400">
                        Layout
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                        {vehicle.seatLayout?.length || 0}
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
                    onClick={() => toggleVehicle(vehicle)}
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
        )}
      </div>
    </main>
  );
}