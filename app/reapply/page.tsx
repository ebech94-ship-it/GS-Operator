"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ReapplyPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [locations, setLocations] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadApplication() {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.replace("/login");
          return;
        }

        const snapshot = await getDoc(
          doc(db, "operatorApplications", user.uid)
        );

        if (!snapshot.exists()) {
          setError("Operator application not found.");
          return;
        }

        const data = snapshot.data();

        if (data.status !== "rejected") {
          router.replace("/");
          return;
        }

        setCompanyName(data.companyName ?? "");
        setContactName(data.contactName ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setAddress(data.businessAddress ?? "");
        setLocations(
          Array.isArray(data.operatingLocations)
            ? data.operatingLocations.join(", ")
            : ""
        );
        setVehicleCount(
          data.vehicleCount !== undefined
            ? String(data.vehicleCount)
            : ""
        );
        setBusinessNumber(data.businessRegistrationNumber ?? "");
      } catch (error) {
        console.error("LOAD REAPPLICATION ERROR:", error);
        setError("Unable to load your previous application.");
      } finally {
        setLoadingData(false);
      }
    }

    loadApplication();
  }, [router]);

  async function handleReapply(event: FormEvent) {
    event.preventDefault();

    setError("");

    const user = auth.currentUser;

    if (!user) {
      router.replace("/login");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(
        doc(db, "operatorApplications", user.uid),
        {
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),

          businessAddress: address.trim(),

          operatingLocations: locations
            .split(",")
            .map((location) => location.trim())
            .filter(Boolean),

          vehicleCount: Number(vehicleCount),

          businessRegistrationNumber:
            businessNumber.trim(),

          status: "pending",
          updatedAt: serverTimestamp(),
        }
      );

      setSubmitted(true);
    } catch (error: unknown) {
      console.error("REAPPLICATION ERROR:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        const code = (error as { code: string }).code;

        if (code === "permission-denied") {
          setError(
            "You do not currently have permission to resubmit this application."
          );
        } else {
          setError("Unable to resubmit application. Please try again.");
        }
      } else {
        setError("Unable to resubmit application. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06152B] text-lg font-black text-white">
            GS
          </div>

          <p className="mt-4 text-sm font-bold text-[#0B1F3A]">
            Loading your application...
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-[#0B1F3A]">
            Application resubmitted
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Demande renvoyée
          </p>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Your updated operator application has been sent back to GodSpeed
            Mobility for review.
          </p>

          <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-4 text-left text-sm text-[#0B1F3A]">
            <p className="font-bold">Application status</p>

            <p className="mt-1 leading-6 text-slate-600">
              Your application is now{" "}
              <span className="font-bold text-[#1976D2]">
                Pending Review
              </span>
              .
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-7 h-14 w-full rounded-2xl bg-[#1976D2] font-bold text-white transition hover:bg-blue-700"
          >
            Go to Operator Portal
          </button>
        </div>
      </main>
    );
  }

  if (error && !companyName && !email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-[#0B1F3A]">
            Unable to load application
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => router.push("/login")}
            className="mt-6 h-12 w-full rounded-2xl bg-[#1976D2] font-bold text-white"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-[#06152B] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center">
          <div className="relative h-12 w-20">
            <Image
              src="/bus.png"
              alt="GodSpeed Mobility"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="ml-3">
            <h1 className="text-lg font-extrabold tracking-wide">
              GODSPEED
            </h1>

            <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-200">
              MOBILITY • OPERATOR
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              Application Rejected • Demande rejetée
            </div>

            <h2 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
              Update your application
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Mettre à jour votre demande
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Review your previous information, make any necessary changes,
              and resubmit your operator application.
            </p>
          </div>

          <form onSubmit={handleReapply} className="space-y-8">
            <section>
              <SectionTitle
                title="Company information"
                subtitle="Informations sur l'entreprise"
              />

              <div className="mt-4 space-y-5">
                <Field
                  label="Company / Operator name"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="e.g. GodSpeed Tech"
                  required
                />

                <Field
                  label="Business registration number"
                  value={businessNumber}
                  onChange={setBusinessNumber}
                  placeholder="Registration / RCCM number"
                  required
                />

                <Field
                  label="Business address"
                  value={address}
                  onChange={setAddress}
                  placeholder="City / neighbourhood"
                  required
                />

                <Field
                  label="Operating locations"
                  value={locations}
                  onChange={setLocations}
                  placeholder="e.g. Kumba, Buea, Douala, Yaoundé"
                  required
                />

                <Field
                  label="Number of vehicles"
                  type="number"
                  min="1"
                  value={vehicleCount}
                  onChange={setVehicleCount}
                  placeholder="e.g. 5"
                  required
                />
              </div>
            </section>

            <section>
              <SectionTitle
                title="Primary contact"
                subtitle="Contact principal"
              />

              <div className="mt-4 space-y-5">
                <Field
                  label="Contact person's full name"
                  value={contactName}
                  onChange={setContactName}
                  placeholder="Full legal name"
                  required
                />

                <Field
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+237 6XX XXX XXX"
                  required
                />

                <Field
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="company@example.com"
                  required
                />
              </div>
            </section>

            <div className="rounded-2xl bg-blue-50 px-4 py-4 text-sm leading-6 text-slate-600">
              <span className="font-bold text-[#0B1F3A]">
                Your account is preserved:
              </span>{" "}
              Your existing email and password remain unchanged. Only your
              operator application information will be updated.
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-2xl bg-[#1976D2] px-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Resubmitting application..."
                : "Resubmit Operator Application"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-12 w-full rounded-2xl bg-slate-100 font-bold text-[#0B1F3A]"
            >
              Cancel
            </button>
          </form>
        </div>

        <div className="py-6 text-center">
          <p className="text-xs font-medium text-slate-400">
            Safe journeys. Better connections.
          </p>

          <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400">
            GODSPEED TECHNOLOGIES
          </p>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-extrabold text-[#0B1F3A]">
        {title}
      </h3>

      <p className="mt-1 text-xs font-medium text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  min?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0B1F3A]">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-[#0B1F3A] outline-none transition focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}