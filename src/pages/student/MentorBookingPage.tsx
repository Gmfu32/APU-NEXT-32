import React, { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Info, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MENTOR_PROFILES } from '../../data/mentorsAndWorkshops';
import { DemoAvatar } from '../../components/common/DemoAvatar';
import { BookingRecord, MentorProfile } from '../../types';

export const MentorBookingPage: React.FC = () => {
  const { bookings, bookedSlotIds, bookMentorSlot, cancelBooking, focusedEntityId } = useApp();

  const [mentorTypeFilter, setMentorTypeFilter] = useState<'All' | 'University Lecturer' | 'Alumni Mentor'>('All');
  const [selectedSlotByMentor, setSelectedSlotByMentor] = useState<Record<string, string>>({});
  const [bookingModalMentor, setBookingModalMentor] = useState<MentorProfile | null>(null);
  const [topic, setTopic] = useState('CV & Industrial Placement Strategy Review');
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  const visibleMentors = MENTOR_PROFILES.filter(
    (m) => mentorTypeFilter === 'All' || m.mentorType === mentorTypeFilter
  );

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalMentor) return;
    const slotId = selectedSlotByMentor[bookingModalMentor.id];
    const slot = bookingModalMentor.slots.find((s) => s.id === slotId);
    if (!slot) return;

    const record = bookMentorSlot({
      mentorId: bookingModalMentor.id,
      mentorName: bookingModalMentor.name,
      mentorTitle: bookingModalMentor.title,
      slotId: slot.id,
      day: slot.day,
      time: slot.time,
      topic: topic.trim() || 'Career Consultation',
      notes: notes.trim(),
    });

    if (record) {
      setBookingModalMentor(null);
      setNotes('');
      setConfirmedBooking(record);
    }
  };

  // DEDICATED BOOKING CONFIRMATION SCREEN
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              Demonstration Appointment Confirmed
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Consultation Slot Reserved
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Reference ID: <span className="font-mono tabular-nums">{confirmedBooking.id}</span> ·
              Slot locked against duplicate booking in this session
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Mentor / Lecturer</span>
              <span className="font-bold text-slate-900 text-right">{confirmedBooking.mentorName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-mono tabular-nums font-bold text-blue-700">
                {confirmedBooking.day} · {confirmedBooking.time}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Discussion Topic</span>
              <span className="font-semibold text-slate-800 text-right">{confirmedBooking.topic}</span>
            </div>
            {confirmedBooking.notes && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-0.5">Preparation Notes</span>
                <span className="text-slate-700">{confirmedBooking.notes}</span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmedBooking(null)}
              className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Return to Mentor Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lecturer & Mentor Booking</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reserve 1-on-1 career, CV, and FYP alignment consultations with fictional demonstration
            lecturers and alumni mentors.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 self-start">
          {(['All', 'University Lecturer', 'Alumni Mentor'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMentorTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                mentorTypeFilter === tab ? 'bg-[#0D1526] text-white' : 'text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Simulated Availability:</strong> All lecturer and alumni profiles below are
          fictional demonstration personas. Booked time slots are immediately locked in frontend
          state to prevent duplicate bookings.
        </span>
      </div>

      {/* Existing Confirmed Bookings Strip */}
      {bookings.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>Your Confirmed Appointments ({bookings.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bookings.map((bk) => (
              <div
                key={bk.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{bk.mentorName}</p>
                  <p className="font-mono tabular-nums text-blue-700 font-semibold mt-0.5">
                    {bk.day} · {bk.time}
                  </p>
                  <p className="text-slate-500 mt-0.5">{bk.topic}</p>
                </div>
                <button
                  type="button"
                  onClick={() => cancelBooking(bk.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-600"
                  title="Cancel booking and release slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mentor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibleMentors.map((mentor) => {
          const isHighlighted = focusedEntityId === mentor.id;
          const chosenSlotId = selectedSlotByMentor[mentor.id] || '';

          return (
            <article
              key={mentor.id}
              className={`bg-white rounded-xl border p-6 flex flex-col justify-between space-y-5 transition-colors ${
                isHighlighted ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start gap-4">
                  <DemoAvatar seed={mentor.avatarSeed} name={mentor.name} size="lg" showDemoTag />
                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      {mentor.mentorType} · Available {mentor.availableDays.join(', ')}
                    </p>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{mentor.name}</h2>
                    <p className="text-xs text-slate-600">{mentor.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {mentor.departmentOrCompany}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{mentor.bio}</p>

                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">Expertise:</strong>{' '}
                  {mentor.expertise.join(' · ')}
                </p>

                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-800 mb-2">
                    Select Available Time Slot ({mentor.sessionType}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mentor.slots.map((slot) => {
                      const alreadyBooked = bookedSlotIds.includes(slot.id);
                      const isSelected = chosenSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={alreadyBooked}
                          onClick={() =>
                            setSelectedSlotByMentor({
                              ...selectedSlotByMentor,
                              [mentor.id]: slot.id,
                            })
                          }
                          className={`px-3 py-2 rounded-lg border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                            alreadyBooked
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                              : 'border-slate-200 hover:border-blue-400 text-slate-700'
                          }`}
                        >
                          <span className="font-mono tabular-nums truncate">
                            {slot.day} · {slot.time.split('–')[0].trim()}
                          </span>
                          <span className="text-[10px] font-semibold shrink-0">
                            {alreadyBooked ? 'Booked' : isSelected ? 'Selected' : 'Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  30-min Demo Consultation
                </span>
                <button
                  type="button"
                  disabled={!chosenSlotId || bookedSlotIds.includes(chosenSlotId)}
                  onClick={() => setBookingModalMentor(mentor)}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Continue to Confirm →
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Inline Booking Notes Modal */}
      {bookingModalMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Confirm Mentor Booking</h2>
              <p className="text-xs text-slate-500 mt-0.5">{bookingModalMentor.name}</p>
            </div>
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Topic *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Questions or Links to Share Ahead (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sharing my 1-page CV and FYP problem statement..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalMentor(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
