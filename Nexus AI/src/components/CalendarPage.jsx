import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Ensure CSS is imported

import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';

// Setup the localizer by providing the moment Object
const localizer = momentLocalizer(moment);

// Create the Drag and Drop Calendar component
const DnDCalendar = withDragAndDrop(Calendar);

// *** NEW: Define custom date formats ***
const calendarFormats = {
    // Format for the Month view header (e.g., "October 2025")
    monthHeaderFormat: 'MMMM YYYY',
    // Format for the Week view header (e.g., "Oct 27 – Nov 02") - moment range format
    // 'L' is moment's locale default short date (often MM/DD/YYYY or DD/MM/YYYY based on locale)
    // We explicitly set it to DD/MM/YYYY
    dayRangeHeaderFormat: ({ start, end }, culture, local) =>
        local.format(start, 'DD/MM/YYYY', culture) + ' – ' +
        local.format(end, 'DD/MM/YYYY', culture),
    // Format for the Day view header (e.g., "Wednesday, Oct 29")
    dayHeaderFormat: 'dddd, DD/MM', // Keep day name, add DD/MM
    // Format for the Agenda view date column
    agendaDateFormat: 'DD/MM', // Short date for agenda
    // Format for the Agenda view time column
    agendaTimeFormat: 'HH:mm', // 24-hour time
    // Format for the Agenda view range (e.g., "10:00 AM — 11:30 AM")
    agendaTimeRangeFormat: ({ start, end }, culture, local) =>
        local.format(start, 'HH:mm', culture) + ' — ' +
        local.format(end, 'HH:mm', culture),
    // Format for the event start time tooltip/display
    eventTimeFormat: 'HH:mm',
    // Format for the day number in Month view
    dateFormat: 'D',
    // Format for the time shown in the gutter (left side) of Week/Day view
    timeGutterFormat: 'HH:mm',

    // You can customize others as needed, see react-big-calendar docs for all keys
};


// Helper to format date for Add/Edit Modal (YYYY-MM-DD) - Keep this for input fields
const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
    // --- State ---
    const [events, setEvents] = useState([
        { id: 1, title: 'Plan trip to Ladakh', start: new Date(2025, 9, 29, 10, 0, 0), end: new Date(2025, 9, 29, 11, 30, 0), resourceId: 'task' },
        { id: 2, title: 'Nexus AI Presentation Prep', start: new Date(2025, 10, 5), end: new Date(2025, 10, 6), allDay: true, resourceId: 'project' },
        { id: 3, title: 'Grocery Shopping', start: new Date(2025, 10, 1, 14, 0, 0), end: new Date(2025, 10, 1, 15, 0, 0), resourceId: 'task' }
    ]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // --- Calendar Event Handlers ---
    const moveEventHandler = useCallback(
        ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {};
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...existing, start, end, allDay: droppedOnAllDaySlot ?? event.allDay }];
            });
            console.log(`Moved event "${event.title}" to ${moment(start).format('DD/MM/YYYY HH:mm')}`);
            // Add API call here
        },
        [setEvents]
    );

    const resizeEventHandler = useCallback(
        ({ event, start, end }) => {
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {};
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...existing, start, end }];
            });
            console.log(`Resized event "${event.title}" to end at ${moment(end).format('DD/MM/YYYY HH:mm')}`);
            // Add API call here
        },
        [setEvents]
    );

    const handleSelectSlot = useCallback(
        ({ start, end }) => {
            // Format start/end for the prompt using DD/MM/YYYY HH:mm
            const startFormatted = moment(start).format('DD/MM/YYYY HH:mm');
            const endFormatted = moment(end).format('DD/MM/YYYY HH:mm');
            const title = window.prompt(`New Event Name (Starts: ${startFormatted} Ends: ${endFormatted})`);
            if (title) {
                const newEvent = {
                    id: Date.now(),
                    title,
                    start,
                    end,
                    allDay: start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0 && moment(end).diff(start, 'days') >= 1, // Improved allDay check
                    resourceId: 'task',
                };
                setEvents((prev) => [...prev, newEvent]);
                console.log('Added new event:', newEvent);
                // Add API call here
            }
        },
        [setEvents]
    );

    const handleSelectEvent = useCallback(
        (event) => {
             // Format start/end for the alert using DD/MM/YYYY HH:mm
            const startFormatted = moment(event.start).format('DD/MM/YYYY HH:mm');
            const endFormatted = moment(event.end).format('DD/MM/YYYY HH:mm');
            window.alert(`Selected Event: ${event.title}\nStarts: ${startFormatted}\nEnds: ${endFormatted}`);
        },
        []
    );

    const { defaultDate, scrollToTime } = useMemo(
        () => ({
            defaultDate: new Date(),
            scrollToTime: new Date(1970, 1, 1, 6),
        }),
        []
    );

    return (
        <div className="flex h-full w-full overflow-hidden">
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
            <main className="flex-1 flex flex-col overflow-hidden custom-scrollbar relative">
                <Header userName={userName} />
                <div className="flex-grow p-6 bg-white/5 backdrop-blur-sm border border-white/10 m-6 rounded-xl shadow-xl overflow-auto custom-scrollbar">
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        formats={calendarFormats} // *** APPLY CUSTOM FORMATS ***
                        defaultDate={defaultDate}
                        defaultView={view}
                        view={view}
                        date={date}
                        onNavigate={setDate}
                        onView={setView}
                        onEventDrop={moveEventHandler}
                        onEventResize={resizeEventHandler}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable
                        resizable
                        style={{ height: '100%', minHeight: '600px' }}
                        className="text-white rbc-calendar-nexus" // Add custom class for deeper styling if needed
                        components={{
                            // toolbar: CustomToolbar, // Example if you create a custom toolbar
                        }}
                        eventPropGetter={(event) => {
                            const style = {
                                backgroundColor: event.resourceId === 'project' ? '#6366f1' : '#ef4444',
                                borderColor: event.resourceId === 'project' ? '#4f46e5' : '#dc2626',
                            };
                            return { style };
                        }}
                        dayPropGetter={(date) => {
                          const dayOfWeek = moment(date).day();
                          if (dayOfWeek === 0 || dayOfWeek === 6) {
                            return { style: { backgroundColor: 'rgba(255, 255, 255, 0.03)' } };
                          }
                          return {};
                        }}
                    />
                </div>
                <div className="fixed bottom-6 right-6 z-50">
                    <IconButton
                        icon={<span className="text-2xl">🤖</span>}
                        className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50"
                        onClick={() => alert("Nexus AI Clicked!")}
                    />
                </div>
            </main>
        </div>
    );
};

export default CalendarPage;