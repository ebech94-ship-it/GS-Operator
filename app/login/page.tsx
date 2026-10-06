"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const uid = credential.user.uid;

    const applicationSnapshot = await getDoc(
      doc(db, "operatorApplications", uid)
    );

    if (applicationSnapshot.exists()) {
      const application = applicationSnapshot.data();

      if (application.status === "rejected") {
        router.push("/reapply");
        return;
      }
    }

    router.push("/");
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      const code = (error as { code: string }).code;

      if (code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } else {
      setError("Unable to sign in. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Top brand area */}
      <div className="bg-[#06152B] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center">
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
      </div>

      {/* Login */}
      <section className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
                Welcome back
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Bon retour
              </p>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Sign in to manage your transport operations with GodSpeed
                Mobility.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0B1F3A]">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="operator@example.com"
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-[#0B1F3A] outline-none transition focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-[#0B1F3A]">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setError(
                        "Password reset will be connected here next."
                      );
                    }}
                    className="text-xs font-semibold text-[#1976D2] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 pr-14 text-sm text-[#0B1F3A] outline-none transition focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-0 top-0 flex h-14 w-14 items-center justify-center text-lg text-slate-500 hover:text-[#0B1F3A]"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-[#1976D2] px-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In • Se connecter"}
              </button>
            </form>

            {/* Register */}
            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                New to GodSpeed Mobility?
              </p>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="mt-2 font-bold text-[#1976D2] hover:underline"
              >
                Create Operator Account
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs font-medium text-slate-400">
              Safe journeys. Better connections.
            </p>

            <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400">
              GODSPEED TECHNOLOGIES
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}