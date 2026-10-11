
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Trip = {
  id: string;
  operatorId?: string;
  vehicleId?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  price?: number;
  date?: string;
  occupiedSeats?: string[];
};

type CompanyProfile = {
  name?: string;
  displayName?: string;
  companyName?: string;
  logo?: string;
};

type Booking = {
  id: string;
  operatorId?: string;
  passengerId?: string;
};

export default function Home() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState("Your Company");
  const [operatorId, setOperatorId] = useState("");
  const [loadingCompany, setLoadingCompany] = useState(true);
const [companyLogo, setCompanyLogo] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [stats, setStats] = useState({
    trips: 0,
    bookings: 0,
    vehicles: 0,
    passengers: 0,
  });

  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [loadingTodayTrips, setLoadingTodayTrips] = useState(true);

  useEffect(() => {
    let unsubscribeUserProfile: (() => void) | undefined;
    let unsubscribeOperator: (() => void) | undefined;
    let unsubscribeTrips: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeVehicles: (() => void) | undefined;
    let activeOperatorId = "";

    const clearOperatorListeners = () => {
      unsubscribeOperator?.();
      unsubscribeTrips?.();
      unsubscribeBookings?.();
      unsubscribeVehicles?.();

      unsubscribeOperator = undefined;
      unsubscribeTrips = undefined;
      unsubscribeBookings = undefined;
      unsubscribeVehicles = undefined;
    };

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribeUserProfile?.();
        unsubscribeUserProfile = undefined;
        clearOperatorListeners();
        activeOperatorId = "";

        if (!user) {
          router.replace("/login");
          return;
        }

        setLoadingCompany(true);
        setLoadingTodayTrips(true);
        setDashboardError("");
        setOperatorId("");
        setCompanyName("Your Company");
        setStats({
          trips: 0,
          bookings: 0,
          vehicles: 0,
          passengers: 0,
        });
        setTodayTrips([]);

        unsubscribeUserProfile = onSnapshot(
          doc(db, "users", user.uid),
          (userSnapshot) => {
            if (!userSnapshot.exists()) {
              setDashboardError(
                "Your user profile could not be found."
              );
              setLoadingCompany(false);
              setLoadingTodayTrips(false);
              return;
            }

            const userData = userSnapshot.data();
            const currentOperatorId =
              userData.operatorId || "";

            if (!currentOperatorId) {
              clearOperatorListeners();
              activeOperatorId = "";
              setOperatorId("");
              setCompanyName("Operator profile not linked");
              setStats({
                trips: 0,
                bookings: 0,
                vehicles: 0,
                passengers: 0,
              });
              setTodayTrips([]);
              setLoadingCompany(false);
              setLoadingTodayTrips(false);
              setDashboardError(
                "Your account has no operatorId. Please contact the administrator."
              );
              return;
            }

            if (activeOperatorId === currentOperatorId) {
              return;
            }

            clearOperatorListeners();
            activeOperatorId = currentOperatorId;

            setOperatorId(currentOperatorId);
            setLoadingCompany(true);
            setLoadingTodayTrips(true);
            setDashboardError("");
            setStats({
              trips: 0,
              bookings: 0,
              vehicles: 0,
              passengers: 0,
            });
            setTodayTrips([]);

            // Live company profile
            unsubscribeOperator = onSnapshot(
              doc(db, "operators", currentOperatorId),
              (operatorSnapshot) => {
                if (!operatorSnapshot.exists()) {
                  setCompanyName("Company profile not found");
                  setDashboardError(
                    "The linked operator document does not exist."
                  );
                  setLoadingCompany(false);
                  return;
                }

                const company =
                  operatorSnapshot.data() as CompanyProfile;

              setCompanyName(
  company.displayName ||
    company.name ||
    company.companyName ||
    "Your Company"
);
setCompanyLogo(company.logo || "");
setLoadingCompany(false);
              },
              (error) => {
                console.error(
                  "LIVE COMPANY PROFILE ERROR:",
                  error
                );
                setDashboardError(
                  "Unable to load your company profile."
                );
                setLoadingCompany(false);
              }
            );

            // Live trips belonging only to this operator
            unsubscribeTrips = onSnapshot(
              query(
                collection(db, "trips"),
                where("operatorId", "==", currentOperatorId)
              ),
              (snapshot) => {
                const trips = snapshot.docs.map((item) => ({
                  id: item.id,
                  ...item.data(),
                })) as Trip[];

                setStats((previous) => ({
                  ...previous,
                  trips: trips.length,
                }));

                const now = new Date();
                const today = [
                  now.getFullYear(),
                  String(now.getMonth() + 1).padStart(2, "0"),
                  String(now.getDate()).padStart(2, "0"),
                ].join("-");

                const todaysOperatorTrips = trips
                  .filter((trip) => trip.date === today)
                  .sort((a, b) =>
                    (a.departure || "").localeCompare(
                      b.departure || ""
                    )
                  )
                  .slice(0, 2);

                setTodayTrips(todaysOperatorTrips);
                setLoadingTodayTrips(false);
              },
              (error) => {
                console.error(
                  "LIVE OPERATOR TRIPS ERROR:",
                  error
                );
                setLoadingTodayTrips(false);
                setDashboardError(
                  "Unable to load your trips. Check Firestore permissions."
                );
              }
            );

            // Live bookings belonging only to this operator
            unsubscribeBookings = onSnapshot(
              query(
                collection(db, "bookings"),
                where("operatorId", "==", currentOperatorId)
              ),
              (snapshot) => {
                const bookings = snapshot.docs.map((item) => ({
                  id: item.id,
                  ...item.data(),
                })) as Booking[];

                const passengerIds = new Set(
                  bookings
                    .map((booking) => booking.passengerId)
                    .filter(
                      (passengerId): passengerId is string =>
                        Boolean(passengerId)
                    )
                );

                setStats((previous) => ({
                  ...previous,
                  bookings: bookings.length,
                  passengers: passengerIds.size,
                }));
              },
              (error) => {
                console.error(
                  "LIVE OPERATOR BOOKINGS ERROR:",
                  error
                );
                setDashboardError(
                  "Unable to load bookings. Check Firestore permissions and booking ownership fields."
                );
              }
            );

            // Live vehicles belonging only to this operator
            unsubscribeVehicles = onSnapshot(
              query(
                collection(db, "vehicles"),
                where("operatorId", "==", currentOperatorId)
              ),
              (snapshot) => {
                setStats((previous) => ({
                  ...previous,
                  vehicles: snapshot.size,
                }));
              },
              (error) => {
                console.error(
                  "LIVE OPERATOR VEHICLES ERROR:",
                  error
                );
                setDashboardError(
                  "Unable to load vehicles. Check Firestore permissions and vehicle ownership fields."
                );
              }
            );
          },
          (error) => {
            console.error("LIVE USER PROFILE ERROR:", error);
            setDashboardError(
              "Unable to read your account profile."
            );
            setLoadingCompany(false);
            setLoadingTodayTrips(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeUserProfile?.();
      clearOperatorListeners();
    };
  }, [router]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("OPERATOR LOGOUT ERROR:", error);
      setDashboardError("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  function goTo(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  const initial =
    companyName.trim().charAt(0).toUpperCase() || "O";

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

  const frenchGreeting =
    hour < 12
      ? "Bonjour"
      : hour < 18
        ? "Bon après-midi"
        : "Bonsoir";

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#0B1F3A]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 bg-[#06152B] text-white shadow-md lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/20"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <div className="relative h-9 w-14 shrink-0">
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

        
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#06152B] text-white lg:flex">
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div className="relative h-11 w-16 shrink-0">
            <Image
              src="/bus.png"
              alt="GodSpeed Mobility"
              fill
              className="object-contain"
            />
          </div>

          <div>
            <p className="font-extrabold tracking-wide">
              GODSPEED
            </p>
            <p className="text-[9px] tracking-[0.18em] text-blue-200">
              MOBILITY
            </p>
          </div>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={() => router.push("/company")}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/10"
            title="Open company profile"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1976D2] text-lg font-extrabold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {loadingCompany ? "Loading company..." : companyName}
              </span>
              <span className="mt-1 block text-xs text-blue-200">
                Company profile · View
              </span>
            </span>
            <span className="text-slate-400">›</span>
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <NavItem label="Dashboard" active onClick={() => goTo("/")} />
          <NavItem label="Trips" onClick={() => goTo("/trips")} />
          <NavItem label="Vehicles" onClick={() => goTo("/vehicles")} />
          <NavItem label="Bookings" onClick={() => goTo("/bookings")} />
          <NavItem label="Passengers" onClick={() => goTo("/passengers")} />
          <NavItem label="Revenue" onClick={() => goTo("/revenue")} />
          <NavItem label="Company" onClick={() => goTo("/company")} />
          <NavItem label="Settings" onClick={() => goTo("/settings")} />
        </nav>

        <div className="shrink-0 border-t border-white/10 bg-[#06152B] p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left transition hover:border-red-300/40 hover:bg-red-500/20 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-lg text-red-300">
              ↪
            </span>
            <span>
              <span className="block text-sm font-bold text-red-200">
                {loggingOut ? "Logging out..." : "Log out"}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                Se déconnecter
              </span>
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
          />

          <aside className="relative flex h-full w-[85%] max-w-sm flex-col overflow-hidden bg-[#06152B] text-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-16 shrink-0">
                  <Image
                    src="/bus.png"
                    alt="GodSpeed Mobility"
                    fill
                    className="object-contain"
                  />
                </div>

                <div>
                  <p className="font-extrabold tracking-wide">
                    GODSPEED
                  </p>
                  <p className="text-[9px] tracking-[0.18em] text-blue-200">
                    MOBILITY · OPERATOR
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg transition hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              onClick={() => goTo("/company")}
              className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4 text-left transition hover:bg-white/5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1976D2] text-lg font-extrabold">
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">
                  {loadingCompany ? "Loading company..." : companyName}
                </span>
                <span className="mt-1 block text-xs text-blue-200">
                  View company profile
                </span>
              </span>
              <span className="text-slate-400">›</span>
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Main menu · Menu principal
              </p>

              <nav className="space-y-1 pb-4">
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

            <div className="shrink-0 border-t border-white/10 bg-[#06152B] p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left transition hover:bg-red-500/20 disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-lg text-red-300">
                  ↪
                </span>
                <span>
                  <span className="block text-sm font-bold text-red-200">
                    {loggingOut ? "Logging out..." : "Log out"}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Se déconnecter
                  </span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Dashboard content */}
      <section className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Live welcome card */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0B1F3A] p-6 text-white shadow-lg sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-[0.18em] text-blue-200">
                    GODSPEED MOBILITY · OPERATOR PORTAL
                  </p>

                  <h1 className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">
                    {greeting},{" "}
                    {loadingCompany ? "..." : companyName}
                  </h1>

                  <p className="mt-1 break-words text-sm font-medium text-slate-300">
                    {frenchGreeting},{" "}
                    {loadingCompany ? "..." : companyName}
                  </p>
                </div>

               <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg">
  {companyLogo ? (
    <Image
      src={companyLogo}
      alt={`${companyName} logo`}
      fill
      sizes="56px"
      className="object-contain p-1"
      unoptimized
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-white">
      {initial}
    </div>
  )}
</div>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Manage your company&apos;s trips, vehicles,
                bookings and passengers from one place.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live dashboard
                </span>

                {operatorId && (
                  <span className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    Operator account connected
                  </span>
                )}
              </div>
            </div>
          </div>

          {dashboardError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p className="font-bold">Dashboard notice</p>
              <p className="mt-1">{dashboardError}</p>
            </div>
          )}

          {/* Live operator statistics */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Trips"
              subtitle="Voyages"
              value={String(stats.trips)}
            />
            <StatCard
              title="Bookings"
              subtitle="Réservations"
              value={String(stats.bookings)}
            />
            <StatCard
              title="Vehicles"
              subtitle="Véhicules"
              value={String(stats.vehicles)}
            />
            <StatCard
              title="Passengers"
              subtitle="Passagers uniques"
              value={String(stats.passengers)}
            />
          </div>

          {/* Create trip */}
          <button
            type="button"
            onClick={() => router.push("/trips")}
            className="mt-6 flex min-h-16 w-full items-center justify-between rounded-2xl bg-[#1976D2] px-5 text-left text-white shadow-md transition hover:bg-blue-700"
          >
            <div>
              <p className="font-extrabold">+ Create New Trip</p>
              <p className="text-xs text-blue-100">
                Créer un nouveau voyage
              </p>
            </div>
            <span className="text-2xl">→</span>
          </button>

          {/* Today's trips */}
          <div className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">
                  Today&apos;s Trips
                </h2>
                <p className="text-xs text-slate-500">
                  Voyages du jour · Your company only
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/trips")}
                className="shrink-0 text-sm font-bold text-[#1976D2] hover:text-blue-800"
              >
                View all →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {loadingTodayTrips ? (
                <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
                  Loading your trips...
                </div>
              ) : todayTrips.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-[#1976D2]">
                    ↗
                  </div>
                  <p className="mt-3 font-bold text-[#0B1F3A]">
                    No trips today
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No trips are scheduled for your company today.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/trips")}
                    className="mt-4 rounded-xl bg-[#1976D2] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Manage trips
                  </button>
                </div>
              ) : (
                todayTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    route={`${trip.from || "Origin"} → ${trip.to || "Destination"}`}
                    time={`${trip.departure || "--:--"} → ${trip.arrival || "--:--"}`}
                    seats={`${trip.occupiedSeats?.length ?? 0} occupied`}
                    fare={`${(trip.price ?? 0).toLocaleString()} FCFA`}
                    onManage={() => router.push("/trips")}
                  />
                ))
              )}
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
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#1976D2] text-white shadow-sm"
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
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-white/10"
    >
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-[11px] text-slate-400">
          {subtitle}
        </span>
      </span>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-extrabold text-[#0B1F3A]">
            {route}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {time} · {seats}
          </p>
          <p className="mt-2 text-sm font-bold text-[#1976D2]">
            {fare}
          </p>
        </div>

        <button
          type="button"
          onClick={onManage}
          className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#0B1F3A] transition hover:bg-blue-50"
        >
          Manage
        </button>
      </div>
    </div>
  );
}
