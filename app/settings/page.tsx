
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Preferences = {
  emailNotifications: boolean;
  bookingNotifications: boolean;
  paymentNotifications: boolean;
  language: "en" | "fr";
  currency: "XAF";
};

const DEFAULT_PREFERENCES: Preferences = {
  emailNotifications: true,
  bookingNotifications: true,
  paymentNotifications: true,
  language: "en",
  currency: "XAF",
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [operatorId, setOperatorId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

const router = useRouter();  

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (userSnap.exists()) {
          const data = userSnap.data();
          setOperatorId(data.operatorId ?? "");
          setCompanyName(data.companyName ?? "");
        }

        const preferenceSnap = await getDoc(
          doc(db, "users", currentUser.uid, "private", "preferences")
        );

        if (preferenceSnap.exists()) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...preferenceSnap.data(),
          } as Preferences);
        }
      } catch (error) {
        console.error("Settings loading failed:", error);
        setMessage("Could not load settings. Check your Firebase permissions.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPreferences((previous) => ({ ...previous, [key]: value }));
  }

  async function savePreferences() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "users", user.uid, "private", "preferences"),
        {
          ...preferences,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Your preferences have been saved.");
    } catch (error) {
      console.error("Saving preferences failed:", error);
      setMessage("Could not save preferences. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!user || !newPassword) {
      setMessage("Enter your new password first.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setMessage("Password updated successfully.");
    } catch (error) {
      console.error("Password update failed:", error);
      setMessage(
        "Password update failed. For security, sign in again and retry if your session has expired."
      );
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
     router.push("/login");
    } catch (error) {
      console.error("Sign-out failed:", error);
      setMessage("Could not sign out. Please try again.");
    }
  }

  if (loading) {
    return <main className="p-8 text-slate-500">Loading settings...</main>;
  }

  if (!user) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-3 text-sm text-slate-500">
          Sign in with your operator account to manage settings.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-7 p-4 sm:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          GodSpeed Mobility
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-500">
          Manage your account preferences, notifications, and security.
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
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700">
            <span aria-hidden="true">👤</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">
              Account information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your operator account details.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Info label="Company" value={companyName || "Not provided"} />
          <Info label="Account email" value={user.email || "Not provided"} />
          <Info label="Operator ID" value={operatorId || "Not linked"} />
          <Info
            label="Email verified"
            value={user.emailVerified ? "Verified" : "Not verified"}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Choose which notification preferences you want to keep enabled.
          Actual delivery requires notification services to be connected.
        </p>

        <div className="divide-y divide-slate-100">
          <Toggle
            title="Email notifications"
            description="Receive account updates by email."
            checked={preferences.emailNotifications}
            onChange={(value) =>
              updatePreference("emailNotifications", value)
            }
          />
          <Toggle
            title="Booking alerts"
            description="Receive alerts about new and updated bookings."
            checked={preferences.bookingNotifications}
            onChange={(value) =>
              updatePreference("bookingNotifications", value)
            }
          />
          <Toggle
            title="Payment alerts"
            description="Keep payment-related alerts enabled."
            checked={preferences.paymentNotifications}
            onChange={(value) =>
              updatePreference("paymentNotifications", value)
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Language & regional preferences
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Configure your preferred dashboard language and currency.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Dashboard language
            </label>
            <select
              value={preferences.language}
              onChange={(event) =>
                updatePreference(
                  "language",
                  event.target.value as Preferences["language"]
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Currency
            </label>
            <select
              value={preferences.currency}
              onChange={(event) =>
                updatePreference(
                  "currency",
                  event.target.value as Preferences["currency"]
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="XAF">FCFA (XAF)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Security</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Keep your operator account secure.
        </p>

        <div className="max-w-lg">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={changePassword}
            className="mt-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Update password
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Sign out</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign out of this operator session on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50"
        >
          Sign out
        </button>
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-800">{value}</p>
    </div>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-700" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
