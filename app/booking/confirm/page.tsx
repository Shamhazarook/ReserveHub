
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type BookingDetails = {
  bookingId: string | null;
  bookingFor: "SELF" | "EMPLOYEE" | "VISITOR";
  status: string;
  startTime: string;
  endTime: string;
  visitorName: string | null;
  visitorEmail: string | null;
  resource: {
    name: string;
    category: string;
    location: string;
  };
  employee: {
    fullName: string;
    employeeNumber: string | null;
    email: string;
  } | null;
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [message, setMessage] = useState("Loading booking details...");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBooking() {
      if (!token) {
        setMessage("The confirmation link is missing its token.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/booking/confirm?token=${encodeURIComponent(token)}`
        );
        const result = await response.json();

        if (!active) return;

        if (!response.ok || !result.success) {
          setMessage(result.message || "Unable to validate this link.");
          return;
        }

        setBooking(result.data);
        setMessage("");
      } catch {
        if (active) {
          setMessage("Unable to connect. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBooking();

    return () => {
      active = false;
    };
  }, [token]);

  async function decide(action: "CONFIRM" | "REJECT") {
    if (!token || processing || finished) return;

    const prompt =
      action === "CONFIRM"
        ? "Confirm this resource booking?"
        : "Reject this resource booking?";

    if (!window.confirm(prompt)) return;

    setProcessing(true);
    setMessage("");

    try {
      const response = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(result.message || "Unable to process your decision.");
        return;
      }

      setFinished(true);
      setBooking((previous) =>
        previous ? { ...previous, status: result.status } : previous
      );
      setMessage(result.message);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          ReserveHub
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Booking Invitation
        </h1>

        <p className="mt-2 text-slate-600">
          Review the resource and reservation details before making your
          decision.
        </p>

        {loading && (
          <p className="mt-6 text-sm text-slate-600">
            Loading booking details...
          </p>
        )}

        {!loading && booking && (
          <>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Booking ID</p>
              <p className="mt-1 break-all text-lg font-bold text-slate-900">
                {booking.bookingId || "Not available"}
              </p>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>
                  <strong>Resource:</strong> {booking.resource.name}
                </p>
                <p>
                  <strong>Category:</strong> {booking.resource.category}
                </p>
                <p>
                  <strong>Location:</strong> {booking.resource.location}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(booking.startTime).toLocaleDateString()}
                </p>
                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(booking.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {new Date(booking.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {booking.visitorName && (
                  <p>
                    <strong>Visitor:</strong> {booking.visitorName}
                  </p>
                )}

                {booking.visitorEmail && (
                  <p className="break-all">
                    <strong>Visitor email:</strong> {booking.visitorEmail}
                  </p>
                )}

                {booking.employee && (
                  <p>
                    <strong>Employee:</strong> {booking.employee.fullName}
                  </p>
                )}
              </div>

              <p className="mt-4 text-sm">
                <strong>Status:</strong> {booking.status}
              </p>
            </div>

            {!finished && booking.status === "PENDING" && (
              <>
                <p className="mt-4 text-sm text-slate-600">
                  This secure invitation expires 24 hours after it was created.
                  Choose one option below.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => decide("CONFIRM")}
                    className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                  >
                    {processing ? "Processing..." : "Confirm Booking"}
                  </button>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => decide("REJECT")}
                    className="rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {processing ? "Processing..." : "Reject Booking"}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900"
          >
            {message}
          </div>
        )}

        {finished && (
          <p className="mt-4 text-sm text-slate-600">
            You can close this page now.
          </p>
        )}
      </div>
    </main>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={<main className="p-8">Loading confirmation page...</main>}
    >
      <ConfirmationContent />
    </Suspense>
  );
}
