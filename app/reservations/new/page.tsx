"use client";
import jsPDF from "jspdf";

import { useEffect, useState } from "react";
import Link from "next/link";

type Resource = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
};

type Employee = {
  id?: string;
  name?: string;
  fullName?: string;
  email: string;
  employeeNumber?: string | null;
};

type Booking = {
  id?: string;
  bookingId?: string | null;
  bookingFor?: "SELF" | "EMPLOYEE" | "VISITOR";
  status?: string;
  resource?: { name: string };
  resourceName?: string;
  startTime?: string;
  endTime?: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  recipientName?: string | null;
  recipientEmployeeNumber?: string | null;
};

type BookingResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  reservation?: Booking;
  booking?: Booking;
  data?: Booking;
  whatsappUrl?: string;
};

export default function NewReservationPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [resourceId, setResourceId] = useState("");
  const [bookingFor, setBookingFor] = useState<
    "SELF" | "EMPLOYEE" | "VISITOR"
  >("SELF");

  const [targetEmployeeNumber, setTargetEmployeeNumber] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [recipientWhatsApp, setRecipientWhatsApp] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [createdBooking, setCreatedBooking] =
    useState<Booking | null>(null);
  
    
  function downloadReceipt() {
    if (!createdBooking?.bookingId) {
      setError("Booking ID is not available. Please try again.");
      return;
    }

    const pdf = new jsPDF();

    // Header
    pdf.setFillColor(30, 58, 95);
    pdf.rect(0, 0, 210, 42, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(23);
    pdf.text("RESERVEHUB", 105, 18, { align: "center" });

    pdf.setFontSize(11);
    pdf.text("RESOURCE RESERVATION RECEIPT", 105, 30, {
      align: "center",
    });

    // Receipt content
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(16);
    pdf.text("Booking Confirmation", 20, 58);

    pdf.setFontSize(11);

    const resourceName =
      createdBooking.resource?.name ||
      resources.find((resource) => resource.id === resourceId)?.name ||
      createdBooking.resourceName ||
      "Reserved Resource";

    const details: [string, string][] = [
      ["Booking ID", createdBooking.bookingId],
      ["Status", createdBooking.status || "CONFIRMED"],
      ["Booked By", employee?.fullName || employee?.name || "Employee"],
      ["Employee Number", employee?.employeeNumber || "Not available"],
      ["Resource", resourceName],
      [
        "Booking For",
        createdBooking.bookingFor || bookingFor,
      ],
      [
        "Start Date & Time",
        createdBooking.startTime
          ? new Date(createdBooking.startTime).toLocaleString()
          : startTime || "Not available",
      ],
      [
        "End Date & Time",
        createdBooking.endTime
          ? new Date(createdBooking.endTime).toLocaleString()
          : endTime || "Not available",
      ],
      ["Receipt Generated", new Date().toLocaleString()],
    ];

    let y = 72;

    details.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(243, 246, 250);
        pdf.rect(18, y - 6, 174, 13, "F");
      }

      pdf.setTextColor(70, 80, 95);
      pdf.text(label, 23, y + 2);

      pdf.setTextColor(30, 40, 55);
      const lines = pdf.splitTextToSize(String(value), 95);
      pdf.text(lines, 90, y + 2);

      y += Math.max(13, lines.length * 5 + 4);
    });

    pdf.setDrawColor(210, 218, 228);
    pdf.line(20, y + 5, 190, y + 5);

    pdf.setFontSize(10);
    pdf.setTextColor(70, 80, 95);
    pdf.text("Thank you for using ReserveHub!", 105, y + 15, {
      align: "center",
    });

    pdf.save(`ReserveHub-${createdBooking.bookingId}.pdf`);
  }


  useEffect(() => {
    async function loadData() {
      try {
        const [resourceResponse, employeeResponse] = await Promise.all([
          fetch("/api/resources"),
          fetch("/api/auth/me"),
        ]);

        const resourceData = await resourceResponse.json();

        if (!resourceResponse.ok) {
          throw new Error(
            resourceData.error || "Unable to load resources."
          );
        }

        
const resourceList: Resource[] = Array.isArray(resourceData)
  ? resourceData
  : resourceData.data ?? resourceData.resources ?? [];

        setResources(
          resourceList.filter((resource) => resource.status === "ACTIVE")
        );

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();

          setEmployee(
            employeeData.employee ??
              employeeData.user ??
              employeeData
          );
        } else {
          window.location.href = "/login";
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking details."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, []);

  function getLocalDateTime(value: string) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setWhatsappUrl("");
    setCreatedBooking(null);

    if (!resourceId) {
      setError("Please select a resource.");
      return;
    }

    const start = getLocalDateTime(startTime);
    const end = getLocalDateTime(endTime);

    if (!start || !end) {
      setError("Please enter a valid start and end time.");
      return;
    }

    if (start <= new Date()) {
      setError("The booking start time must be in the future.");
      return;
    }

    if (end <= start) {
      setError("The end time must be after the start time.");
      return;
    }

    const duration = end.getTime() - start.getTime();

    if (duration > 24 * 60 * 60 * 1000) {
      setError("A booking cannot be longer than 24 hours.");
      return;
    }

    if (bookingFor === "EMPLOYEE" && !targetEmployeeNumber.trim()) {
      setError("Please enter the recipient employee number.");
      return;
    }

    if (bookingFor === "VISITOR" && !visitorName.trim()) {
      setError("Please enter the visitor's name.");
      return;
    }

    let cleanWhatsApp = "";

    if (bookingFor !== "SELF") {
      cleanWhatsApp = recipientWhatsApp.replace(/\D/g, "");

      if (!/^[1-9]\d{7,14}$/.test(cleanWhatsApp)) {
        setError(
          "Enter a valid WhatsApp number with the country code, without + or spaces. Example: 94771234567."
        );
        return;
      }
    }

    if (visitorEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(visitorEmail.trim())) {
        setError("Please enter a valid visitor email address.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId,
          bookingFor,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
         employeeNumber:
  bookingFor === "EMPLOYEE"
    ? targetEmployeeNumber.trim()
    : undefined, 
          visitorName:
            bookingFor === "VISITOR" ? visitorName.trim() : undefined,
          visitorEmail:
            bookingFor === "VISITOR" && visitorEmail.trim()
              ? visitorEmail.trim()
              : undefined,
          recipientWhatsApp:
            bookingFor !== "SELF" ? cleanWhatsApp : undefined,
        }),
      });

      const result: BookingResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Booking could not be created."
        );
      }

      const booking = result.data ?? result.reservation ?? result.booking ?? null;

      setCreatedBooking(booking);
      setWhatsappUrl(result.whatsappUrl ?? "");
      setMessage(
        result.message ||
          (bookingFor === "SELF"
            ? "Your reservation has been created."
            : "Your reservation has been created. Send the WhatsApp invitation to the recipient.")
      );

      if (bookingFor === "SELF") {
        setTargetEmployeeNumber("");
        setVisitorName("");
        setVisitorEmail("");
        setRecipientWhatsApp("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the reservation."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setResourceId("");
    setBookingFor("SELF");
    setTargetEmployeeNumber("");
    setVisitorName("");
    setVisitorEmail("");
    setRecipientWhatsApp("");
    setStartTime("");
    setEndTime("");
    setError("");
    setMessage("");
    setWhatsappUrl("");
    setCreatedBooking(null);
  }

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <p className="text-gray-600">Loading booking details...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              New Reservation
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Reserve a resource for yourself, another employee, or a visitor.
            </p>
          </div>

          <Link
            href="/resources"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to Resources
          </Link>
        </div>

        {employee && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Your Employee Details
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {employee.fullName || employee.name || "Employee"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Employee Number</p>
                <p className="font-medium text-gray-900">
                  {employee.employeeNumber || "Not available"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{employee.email}</p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <p className="font-medium">{message}</p>

            {createdBooking?.bookingId && (
              <p className="mt-2">
                Booking ID:{" "}
                <strong>{createdBooking.bookingId}</strong>
              </p>
            )}

            {createdBooking?.status && (
              <p className="mt-1">
                Status: <strong>{createdBooking.status}</strong>
              </p>
            )}
          
{createdBooking?.bookingId && (
  <button
    type="button"
    onClick={downloadReceipt}
    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
  >
    <span>↓</span>
    Download PDF Receipt
  </button>
)}

            {whatsappUrl && (
              <div className="mt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Open WhatsApp Invitation
                </a>

                <p className="mt-2 text-sm">
                  WhatsApp will open with a prepared message. Press Send in
                  WhatsApp to deliver the invitation.
                </p>
              </div>
            )}

            {bookingFor !== "SELF" && !whatsappUrl && (
              <p className="mt-2 text-sm">
                No WhatsApp link was returned. Check that your reservation API
                returns a whatsappUrl.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
              >
                Book Another Resource
              </button>

              <Link
                href="/resources"
                className="rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-900"
              >
                Return to Resources
              </Link>
            </div>
          </div>
        )}

        {!createdBooking && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="resourceId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >

                Select Resource *
              </label>

              <select
                id="resourceId"
                value={resourceId}
                onChange={(event) => setResourceId(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Choose a resource</option>

                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>

              {resources.length === 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  No active resources were found.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bookingFor"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Booking For *
              </label>

              <select
                id="bookingFor"
                value={bookingFor}
                onChange={(event) =>
                  setBookingFor(
                    event.target.value as "SELF" | "EMPLOYEE" | "VISITOR"
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="SELF">Myself</option>
                <option value="EMPLOYEE">Another Employee</option>
                <option value="VISITOR">Outside Visitor</option>
              </select>
            </div>

            {bookingFor === "EMPLOYEE" && (
              <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                <h2 className="font-semibold text-gray-900">
                  Recipient Employee Details
                </h2>

                <div>
                  <label
                    htmlFor="targetEmployeeNumber"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Employee Number *
                  </label>

                  <input
                    id="targetEmployeeNumber"
                    type="text"
                    value={targetEmployeeNumber}
                    onChange={(event) =>
                      setTargetEmployeeNumber(event.target.value)
                    }
                    placeholder="Example: EMP008"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="employeeWhatsApp"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Employee WhatsApp Number *
                  </label>

                  <input
                    id="employeeWhatsApp"
                    type="tel"
                    value={recipientWhatsApp}
                    onChange={(event) =>
                      setRecipientWhatsApp(event.target.value)
                    }
                    placeholder="94771234567"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Include the country code. Do not include + or spaces.
                  </p>
                </div>
              </div>
            )}

            {bookingFor === "VISITOR" && (
              <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                <h2 className="font-semibold text-gray-900">
                  Visitor Details
                </h2>

                <div>
                  <label
                    htmlFor="visitorName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Visitor Name *
                  </label>

                  <input
                    id="visitorName"
                    type="text"
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                    placeholder="Enter visitor's full name"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="visitorWhatsApp"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Visitor WhatsApp Number *
                  </label>

                  <input
                    id="visitorWhatsApp"
                    type="tel"
                    value={recipientWhatsApp}
                    onChange={(event) =>
                      setRecipientWhatsApp(event.target.value)
                    }
                    placeholder="94771234567"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Include the country code. Do not include + or spaces.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="visitorEmail"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Visitor Email (Optional)
                  </label>

                  <input
                    id="visitorEmail"
                    type="email"
                    value={visitorEmail}
                    onChange={(event) => setVisitorEmail(event.target.value)}
                    placeholder="visitor@example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Start Date and Time *
                </label>

                <input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  End Date and Time *
                </label>

                <input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p>
                <strong>Important:</strong> Bookings for another employee or
                visitor require recipient confirmation.
              </p>
              <p className="mt-1">
                A booking cannot exceed 24 hours. Overlapping reservations are
                rejected by the server.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || resources.length === 0}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Reservation..." : "Create Reservation"}
            </button>
          </form>
        )}
      </div>
    
    </main>
  );
}
