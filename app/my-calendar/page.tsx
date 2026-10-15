
"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";

const FullCalendar = dynamic(
  () => import("@fullcalendar/react"),
  { ssr: false }
);

type Reservation = {
  id: string;
  bookingId: string | null;
  startTime: string;
  endTime: string;
  status: string;
  bookingFor: string;
  visitorName: string | null;
  resource: {
    name: string;
    category: string;
    location: string;
  };
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Reservation[];
  reservations?: Reservation[];
};

export default function MyCalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/my-reservations", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load your reservations."
        );
      }

      setReservations(result.reservations ?? result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your reservations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const events: EventInput[] = reservations.map((reservation) => ({
    id: reservation.id,
    title: reservation.resource.name,
    start: reservation.startTime,
    end: reservation.endTime,
    backgroundColor:
      reservation.status === "CONFIRMED"
        ? "#16a34a"
        : reservation.status === "PENDING"
          ? "#d97706"
          : reservation.status === "REJECTED" ||
              reservation.status === "CANCELLED"
            ? "#6b7280"
            : "#2563eb",
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Reservation Calendar
            </h1>
            <p className="mt-2 text-gray-600">
              View your bookings by date and time.
            </p>
          </div>

          <a
            href="/reservations/new"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            + New Reservation
          </a>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total bookings</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {reservations.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Confirmed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {reservations.filter((r) => r.status === "CONFIRMED").length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {reservations.filter((r) => r.status === "PENDING").length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
            <button
              onClick={() => void loadReservations()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
            Loading your calendar...
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="text-green-700">● Confirmed</span>
              <span className="text-amber-700">● Pending</span>
              <span className="text-gray-600">● Cancelled / Rejected</span>
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
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelected(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="reservation-details-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2
                  id="reservation-details-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Reservation Details
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close reservation details"
                  className="text-xl text-gray-500 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-semibold">Resource:</span>{" "}
                  {selected.resource.name}
                </p>
                <p>
                  <span className="font-semibold">Category:</span>{" "}
                  {selected.resource.category}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {selected.resource.location}
                </p>
                <p>
                  <span className="font-semibold">Start:</span>{" "}
                  {formatDate(selected.startTime)}
                </p>
                <p>
                  <span className="font-semibold">End:</span>{" "}
                  {formatDate(selected.endTime)}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {selected.status}
                </p>
                {selected.bookingId && (
                  <p>
                    <span className="font-semibold">Booking ID:</span>{" "}
                    {selected.bookingId}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-6 w-full rounded-lg bg-gray-800 px-4 py-3 font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
