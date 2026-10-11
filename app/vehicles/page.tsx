
"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { db } from "@/lib/firebase";

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
async function uploadVehicleImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Vehicle image must be smaller than 5MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

 const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

let response: Response;

try {
  response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      signal: controller.signal,
    }
  );
} catch (error) {
  if (error instanceof Error && error.name === "AbortError") {
    throw new Error("Image upload timed out. Please try again.");
  }
  throw new Error("Could not connect to Cloudinary. Check your internet.");
} finally {
  clearTimeout(timeout);
}

const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result.error?.message || "Vehicle image upload failed."
    );
  }

  return result.secure_url as string;
}
export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [operatorId, setOperatorId] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Coach Bus");
  const [capacity, setCapacity] = useState("70");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

 useEffect(() => {
  let cancelled = false;

  const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
    if (!user) {
      if (!cancelled) {
        setVehicles([]);
        setLoading(false);
        console.error("No signed-in user found.");
      }
      return;
    }

    try {
      const userSnapshot = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!userSnapshot.exists()) {
        throw new Error("Your user profile was not found.");
      }

      const profile = userSnapshot.data();
      const actualOperatorId = profile.operatorId;

      if (
        !actualOperatorId ||
        !["operator_admin", "operator_staff"].includes(profile.role)
      ) {
        throw new Error(
          "Your account is not linked to an operator."
        );
      }

      const snapshot = await getDocs(
        query(
          collection(db, "vehicles"),
          where("operatorId", "==", actualOperatorId)
        )
      );

      if (cancelled) return;

      setOperatorId(actualOperatorId);

      setVehicles(
        snapshot.docs.map((vehicleDoc) => ({
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
        })) as Vehicle[]
      );
    } catch (error) {
      if (!cancelled) {
        console.error("VEHICLES LOAD ERROR:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Could not load your vehicles."
        );
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  });

  return () => {
    cancelled = true;
    unsubscribe();
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

  if (!operatorId) {
    alert("Your account is not linked to an operator.");
    return;
  }

  if (!cleanName) {
    alert("Enter a vehicle name.");
    return;
  }

  if (!Number.isInteger(seatCapacity) || seatCapacity < 1 || seatCapacity > 100) {
    alert("Enter a valid capacity between 1 and 100.");
    return;
  }

  try {
    setSaving(true);

    let imageUrl = "";

    if (imageFile) {
      imageUrl = await uploadVehicleImage(imageFile);
    }

    const seatLayout = createSeatLayout(seatCapacity);

    await addDoc(collection(db, "vehicles"), {
      operatorId,
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

    const snapshot = await getDocs(
      query(
        collection(db, "vehicles"),
        where("operatorId", "==", operatorId)
      )
    );

    setVehicles(
      snapshot.docs.map((vehicleDoc) => ({
        id: vehicleDoc.id,
        ...vehicleDoc.data(),
      })) as Vehicle[]
    );

    alert("Vehicle saved successfully.");
  } catch (error) {
    console.error("ADD VEHICLE ERROR:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Could not save vehicle."
    );
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

     
        {/* VEHICLES — RESPONSIVE LANDSCAPE CARDS */}
        {!loading && vehicles.length > 0 && (
          <section className="space-y-4">
            {/* Fleet summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5">
              <div>
                <h2 className="text-base font-extrabold text-[#0B1F3A]">
                  Your Fleet
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Manage your registered vehicles
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-right">
                <p className="text-xl font-extrabold text-[#1976D2]">
                  {vehicles.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Vehicles
                </p>
              </div>
            </div>

            {/* Landscape vehicle list */}
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <article
                  key={vehicle.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Vehicle photo */}
                    <div className="relative h-48 shrink-0 overflow-hidden bg-[#EAF0F8] sm:h-auto sm:min-h-[210px] sm:w-[34%] sm:max-w-[290px]">
                      {vehicle.image ? (
                        <img
                          src={vehicle.image}
                          alt={vehicle.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[190px] flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#194B7A] text-white">
                          <span className="text-5xl">🚌</span>
                          <p className="mt-3 text-xs font-medium text-blue-100">
                            No vehicle photo
                          </p>
                        </div>
                      )}

                      {/* Status on photo */}
                      <span
                        className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold shadow-sm backdrop-blur-sm ${
                          vehicle.active
                            ? "bg-white/95 text-emerald-700"
                            : "bg-slate-900/80 text-white"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            vehicle.active
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {vehicle.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    {/* Vehicle information */}
                    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 lg:p-6">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1976D2]">
                            {vehicle.vehicleType || "Vehicle"}
                          </p>

                          <h3 className="mt-1 break-words text-xl font-extrabold text-[#0B1F3A] sm:text-2xl">
                            {vehicle.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Registration details
                          </p>
                        </div>

                        <div className="hidden shrink-0 rounded-2xl bg-[#F3F7FC] p-3 sm:block">
                          <span className="text-2xl">🚌</span>
                        </div>
                      </div>

                      {/* Information panels */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-[#F7F9FC] p-3 sm:p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Seat capacity
                          </p>
                          <p className="mt-1 text-xl font-extrabold text-[#0B1F3A]">
                            {vehicle.capacity}
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              seats
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-[#F7F9FC] p-3 sm:p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Seat layout
                          </p>
                          <p className="mt-1 text-xl font-extrabold text-[#0B1F3A]">
                            {vehicle.seatLayout?.length || 0}
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              seats set
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Plate number */}
                      <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 sm:px-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1976D2]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="6"
                              width="18"
                              height="12"
                              rx="2"
                            />
                            <path d="M7 10h10M7 14h6" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Plate number
                          </p>
                          <p className="mt-1 break-words text-sm font-bold text-[#0B1F3A]">
                            {vehicle.plateNumber || "Not assigned"}
                          </p>
                        </div>
                      </div>

                      {/* Amenities */}
                      {vehicle.amenities &&
                        vehicle.amenities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
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

                      {/* Action */}
                      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          {vehicle.active
                            ? "This vehicle is available for assignment."
                            : "This vehicle is currently inactive."}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleVehicle(vehicle)}
                          className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] sm:w-auto sm:min-w-[170px] ${
                            vehicle.active
                              ? "border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-[#1976D2] text-white shadow-sm hover:bg-[#1565C0]"
                          }`}
                        >
                          {vehicle.active
                            ? "Deactivate Vehicle"
                            : "Activate Vehicle"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}