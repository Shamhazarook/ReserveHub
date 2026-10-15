"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        if (active) setChecking(false);
      } catch {
        if (active) {
          setError("Unable to verify your login. Please try again.");
          setChecking(false);
        }
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Logout failed. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to log out. Please try again.");
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Checking your login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Employee Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome to ReserveHub
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-3 py-2 text-sm
                       font-medium text-white hover:bg-red-700"
          >
            Log Out
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/resources"
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-800">
              Browse Resources
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              View available facilities and resources.
            </p>
            <span className="mt-4 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
              View Resources
            </span>
          </Link>

          <Link
            href="/reservations/new"
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-800">
              New Reservation
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create a reservation for a resource.
            </p>
            <span className="mt-4 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
              Book Resource
            </span>
          </Link>

          <Link
            href="/my-reservations"
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-800">
              My Reservations
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review your existing bookings.
            </p>
            <span className="mt-4 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
              View Bookings
            </span>
          </Link>

          <Link
            href="/my-calendar"
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-800">
              My Calendar
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              View your reservation schedule.
            </p>
            <span className="mt-4 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
              Open Calendar
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}