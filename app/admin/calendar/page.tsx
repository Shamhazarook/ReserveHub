
"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";

const FullCalendar = dynamic(
  () => import("@fullcalendar/react"),
  { ssr: false }
);

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED";

type Reservation = {
  id: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  employee: {
    fullName: string;
    email: string;
    employeeNumber: string | null;
  };
  resource: {
    name: string;
    category: string;
    location: string;
  };
};

type ApiResponse = {
  success: boolean;
  message?: string;
  reservations?: Reservation[];
};

export default function AdminCalendarPage() {
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const authResponse = await fetch("/api/admin/me", {
        cache: "no-store",
      });

      if (!authResponse.ok) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/reservations", {
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load reservations."
        );
      }

      setReservations(result.reservations ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservations."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const events: EventInput[] = reservations.map((reservation) => ({
    id: reservation.id,
    title: `${reservation.resource.name} — ${reservation.employee.fullName}`,
    start: reservation.startTime,
    end: reservation.endTime,
    backgroundColor:
      reservation.status === "CONFIRMED"
        ? "#16a34a"
        : reservation.status === "PENDING"
          ? "#d97706"
          : reservation.status === "REJECTED"
            ? "#dc2626"
            : "#6b7280",
    borderColor: "transparent",
    extendedProps: { reservation },
  }));

  function handleEventClick(info: EventClickArg) {
    const reservation = info.event.extendedProps
      .reservation as Reservation | undefined;

    if (reservation) {
      setSelected(reservation);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Reservation Calendar
            </h1>
            <p className="mt-2 text-gray-600">
              View all resource bookings by date and time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-lg bg-gray-800 px-4 py-3 text-white hover:bg-gray-700"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/reservations"
              className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              Manage Reservations
            </Link>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {reservations.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {reservations.filter((r) => r.status === "PENDING").length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Confirmed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {reservations.filter((r) => r.status === "CONFIRMED").length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Cancelled / Rejected</p>
            <p className="mt-1 text-2xl font-bold text-gray-600">
              {reservations.filter(
                (r) =>
                  r.status === "CANCELLED" ||
                  r.status === "REJECTED"
              ).length}
            </p>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadReservations()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
            Loading admin calendar...
          </div>
        ) : (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="text-green-700">● Confirmed</span>
              <span className="text-amber-700">● Pending</span>
              <span className="text-red-600">● Rejected</span>
              <span className="text-gray-600">● Cancelled</span>
            </div>

            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              dayMaxEvents={3}
              nowIndicator
              displayEventTime
            />
          </section>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelected(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-reservation-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <h2
                  id="admin-reservation-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Reservation Details
                </h2>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close reservation details"
                  className="text-xl text-gray-500 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Employee / Visitor:</strong>{" "}
                  {selected.employee.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {selected.employee.email}
                </p>
                <p>
                  <strong>Employee Number:</strong>{" "}
                  {selected.employee.employeeNumber || "N/A"}
                </p>
                <hr />
                <p>
                  <strong>Resource:</strong> {selected.resource.name}
                </p>
                <p>
                  <strong>Category:</strong> {selected.resource.category}
                </p>
                <p>
                  <strong>Location:</strong> {selected.resource.location}
                </p>
                <hr />
                <p>
                  <strong>Start:</strong>{" "}
                  {formatDate(selected.startTime)}
                </p>
                <p>
                  <strong>End:</strong> {formatDate(selected.endTime)}
                </p>
                <p>
                  <strong>Status:</strong> {selected.status}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/reservations"
                  className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
                >
                  Manage Status
                </Link>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
