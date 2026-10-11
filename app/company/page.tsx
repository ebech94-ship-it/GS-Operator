
"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type Company = {
  id: string;
  name?: string;
  displayName?: string;
  logo?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  countryCode?: string;
  registrationNumber?: string;
  operatingLocationIds?: string[];
  verificationStatus?: string;
  active?: boolean;
};

type Location = {
  id: string;
  name: string;
};
async function uploadCompanyLogo(file: File): Promise<string> {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing.");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Company logo must be smaller than 5MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    console.error("Cloudinary upload failed:", result);
    throw new Error(result.error?.message || "Logo upload failed.");
  }

  return result.secure_url as string;
}
export default function CompanyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [contactName, setContactName] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!userSnap.exists()) {
          setMessage("Your operator profile could not be found.");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const operatorId = userData.operatorId;

        setContactName(userData.contactName ?? "");

        if (!operatorId) {
          setMessage("No operator ID is linked to your account.");
          setLoading(false);
          return;
        }

        const operatorSnap = await getDoc(
          doc(db, "operators", operatorId)
        );

        if (!operatorSnap.exists()) {
          setMessage("Your company profile could not be found.");
          setLoading(false);
          return;
        }

        setCompany({
          id: operatorId,
          ...operatorSnap.data(),
        } as Company);

        const locationSnap = await getDocs(
          collection(db, "locations")
        );

        setLocations(
          locationSnap.docs.map((item) => {
            const data = item.data();

            return {
              id: item.id,
              name:
                data.name ??
                data.displayName ??
                data.city ??
                item.id,
            };
          })
        );
      } catch (error) {
        console.error("Company profile loading failed:", error);
        setMessage(
          "Could not load your company profile. Check your access and connection."
        );
      } finally {
        setLoading(false);
      }
    });
  }, []);

  function updateField(
    field: keyof Company,
    value: string | string[]
  ) {
    setCompany((previous) =>
      previous ? { ...previous, [field]: value } : previous
    );
  }

  function toggleLocation(locationId: string) {
    if (!company) return;

    const current = company.operatingLocationIds ?? [];

    updateField(
      "operatingLocationIds",
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId]
    );
  }

 async function saveCompany() {
  if (!user || !company) return;

  setSaving(true);
  setMessage("");

  try {
    let logoUrl = company.logo ?? "";

    if (logoFile) {
      logoUrl = await uploadCompanyLogo(logoFile);
    }

    await updateDoc(doc(db, "operators", company.id), {
      displayName: company.displayName?.trim() ?? "",
      phone: company.phone?.trim() ?? "",
      email: company.email?.trim() ?? "",
      address: company.address?.trim() ?? "",
      logo: logoUrl,
      description: company.description?.trim() ?? "",
      whatsapp: company.whatsapp?.trim() ?? "",
      registrationNumber:
        company.registrationNumber?.trim() ?? "",
      operatingLocationIds: company.operatingLocationIds ?? [],
      updatedAt: serverTimestamp(),
    });

    setCompany({ ...company, logo: logoUrl });
    setLogoFile(null);
    setMessage("Company profile saved successfully.");
  } catch (error) {
    console.error("Company profile save failed:", error);
    setMessage(
      error instanceof Error
        ? error.message
        : "Could not save your company profile."
    );
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <main className="p-8 text-slate-500">
        Loading company profile...
      </main>
    );
  }

  if (!user || !company) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Company Profile
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {message || "Sign in with your operator account to continue."}
        </p>
      </main>
    );
  }

  const selectedLocations = company.operatingLocationIds ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          GodSpeed Mobility
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Company Profile
        </h1>
        <p className="mt-2 text-slate-500">
          Manage your business identity and the information passengers
          will use to recognize and contact your company.
        </p>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {logoFile ? (
              <img
                src={URL.createObjectURL(logoFile)}
                alt="New company logo preview"
                className="h-full w-full object-contain"
              />
            ) : company.logo ? (
              <img
                src={company.logo}
                alt="Company logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-3xl font-bold text-blue-700">
                {(company.displayName || company.name || "G")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {company.displayName || company.name || "Your Company"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Operator ID: {company.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Verification: {company.verificationStatus || "Pending review"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  company.active
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {company.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setLogoFile(file);
              }}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Business identity
        </h2>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Your legal identity should match your official business documents.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Legal company name"
            value={company.name ?? ""}
            disabled
          />
          <Field
            label="Public display name"
            value={company.displayName ?? ""}
            onChange={(value) => updateField("displayName", value)}
          />
          <Field
            label="Business registration number"
            value={company.registrationNumber ?? ""}
            placeholder="Enter official registration number"
            onChange={(value) =>
              updateField("registrationNumber", value)
            }
          />
          <Field
            label="Country code"
            value={company.countryCode ?? "CM"}
            disabled
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Company description
          </label>
          <textarea
            rows={4}
            value={company.description ?? ""}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            placeholder="Tell passengers about your transport company..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Business contacts
        </h2>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Keep these details current so passengers can reach your agency.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Primary contact person"
            value={contactName}
            disabled
          />
          <Field
            label="Business phone"
            value={company.phone ?? ""}
            onChange={(value) => updateField("phone", value)}
          />
          <Field
            label="WhatsApp number"
            value={company.whatsapp ?? ""}
            placeholder="Include country code, e.g. +237..."
            onChange={(value) => updateField("whatsapp", value)}
          />
          <Field
            label="Business email"
            value={company.email ?? ""}
            onChange={(value) => updateField("email", value)}
          />
          <div className="sm:col-span-2">
            <Field
              label="Business address"
              value={company.address ?? ""}
              onChange={(value) => updateField("address", value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Operating locations
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Select the recognized GodSpeed locations where your company
          operates. Actual bookable routes will be managed in Trips.
        </p>

        {locations.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No locations were loaded. Check the locations collection
            and your Firestore permissions.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <label
                key={location.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.id)}
                  onChange={() => toggleLocation(location.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  {location.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Verification and account status are managed by GodSpeed Admin.
        </p>
        <button
          type="button"
          onClick={saveCompany}
          disabled={saving}
          className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving changes..." : "Save company profile"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}