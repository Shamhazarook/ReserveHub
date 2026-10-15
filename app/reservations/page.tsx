
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Reservation = {
  id: string;
  bookingId: string | null;
  resourceId?: string;
  resource?: {
    name: string;
  } | null;
  bookingFor: string;
  startTime: string;
  endTime: string;
  status: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReservations() {
      try {
        const response = await fetch("/api/reservations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error ||
              result.message ||
              "Unable to load reservations."
          );
        }

        const data = result.data ?? result.reservations;

        if (!Array.isArray(data)) {
          throw new Error("Unexpected reservations response.");
        }

        setReservations(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reservations."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function statusStyle(status: string) {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Reservations
            </h1>
            <p className="mt-2 text-gray-600">
              View your resource bookings and their current status.
            </p>
          </div>

          <Link
            href="/reservations/new"
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            + New Reservation
          </Link>
        </div>

        {loading && (
          <p className="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            Loading reservations...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <p className="font-semibold text-red-700">
              Could not load reservations
            </p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No reservations found
            </h2>
            <p className="mt-2 text-gray-600">
              Create a reservation to see it listed here.
            </p>
            <Link
              href="/reservations/new"
              className="mt-5 inline-block rounded-lg bg-blue-700 px-5 py-3 text-white"
            >
              Create Reservation
            </Link>
          </div>
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {reservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Booking ID
                    </p>
                    <h2 className="mt-1 break-all text-lg font-bold text-gray-900">
                      {reservation.bookingId || "Not assigned"}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                      reservation.status
                    )}`}
                  >
                    {reservation.status}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <p>
                    <span className="font-semibold text-gray-700">
                      Resource:{" "}
                    </span>
                    {reservation.resource?.name || "Resource"}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-700">
                      Booking type:{" "}
                    </span>
                    {reservation.bookingFor}
                  </p>

                  {reservation.bookingFor === "VISITOR" &&
                    reservation.visitorName && (
                      <p>
                        <span className="font-semibold text-gray-700">
                          Visitor:{" "}
                        </span>
                        {reservation.visitorName}
                      </p>
                    )}

                  <p>
                    <span className="font-semibold text-gray-700">
                      Start:{" "}
                    </span>
                    {formatDate(reservation.startTime)}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-700">
                      End:{" "}
                    </span>
                    {formatDate(reservation.endTime)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
