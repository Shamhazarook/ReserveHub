
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardStats = {
  totalResources: number;
  totalReservations: number;
  upcomingReservations: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const authResponse = await fetch("/api/admin/me", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!authResponse.ok) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/dashboard", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || "Could not load dashboard statistics.");
        } else {
          setStats(data.stats);
        }
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setChecking(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-700">
        Checking administrator and loading dashboard...
      </main>
    );
  }

  const cards = [
    {
      label: "Total Resources",
      value: stats?.totalResources,
      icon: "▦",
      note: "Rooms and equipment",
    },
    {
      label: "Confirmed Reservations",
      value: stats?.totalReservations,
      icon: "✓",
      note: "All confirmed bookings",
    },
    {
      label: "Upcoming Reservations",
      value: stats?.upcomingReservations,
      icon: "◷",
      note: "Confirmed future bookings",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="w-full shrink-0 bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold tracking-tight">
          ReserveHub<span className="text-blue-400">.</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Resource Management
        </p>

        <nav className="mt-8 space-y-2">
          <a
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <span>▦</span> Dashboard
          </a>
          <a
            href="/resources"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>▣</span> Resources
          </a>
          <a
            href="/admin/reservations"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>▤</span> Reservations
          </a>
          <a
            href="/admin/calendar"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>▥</span> Calendar
          </a>
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm font-semibold">Administrator access</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Manage shared resources and review reservation requests.
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"
        >
          ↪ Log out
        </button>

        <p className="mt-8 text-xs text-slate-500">
          ReserveHub · Resource Management
        </p>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Workspace / Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage your shared resources and reservations in one place.
            </p>
          </div>

          <a
            href="/resources"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Browse Resources
          </a>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  {card.icon}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold">
                {card.value ?? "—"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {card.note}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
            <h3 className="font-semibold">Resource Management</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Browse shared rooms and equipment, and manage resource
              availability using the existing resources page.
            </p>
            <a
              href="/resources"
              className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              View Resources →
            </a>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold">Quick Actions</h3>
            <p className="mt-2 text-sm text-slate-500">
              Manage reservation requests.
            </p>
            <a
              href="/admin/reservations"
              className="mt-5 block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="font-semibold">▤ View Reservations</p>
              <p className="mt-1 text-xs text-slate-500">
                Review and manage booking requests
              </p>
            </a>
            <a
              href="/admin/calendar"
              className="mt-3 block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="font-semibold">▥ Calendar</p>
              <p className="mt-1 text-xs text-slate-500">
                Open the reservation calendar
              </p>
            </a>
          </section>
        </div>

        <footer className="py-8 text-center text-xs text-slate-400">
          ReserveHub · Resource Reservation Management System
        </footer>
      </section>
    </main>
  );
}
