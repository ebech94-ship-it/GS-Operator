"use client";

import Image from "next/image";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  function goTo(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#0B1F3A]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 bg-[#06152B] text-white shadow-md">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <div className="relative h-9 w-14">
              <Image
                src="/bus.png"
                alt="GodSpeed Mobility"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-extrabold tracking-wide">
                GODSPEED
              </p>
              <p className="text-[8px] font-semibold tracking-[0.18em] text-blue-200">
                MOBILITY
              </p>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1976D2] text-sm font-bold">
            M
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
     <aside className="fixed left-0 top-0 hidden h-screen w-64 overflow-y-auto bg-[#06152B] text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="relative h-11 w-16">
            <Image
              src="/bus.png"
              alt="GodSpeed Mobility"
              fill
              className="object-contain"
            />
          </div>

          <div>
            <p className="font-extrabold tracking-wide">GODSPEED</p>
            <p className="text-[9px] tracking-[0.18em] text-blue-200">
              MOBILITY
            </p>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-5">
          <NavItem label="Dashboard" active onClick={() => goTo("/")} />
          <NavItem label="Trips" onClick={() => goTo("/trips")} />
          <NavItem label="Vehicles" onClick={() => goTo("/vehicles")} />
          <NavItem label="Bookings" onClick={() => goTo("/bookings")} />
          <NavItem label="Passengers" onClick={() => goTo("/passengers")} />
          <NavItem label="Revenue" onClick={() => goTo("/revenue")} />
          <NavItem label="Company" onClick={() => goTo("/company")} />
          <NavItem label="Settings" onClick={() => goTo("/settings")} />
        </nav>

        <div className="absolute bottom-5 left-3 right-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-300 transition hover:bg-white/10"
          >
            🚪 Log out
            <span className="ml-2 text-xs font-normal text-red-200">
              • Se déconnecter
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
          />

         <aside className="relative h-full w-[82%] max-w-sm overflow-y-auto bg-[#06152B] text-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-16">
                  <Image
                    src="/bus.png"
                    alt="GodSpeed Mobility"
                    fill
                    className="object-contain"
                  />
                </div>

                <div>
                  <p className="font-extrabold tracking-wide">GODSPEED</p>
                  <p className="text-[9px] tracking-[0.18em] text-blue-200">
                    MOBILITY • OPERATOR
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-5">
              <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Main menu • Menu principal
              </p>

              <nav className="space-y-1">
                <MobileNavItem
                  label="Dashboard"
                  subtitle="Tableau de bord"
                  onClick={() => goTo("/")}
                />

                <MobileNavItem
                  label="Trips"
                  subtitle="Voyages"
                  onClick={() => goTo("/trips")}
                />

                <MobileNavItem
                  label="Vehicles"
                  subtitle="Véhicules"
                  onClick={() => goTo("/vehicles")}
                />

                <MobileNavItem
                  label="Bookings"
                  subtitle="Réservations"
                  onClick={() => goTo("/bookings")}
                />

                <MobileNavItem
                  label="Passengers"
                  subtitle="Passagers"
                  onClick={() => goTo("/passengers")}
                />

                <MobileNavItem
                  label="Revenue"
                  subtitle="Revenus"
                  onClick={() => goTo("/revenue")}
                />

                <MobileNavItem
                  label="Company"
                  subtitle="Entreprise"
                  onClick={() => goTo("/company")}
                />

                <MobileNavItem
                  label="Settings"
                  subtitle="Paramètres"
                  onClick={() => goTo("/settings")}
                />
              </nav>
            </div>

            <div className="absolute bottom-5 left-4 right-4 border-t border-white/10 pt-4">
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-500/10 px-4 py-3 text-left font-bold text-red-300"
              >
                🚪 Log out
                <span className="ml-2 text-xs font-normal">
                  • Se déconnecter
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <section className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Welcome */}
          <div className="rounded-3xl bg-[#0B1F3A] p-6 text-white shadow-lg sm:p-8">
            <p className="text-sm font-medium text-blue-200">
              GODSPEED MOBILITY
            </p>

            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Good morning, Mondial Express
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-300">
              Bonjour, Mondial Express
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Manage your trips, vehicles, bookings and passengers from one
              place.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Trips" subtitle="Voyages" value="12" />
            <StatCard title="Bookings" subtitle="Réservations" value="48" />
            <StatCard title="Vehicles" subtitle="Véhicules" value="8" />
            <StatCard title="Passengers" subtitle="Passagers" value="126" />
          </div>

          {/* Create trip */}
          <button
            onClick={() => router.push("/trips")}
            className="mt-6 flex min-h-16 w-full items-center justify-between rounded-2xl bg-[#1976D2] px-5 text-left text-white shadow-md transition hover:bg-blue-700"
          >
            <div>
              <p className="font-extrabold">
                + Create New Trip
              </p>
              <p className="text-xs text-blue-100">
                Créer un nouveau voyage
              </p>
            </div>

            <span className="text-2xl">→</span>
          </button>

          {/* Today's trips */}
          <div className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold">
                  Today&apos;s Trips
                </h2>

                <p className="text-xs text-slate-500">
                  Voyages du jour
                </p>
              </div>

              <button
                onClick={() => router.push("/trips")}
                className="text-sm font-bold text-[#1976D2]"
              >
                View all →
              </button>
            </div>

            <div className="mt-4 space-y-3">
             <TripCard
  route="Kumba → Yaoundé"
  time="9:00 PM"
  seats="70 seats"
  fare="8,000 FCFA"
  onManage={() => router.push("/trips")}
/>

              <TripCard
  route="Buea → Douala"
  time="7:30 AM"
  seats="50 seats"
  fare="5,000 FCFA"
  onManage={() => router.push("/trips")}
/>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function NavItem({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#1976D2] text-white"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function MobileNavItem({
  label,
  subtitle,
  onClick,
}: {
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-white/10"
    >
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>

      <span className="text-slate-500">›</span>
    </button>
  );
}

function StatCard({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="text-[10px] text-slate-400">{subtitle}</p>

      <p className="mt-2 text-2xl font-extrabold text-[#0B1F3A]">
        {value}
      </p>
    </div>
  );
}

function TripCard({
  route,
  time,
  seats,
  fare,
  onManage,
}: {
  route: string;
  time: string;
  seats: string;
  fare: string;
  onManage: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-[#0B1F3A]">
            {route}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {time} • {seats}
          </p>

          <p className="mt-2 text-sm font-bold text-[#1976D2]">
            {fare}
          </p>
        </div>

        <button
         onClick={onManage}
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#0B1F3A]"
        >
          Manage
        </button>
      </div>
    </div>
  );
}