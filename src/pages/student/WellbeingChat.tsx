import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { LifeBuoy, RefreshCw, Send, ShieldAlert, Trash2, Sparkles } from 'lucide-react';

const quick = ["I'm stressed", "I can't focus", 'I feel low', 'Help me calm down', 'I want to talk to someone'];

interface ChatMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  safetyRisk?: boolean;
  providerAvailable?: boolean;
}

let messageCounter = 0;

const nowIso = () => new Date().toISOString();

export const StudentWellbeingChat: React.FC = () => {
  const { language } = useLanguage();
  const [languagePreference, setLanguagePreference] = useState(language === 'ta' ? 'TAMIL' : 'ENGLISH');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLanguagePreference(language === 'ta' ? 'TAMIL' : 'ENGLISH');
  }, [language]);

  useEffect(() => {
    Promise.allSettled([api.get('/wellbeing/me/privacy'), api.get('/wellbeing/me/today')]).then(([privacyRes, todayRes]) => {
      if (privacyRes.status === 'fulfilled') setPrivacy(privacyRes.value.data.data);
      if (todayRes.status === 'fulfilled') setToday(todayRes.value.data.data);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  const send = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setPendingRetry(null);
    setInput('');
    setMessages(current => [...current, { id: ++messageCounter, role: 'USER', content: trimmed, createdAt: nowIso() }]);
    try {
      const res = await api.post('/wellbeing/me/chat', { message: trimmed, languagePreference, sessionId });
      setSessionId(res.data.data.sessionId || null);
      setMessages(current => [...current, {
        id: ++messageCounter,
        role: 'ASSISTANT',
        content: res.data.data.message,
        createdAt: nowIso(),
        safetyRisk: res.data.data.safetyRisk,
        providerAvailable: res.data.data.providerAvailable,
      }]);
    } catch {
      setPendingRetry(trimmed);
      setMessages(current => [...current, {
        id: ++messageCounter,
        role: 'ASSISTANT',
        content: 'The wellness companion is temporarily unavailable. Your wellbeing is the priority — you can use Emergency Help, Counsellor Support, or Wellbeing Resources right now.',
        createdAt: nowIso(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    if (!window.confirm('Clear the current conversation? A fresh session will start with your next message.')) return;
    setMessages([]);
    setSessionId(null);
    setPendingRetry(null);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 fade-in-up">
      <section className="flex flex-col gap-4 rounded-[22px] border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#eef3ff] text-[#2563eb]"><Sparkles className="h-6 w-6" /></span>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.03em] text-[#071426]">Sakhi Wellness Companion</h1>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#64748b]">A supportive companion — not a doctor, therapist, diagnosis tool, or emergency responder.</p>
            </div>
          </div>
          <label className="text-xs font-bold uppercase tracking-wide text-[#52617f]">Language
            <select value={languagePreference} onChange={(event) => setLanguagePreference(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#dfe7fb] bg-white px-3 py-2 text-sm font-semibold text-[#2563eb] outline-none focus:border-[#6d5dfc]">
              <option value="AUTO">Auto</option>
              <option value="ENGLISH">English</option>
              <option value="TAMIL">தமிழ்</option>
              <option value="TANGLISH">Tanglish</option>
            </select>
          </label>
        </div>
        <div className="rounded-lg border border-[#edf2fb] bg-[#fafbff] px-4 py-3 text-xs font-semibold leading-5 text-[#64748b]">
          {privacy?.personalizeAiWithCheckIns && today
            ? <>Today’s Check-In Summary: {String(today.mood || '').replaceAll('_', ' ')}, stress {today.stressLevel}/5, energy {today.energyLevel}/5, sleep {String(today.sleepQuality || '').replaceAll('_', ' ')}</>
            : <>Today’s check-in is <strong className="text-[#52617f]">not shared with AI</strong> unless you enable personalization in your profile.</>}
        </div>
      </section>

      <section className="min-h-[420px] rounded-[22px] border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
        {messages.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe7fb] bg-[#fafbff] p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef3ff] text-[#2563eb]"><Sparkles className="h-6 w-6" /></span>
            <p className="mt-3 text-sm font-black text-[#071426]">Start a conversation</p>
            <p className="mx-auto mt-1 max-w-sm text-xs font-semibold leading-5 text-[#64748b]">Choose a quick action below or type however you are feeling. Everything stays in your private wellbeing space.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => (
              <div key={message.id} className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-6 shadow-sm ${message.role === 'USER' ? 'ml-auto bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-white' : 'border border-[#eef2fb] bg-[#fafbff] text-[#071426]'}`}>
                {message.safetyRisk && (
                  <p className="mb-2 inline-flex items-center gap-2 font-bold text-[#e91670]"><ShieldAlert className="h-4 w-4" />Immediate safety support suggested</p>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className={`mt-2 flex items-center gap-2 text-[10px] font-bold ${message.role === 'USER' ? 'text-white/70' : 'text-[#8a97b5]'}`}>
                  <span>{formatTime(message.createdAt)}</span>
                  {message.providerAvailable === false && message.role === 'ASSISTANT' && <span>· local safety guidance</span>}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex max-w-[88%] items-center gap-2 rounded-2xl border border-[#eef2fb] bg-[#fafbff] px-4 py-3 text-sm font-semibold text-[#64748b]">
                <RefreshCw className="h-4 w-4 animate-spin" /> Sakhi is typing…
              </div>
            )}

            {pendingRetry && !sending && (
              <div className="mt-2 flex items-center gap-2 px-1 text-xs">
                <button type="button" onClick={() => send(pendingRetry)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef3ff] px-3 py-2 font-black text-[#2563eb]">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry last message
                </button>
              </div>
            )}
          </div>
        )}
        <div ref={scrollRef} className="h-0" />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {quick.map(item => <button key={item} onClick={() => send(item)} disabled={sending} className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe7fb] bg-white px-4 py-2 text-xs font-bold text-[#2563eb] hover:bg-[#f6f8ff] disabled:opacity-50">{item}</button>)}
        {messages.length > 0 && (
          <button type="button" onClick={clearConversation} className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd1df] bg-white px-4 py-2 text-xs font-bold text-[#e91670] hover:bg-[#fff0f5]">
            <Trash2 className="h-3.5 w-3.5" /> Clear conversation
          </button>
        )}
      </div>

      <div className="flex gap-2 rounded-[22px] border border-[#e4eaff] bg-white p-3 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') send(); }}
          placeholder="Type a message…"
          aria-label="Message for the wellness companion"
          className="min-w-0 flex-1 rounded-xl border border-[#dfe7fb] bg-white px-4 py-3 text-sm font-semibold text-[#071426] outline-none focus:border-[#6d5dfc]"
        />
        <button onClick={() => send()} disabled={sending || !input.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          <Send className="h-4 w-4" />Send
        </button>
      </div>

      <Link to="/student/wellbeing/support" className="inline-flex items-center gap-2 rounded-xl border border-[#e4eaff] bg-white px-5 py-3 text-sm font-black text-[#2563eb] shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
        <LifeBuoy className="h-4 w-4" />Request Counsellor Support
      </Link>
    </div>
  );
};