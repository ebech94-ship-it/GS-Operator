"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [locations, setLocations] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = credential.user.uid;

      await setDoc(doc(db, "operatorApplications", uid), {
        uid,

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
        businessRegistrationNumber: businessNumber.trim(),

        status: "pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        const code = (error as { code: string }).code;

        if (code === "auth/email-already-in-use") {
          setError("An account already exists with this email.");
        } else if (code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (code === "auth/weak-password") {
          setError("Please choose a stronger password.");
        } else {
          setError("Unable to submit application. Please try again.");
        }
      } else {
        setError("Unable to submit application. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-[#0B1F3A]">
            Application submitted
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Demande envoyée
          </p>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Thank you for applying to join GodSpeed Mobility. Your operator
            application is now pending review.
          </p>

          <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-4 text-left text-sm text-[#0B1F3A]">
            <p className="font-bold">What happens next?</p>
            <p className="mt-1 leading-6 text-slate-600">
              GodSpeed will review your company information and verification
              details. Once approved, you will be able to access the Operator
              Portal.
            </p>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="mt-7 h-14 w-full rounded-2xl bg-[#1976D2] font-bold text-white transition hover:bg-blue-700"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
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
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-[#0B1F3A] sm:text-3xl">
              Become a GodSpeed Operator
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Devenir opérateur GodSpeed
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Submit your company information to apply for access to the
              GodSpeed Mobility network.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Company */}
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

            {/* Contact */}
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

            {/* Account */}
            <section>
              <SectionTitle
                title="Portal account"
                subtitle="Compte opérateur"
              />

              <div className="mt-4 space-y-5">
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                />

                <PasswordField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                />
              </div>
            </section>

            {/* Notice */}
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              <span className="font-bold text-[#0B1F3A]">
                Important:
              </span>{" "}
              Creating an account does not automatically approve your company.
              Your application must be reviewed by GodSpeed Mobility.
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-2xl bg-[#1976D2] px-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Submitting application..."
                : "Submit Operator Application"}
            </button>

            {/* Login */}
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-bold text-[#1976D2] hover:underline"
              >
                Sign in
              </button>
            </p>
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
      <h3 className="text-lg font-extrabold text-[#0B1F3A]">{title}</h3>
      <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
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

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0B1F3A]">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={6}
          placeholder="••••••••"
          className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 pr-14 text-sm text-[#0B1F3A] outline-none transition focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 flex h-14 w-14 items-center justify-center text-lg text-slate-500 hover:text-[#0B1F3A]"
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}