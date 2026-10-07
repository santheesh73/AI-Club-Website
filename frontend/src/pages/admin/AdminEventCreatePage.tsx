import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { eventsApi } from '@/services/eventsApi';
import { Button } from '@/components/ui/Button';
import type { EventCategory, EventMode, EventEligibility } from '@/types/events';

export const AdminEventCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('workshop');
  const [eventMode, setEventMode] = useState<EventMode>('physical');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [registrationOpenAt, setRegistrationOpenAt] = useState('');
  const [registrationCloseAt, setRegistrationCloseAt] = useState('');
  const [capacity, setCapacity] = useState<string>('50');
  const [eligibility, setEligibility] = useState<EventEligibility>('members_only');
  const [speaker, setSpeaker] = useState('');
  const [organizer, setOrganizer] = useState('AI Club Collective');
  const [requirements, setRequirements] = useState('');
  const [tags, setTags] = useState('AI, Workshop');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!shortDescription.trim() || shortDescription.trim().length < 5) {
      setError('Short description must be at least 5 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Detailed description must be at least 10 characters.');
      return;
    }
    if (!startAt || !endAt || !registrationOpenAt || !registrationCloseAt) {
      setError('All 4 scheduling timestamps are required.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError('End date must be strictly after start date.');
      return;
    }
    if (new Date(registrationCloseAt) <= new Date(registrationOpenAt)) {
      setError('Registration close date must be after registration open date.');
      return;
    }
    if (new Date(registrationCloseAt) > new Date(startAt)) {
      setError('Registration must close on or before the event start date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await eventsApi.createEvent({
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        category,
        eventMode,
        location: eventMode !== 'online' ? location.trim() : null,
        isOnline: eventMode === 'online' || eventMode === 'hybrid',
        meetingUrl: eventMode !== 'physical' && meetingUrl.trim() ? meetingUrl.trim() : null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        registrationOpenAt: new Date(registrationOpenAt).toISOString(),
        registrationCloseAt: new Date(registrationCloseAt).toISOString(),
        capacity: capacity ? parseInt(capacity, 10) : null,
        eligibility,
        speaker: speaker.trim() || null,
        organizer: organizer.trim() || null,
        requirements: requirements.trim() || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      if (res.success) {
        navigate('/admin/events');
      } else {
        setError(res.error.message || 'Failed to create event');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Event creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Event Oversight</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
          Create New Club Event
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Define event curriculum, configure registration windows, and prepare initial DRAFT state.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-card-sm bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata Card */}
        <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
            1. Core Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed LLM Inference Workshop"
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="tech_talk">Tech Talk</option>
                <option value="webinar">Webinar</option>
                <option value="competition">Competition</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Eligibility <span className="text-red-500">*</span>
              </label>
              <select
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value as EventEligibility)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="members_only">Members Only (Default)</option>
                <option value="public">Open to Public</option>
                <option value="admin_only">Admin / Committee Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Short Summary Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief overview displayed on discovery cards (1-2 sentences)"
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Full Event Curriculum & Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed syllabus, topics covered, schedule agenda, and deliverables..."
              rows={5}
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>
        </div>

        {/* Scheduling & Capacity Card */}
        <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
            2. Schedule & Attendance Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Event Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Event End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Registration Opens At <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={registrationOpenAt}
                onChange={(e) => setRegistrationOpenAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Registration Closes At <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={registrationCloseAt}
                onChange={(e) => setRegistrationCloseAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Seat Capacity (Leave blank for unlimited)
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Event Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={eventMode}
                onChange={(e) => setEventMode(e.target.value as EventMode)}
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="physical">In-Person (Physical Venue)</option>
                <option value="online">Virtual / Online Meeting</option>
                <option value="hybrid">Hybrid (Both Venue & Stream)</option>
              </select>
            </div>
          </div>

          {eventMode !== 'online' && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Physical Location / Venue Room
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. AI Innovation Lab, Block 4, Room 204"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          )}

          {eventMode !== 'physical' && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Online Meeting Stream URL
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.aiclub.internal/session-key"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          )}
        </div>

        {/* Additional Logistics Card */}
        <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono pb-2 border-b border-surface-border">
            3. Speaker & Logistics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Keynote Speaker / Lead Instructor
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Dr. Jane Doe (Staff Research Scientist)"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Organizing Entity / Guild
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g. AI Club Machine Learning Wing"
                className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Prerequisites & Requirements
            </label>
            <input
              type="text"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. Laptop with Python 3.10+ and PyTorch installed."
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="PyTorch, Deep Learning, Vision"
              className="w-full px-3 py-2 text-xs rounded-card-sm border border-surface-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/admin/events">
            <Button variant="ghost" size="md" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="bg-ink text-canvas font-semibold"
          >
            <span>{isSubmitting ? 'Creating Event...' : 'Create Draft Event'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
