import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MapPin,
  Phone,
  RefreshCw,
  Siren,
  Smartphone,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import api from '../../utils/api.js';
import { currentGeolocation, triggerEmergency } from '../../services/emergencyTrigger.js';
import type { EmergencyContactRecord, EmergencyEventRecord } from '../../services/emergencyTrigger.js';

const MIN_CONTACTS = 2;
const MAX_CONTACTS = 3;
const HOLD_MS = 2400;
const MULTI_TAP_WINDOW_MS = 2000;
const MULTI_TAP_TAPS = 5;

interface ContactDraft {
  name: string;
  phone: string;
  relationship: string;
  contactType: 'FAMILY' | 'FRIEND' | 'STAFF' | 'SUPPORT' | 'OTHER';
  isStaffContact: boolean;
}

const EMPTY_DRAFT: ContactDraft = {
  name: '',
  phone: '',
  relationship: '',
  contactType: 'OTHER',
  isStaffContact: false,
};

export const EmergencySosPanel: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContactRecord[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_DRAFT);
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');

  const [events, setEvents] = useState<EmergencyEventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ success: boolean; message: string; data?: EmergencyEventRecord } | null>(null);

  const [sosPhase, setSosPhase] = useState<'idle' | 'holding' | 'multiTap'>('idle');
  const holdTimerRef = useRef<number | null>(null);
  const tapSequenceRef = useRef<{ count: number; windowStart: number }>({ count: 0, windowStart: 0 });
  const [tapProgress, setTapProgress] = useState(0);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    setContactsError('');
    try {
      const response = await api.get('/emergency/me/contacts');
      setContacts(response.data.data || []);
    } catch {
      setContactsError('Could not load your emergency contacts.');
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const response = await api.get('/emergency/me/events');
      setEvents(response.data.data || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
    void loadEvents();
  }, [loadContacts, loadEvents]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    };
  }, []);

  const refreshAll = () => {
    void loadContacts();
    void loadEvents();
  };

  const handleStartHold = () => {
    if (triggering) return;
    setTriggerResult(null);
    setSosPhase('holding');
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      setSosPhase('idle');
      void fireTrigger('PRESS_AND_HOLD');
    }, HOLD_MS);
  };

  const handleCancelHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setSosPhase('idle');
  };

  const handleTap = () => {
    if (triggering) return;
    const now = Date.now();
    const seq = tapSequenceRef.current;
    if (now - seq.windowStart > MULTI_TAP_WINDOW_MS) {
      seq.count = 0;
      seq.windowStart = now;
    }
    seq.count += 1;
    setTapProgress(seq.count);
    if (seq.count >= MULTI_TAP_TAPS) {
      seq.count = 0;
      setTapProgress(0);
      setSosPhase('idle');
      void fireTrigger('MULTI_TAP');
      return;
    }
    setSosPhase('multiTap');
    window.setTimeout(() => {
      if (Date.now() - seq.windowStart > MULTI_TAP_WINDOW_MS) {
        seq.count = 0;
        setTapProgress(0);
        setSosPhase('idle');
      }
    }, MULTI_TAP_WINDOW_MS + 50);
  };

  const fireTrigger = async (source: 'PRESS_AND_HOLD' | 'MULTI_TAP' | 'IN_APP_SOS') => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const location = await currentGeolocation();
      const result = await triggerEmergency({ triggerSource: source, location });
      setTriggerResult({
        success: result.success,
        message: result.message || (result.success ? 'Emergency alert raised.' : 'The emergency alert could not be raised.'),
        data: result.data,
      });
      void loadEvents();
    } catch (error: any) {
      setTriggerResult({
        success: false,
        message: error?.response?.data?.message || 'Your emergency alert could not reach the server. Call the emergency helpline instead.',
      });
    } finally {
      setTriggering(false);
      setSosPhase('idle');
    }
  };

  const openNewContact = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setContactError('');
    setContactMessage('');
  };

  const openEditContact = (contact: EmergencyContactRecord) => {
    setEditingId(contact._id);
    setDraft({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      contactType: contact.contactType,
      isStaffContact: contact.isStaffContact,
    });
    setContactError('');
    setContactMessage('');
  };

  const removeContact = async (contact: EmergencyContactRecord) => {
    if (!window.confirm(`Remove ${contact.name} as an emergency contact?`)) return;
    try {
      await api.delete(`/emergency/me/contacts/${contact._id}`);
      setContactMessage('Contact removed.');
      setContactError('');
      void loadContacts();
    } catch (error: any) {
      setContactError(error?.response?.data?.message || 'Could not remove the contact.');
    }
  };

  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingContact(true);
    setContactError('');
    setContactMessage('');
    try {
      const payload = {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        relationship: draft.relationship.trim(),
        contactType: draft.contactType,
        isStaffContact: draft.isStaffContact,
      };
      const response = editingId
        ? await api.put(`/emergency/me/contacts/${editingId}`, payload)
        : await api.post('/emergency/me/contacts', payload);
      setContactMessage(response.data.message || 'Emergency contact saved.');
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      void loadContacts();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      const details = error?.response?.data?.errors;
      setContactError(
        typeof message === 'string'
          ? message
          : (details?.[0]?.message) || 'Could not save the emergency contact.',
      );
    } finally {
      setSavingContact(false);
    }
  };

  const holdProgressPct = sosPhase === 'holding' ? 100 : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      {/* Emergency trigger */}
      <section className="rounded-[22px] border border-[#ffe1ec] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0f5] text-[#e91670]"><Siren className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-black text-[#071426]">Campus SOS</h2>
            <p className="mt-1 text-xs font-semibold text-[#64748b]">Raises a live alert to your saved safety circle on press-and-hold.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4">
          <p className="max-w-sm text-center text-xs font-semibold leading-5 text-[#64748b]">
            {contacts.length < MIN_CONTACTS
              ? `Add at least ${MIN_CONTACTS} emergency contacts below before the alert can be sent.`
              : `${contacts.length} of ${MAX_CONTACTS} contact slots filled. Press and hold for a moment (or tap ${MULTI_TAP_TAPS} times quickly) to send.`}
          </p>

          <button
            type="button"
            disabled={triggering || contacts.length < MIN_CONTACTS}
            onPointerDown={handleStartHold}
            onPointerUp={handleCancelHold}
            onPointerLeave={handleCancelHold}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleStartHold();
              }
            }}
            onKeyUp={(event) => {
              if (event.key === 'Enter' || event.key === ' ') handleCancelHold();
            }}
            onClick={handleTap}
            aria-label="Trigger emergency alert. Press and hold or tap 5 times quickly."
            className="relative grid h-28 w-28 select-none place-items-center rounded-full bg-gradient-to-br from-[#ff0b6b] to-[#b8074c] text-white shadow-[0_16px_32px_rgba(233,22,112,0.35)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sosPhase === 'holding' && (
              <span className="absolute inset-0 rounded-full border-4 border-white/80" style={{ transform: 'scale(1.15)' }} />
            )}
            <span className="flex flex-col items-center gap-1">
              <Siren className="h-7 w-7" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em]">SOS</span>
            </span>
            {sosPhase === 'multiTap' && (
              <span className="absolute -bottom-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#e91670] shadow-sm">
                {MULTI_TAP_TAPS - tapProgress} taps left
              </span>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#64748b]">
            <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Press & hold {Math.round(HOLD_MS / 1000)}s</span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Tap ×{MULTI_TAP_TAPS}</span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Uses device location</span>
          </div>
        </div>

        {triggering && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f6f8ff] px-4 py-3 text-xs font-bold text-[#2563eb]">
            <RefreshCw className="h-4 w-4 animate-spin" /> Capturing location and raising your alert…
          </div>
        )}

        {triggerResult && (
          <div className={`mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-xs font-bold ${triggerResult.success ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-red-50 text-red-700'}`}>
            {triggerResult.success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div className="min-w-0">
              <p>{triggerResult.message}</p>
              {triggerResult.data?.locationLink && (
                <a
                  href={triggerResult.data.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[#2563eb] underline"
                >
                  <MapPin className="h-3.5 w-3.5" /> View shared location
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Contacts manager */}
      <section className="rounded-[22px] border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-[#2563eb]"><Phone className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black text-[#071426]">Emergency Contacts</h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">Your private safety circle ({contacts.length}/{MAX_CONTACTS}).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewContact}
            disabled={contacts.length >= MAX_CONTACTS}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-3 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> Add
          </button>
        </div>

        {contactsError && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            <span>{contactsError}</span>
            <button type="button" onClick={() => void loadContacts()} className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {contactsLoading ? (
          <div className="mt-4 space-y-2">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-[#f1f5fb]" />)}</div>
        ) : contacts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#dfe7fb] bg-[#fafbff] p-5 text-center">
            <p className="text-sm font-black text-[#071426]">No emergency contacts yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs font-semibold text-[#64748b]">Add 2–3 people you trust — for example a parent, a close friend, or a staff coordinator.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {contacts.map(contact => (
              <li key={contact._id} className="flex items-center gap-3 rounded-lg border border-[#edf2fb] p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef3ff] text-[#2563eb]"><Phone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-black text-[#071426]">
                    {contact.name}
                    {contact.isStaffContact && <span className="rounded bg-[#f4ecff] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#7c3aed]">Staff</span>}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#64748b]">{contact.relationship} · {contact.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`} className="rounded-lg p-2 text-[#2563eb] hover:bg-[#eef3ff]"><Phone className="h-4 w-4" /></a>
                  <button type="button" onClick={() => openEditContact(contact)} aria-label={`Edit ${contact.name}`} className="rounded-lg p-2 text-[#52617f] hover:bg-[#f1f5fb]"><Eye className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void removeContact(contact)} aria-label={`Remove ${contact.name}`} className="rounded-lg p-2 text-[#e91670] hover:bg-[#fff0f5]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {(editingId !== null || contacts.length < MAX_CONTACTS) && (
          <form onSubmit={submitContact} className="mt-5 space-y-3 rounded-lg border border-[#edf2fb] bg-[#fafbff] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2563eb]">{editingId ? 'Edit contact' : 'New contact'}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[#52617f]">Full name
                <input required minLength={2} maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold text-[#071426] outline-none focus:border-[#6d5dfc]" />
              </label>
              <label className="block text-xs font-bold text-[#52617f]">Phone number
                <input required minLength={7} maxLength={24} type="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="+91 …" className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold text-[#071426] outline-none focus:border-[#6d5dfc]" />
              </label>
              <label className="block text-xs font-bold text-[#52617f]">Relationship
                <input required minLength={2} maxLength={80} value={draft.relationship} onChange={(event) => setDraft({ ...draft, relationship: event.target.value })} placeholder="Mother, Guardian, Friend…" className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold text-[#071426] outline-none focus:border-[#6d5dfc]" />
              </label>
              <label className="block text-xs font-bold text-[#52617f]">Type
                <select value={draft.contactType} onChange={(event) => setDraft({ ...draft, contactType: event.target.value as ContactDraft['contactType'] })} className="mt-1 w-full rounded-lg border border-[#dfe7fb] bg-white px-3 py-2.5 text-sm font-semibold text-[#071426] outline-none focus:border-[#6d5dfc]">
                  <option value="FAMILY">Family</option>
                  <option value="FRIEND">Friend</option>
                  <option value="STAFF">Staff</option>
                  <option value="SUPPORT">Support</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#52617f]">
              <input type="checkbox" checked={draft.isStaffContact} onChange={(event) => setDraft({ ...draft, isStaffContact: event.target.checked })} className="h-4 w-4 accent-[#7c3aed]" />
              Staff coordinator / designated caretaker (prioritized)
            </label>
            {contactMessage && <p className="text-xs font-bold text-[#059669]">{contactMessage}</p>}
            {contactError && <p className="text-xs font-bold text-[#dc2626]">{contactError}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={savingContact} className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
                {savingContact ? 'Saving…' : (editingId ? 'Save changes' : 'Save contact')}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setDraft(EMPTY_DRAFT); }} className="rounded-lg px-3 py-2.5 text-xs font-black text-[#52617f]">Cancel</button>
              )}
            </div>
          </form>
        )}
      </section>

      {/* Event history */}
      <section className="rounded-[22px] border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] xl:col-span-2 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4ecff] text-[#7c3aed]"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black text-[#071426]">Alert History</h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">Every time an alert is raised, it is logged with its dispatch status.</p>
            </div>
          </div>
          <button type="button" onClick={refreshAll} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#2563eb]"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>

        {eventsLoading ? (
          <div className="mt-4 space-y-2">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-[#f1f5fb]" />)}</div>
        ) : events.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-[#dfe7fb] bg-[#fafbff] p-5 text-center text-sm font-semibold text-[#64748b]">No alerts have been raised yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#eef2fb]">
            {events.slice(0, 10).map(event => {
              const resolved = event.status === 'RESOLVED';
              const failed = event.status === 'FAILED';
              const sharedLocation = Boolean(event.locationLink);
              return (
                <li key={event._id} className="flex items-center gap-3 py-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${resolved ? 'bg-[#ecfdf5] text-[#059669]' : failed ? 'bg-red-50 text-red-600' : 'bg-[#fff0f5] text-[#e91670]'}`}>
                    {resolved ? <CheckCircle2 className="h-4 w-4" /> : <Siren className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#071426]">
                      {resolved ? 'Resolved' : (failed ? 'Not delivered' : event.status === 'NOTIFIED' ? 'Delivered to your circle' : 'Alert triggered')}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#64748b]">
                      {new Date(event.triggeredAt).toLocaleString()}
                      {sharedLocation && ' · location shared'}
                      {event.locationLink && (
                        <a href={event.locationLink} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#2563eb]">
                          <MapPin className="h-3 w-3" /> map
                        </a>
                      )}
                    </p>
                  </div>
                  {event.perContactStatus && Array.isArray(event.perContactStatus) && event.perContactStatus.length > 0 && (
                    <span className="hidden shrink-0 text-[11px] font-bold text-[#52617f] sm:block">
                      {event.perContactStatus.reduce((sum: number, entry: any) => sum + (entry.notifications?.length || 0), 0)} delivery attempt(s)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};