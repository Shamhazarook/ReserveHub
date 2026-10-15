
"use client";

import { useState } from "react";

type Reservation = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  resource: {
    name: string;
    location: string;
    category: string;
  };
};

export default function MyReservationsPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function findReservations() {
    if (!employeeNumber.trim()) {
      setMessage("Please enter your employee number.");
      return;
    }

    setLoading(true);
    setMessage("");
    setSearched(false);

    try {
      const response = await fetch(
        `/api/my-reservations?employeeNumber=${encodeURIComponent(
          employeeNumber.trim()
        )}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setReservations([]);
        setMessage(result.message || "Unable to find reservations.");
        return;
      }

      setReservations(result.data);
      setSearched(true);

      if (result.data.length === 0) {
        setMessage("No reservations found for this employee.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <a
          href="/resources"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Resources
        </a>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            ReserveHub
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Reservations
          </h1>

          <p className="mt-2 text-slate-600">
            Enter your employee number to find your bookings.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={employeeNumber}
              onChange={(event) => setEmployeeNumber(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") findReservations();
              }}
              placeholder="e.g. EMP001"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3"
            />

            <button
              onClick={findReservations}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Find Bookings"}
            </button>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              {message}
            </p>
          )}

          {searched && reservations.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Your bookings ({reservations.length})
              </h2>

              {reservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {reservation.resource.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {reservation.resource.category} ·{" "}
                        {reservation.resource.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        reservation.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {reservation.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p>
                      <strong>Booking ID:</strong>{" "}
                      <span className="break-all">{reservation.id}</span>
                    </p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(reservation.startTime).toLocaleDateString()}
                    </p>

                    <p>
                      <strong>Start:</strong>{" "}
                      {new Date(reservation.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <p>
                      <strong>End:</strong>{" "}
                      {new Date(reservation.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <a
            href="/resources"
            className="mt-6 inline-block font-semibold text-blue-600 hover:underline"
          >
            Browse Resources →
          </a>
        </section>
      </div>
    </main>
  );
}
