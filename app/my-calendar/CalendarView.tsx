
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";

type CalendarViewProps = {
  events: EventInput[];
  onEventClick: (info: EventClickArg) => void;
};

export default function CalendarView({
  events,
  onEventClick,
}: CalendarViewProps) {
  return (
    <div className="reservehub-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        events={events}
        eventClick={onEventClick}
        height="auto"
        nowIndicator={true}
        dayMaxEvents={true}
        weekends={true}
        displayEventTime={true}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        eventContent="No reservations for this period."
      />
    </div>
  );
}
