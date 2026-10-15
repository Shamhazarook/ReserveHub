"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function AdminReservationsPage() {
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] =
    useState<ReservationStatus>("CONFIRMED");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReservations() {
      try {
        const authResponse = await fetch("/api/admin/me");

        if (!authResponse.ok) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/reservations");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load reservations."
          );
        }

        setReservations(data.reservations);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, [router]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function getStatusStyle(status: ReservationStatus) {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "CANCELLED":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  async function updateReservation(
    id: string,
    status: ReservationStatus
  ) {
    setError("");
    setMessage("");
    setUpdatingId(id);

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update reservation."
        );
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status }
            : reservation
        )
      );

      setEditingId(null);
      setMessage(data.message || `Status updated to ${status}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function startEditing(reservation: Reservation) {
    setError("");
    setMessage("");
    setEditingId(reservation.id);
    setEditStatus(reservation.status);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Loading reservations...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              All Reservations
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage all resource bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-lg bg-gray-800 px-5 py-3 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/admin/reservations"
              className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              View All Reservations
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Reservations
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {reservations.length}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No Reservations Found
            </h2>
            <p className="mt-2 text-gray-600">
              Reservations will appear here when users make bookings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-[1300px] w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-5 py-4">Employee / Visitor</th>
                  <th className="px-5 py-4">Resource</th>
                  <th className="px-5 py-4">Start Time</th>
                  <th className="px-5 py-4">End Time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => {
                  const isUpdating =
                    updatingId === reservation.id;
                  const isEditing =
                    editingId === reservation.id;

                  return (
                    <tr
                      key={reservation.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="border-b-2 border-red-500 pb-3">
                          <p className="font-semibold text-gray-900">
                            {reservation.employee.fullName}
                          </p>
                          <p className="text-gray-500">
                            {reservation.employee.email}
                          </p>
                          <p className="text-gray-500">
                            Employee No:{" "}
                            {reservation.employee.employeeNumber ||
                              "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {reservation.resource.name}
                        </p>
                        <p className="text-gray-500">
                          {reservation.resource.category}
                        </p>
                        <p className="text-gray-500">
                          {reservation.resource.location}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(reservation.startTime)}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(reservation.endTime)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            reservation.status
                          )}`}
                        >
                          {reservation.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex min-w-[190px] flex-col gap-2">
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  startEditing(reservation)
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateReservation(
                                    reservation.id,
                                    "CONFIRMED"
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Confirm
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateReservation(
                                    reservation.id,
                                    "REJECTED"
                                  )
                                }
                                className="rounded-lg bg-orange-500 px-3 py-2 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateReservation(
                                    reservation.id,
                                    "CANCELLED"
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Cancel Reservation
                              </button>
                            </>
                          ) : (
                            <>
                              <label
                                htmlFor={`status-${reservation.id}`}
                                className="font-medium text-gray-700"
                              >
                                Edit Status
                              </label>

                              <select
                                id={`status-${reservation.id}`}
                                value={editStatus}
                                onChange={(event) =>
                                  setEditStatus(
                                    event.target
                                      .value as ReservationStatus
                                  )
                                }
                                disabled={isUpdating}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                              >
                                <option value="PENDING">
                                  Pending
                                </option>
                                <option value="CONFIRMED">
                                  Confirmed
                                </option>
                                <option value="REJECTED">
                                  Rejected
                                </option>
                                <option value="CANCELLED">
                                  Cancelled
                                </option>
                              </select>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateReservation(
                                    reservation.id,
                                    editStatus
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating
                                  ? "Saving..."
                                  : "Save Changes"}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                Keep Current Status
                              </button>
                            </>
                          )}

                          {isUpdating && (
                            <p className="text-xs text-gray-500">
                              Updating reservation...
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}