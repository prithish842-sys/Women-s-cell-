import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { LifeBuoy, Send, ShieldAlert } from 'lucide-react';

const quick = ["I'm stressed", "I can't focus", 'I feel low', 'Help me calm down', 'I want to talk to someone'];

export const StudentWellbeingChat: React.FC = () => {
  const { language } = useLanguage();
  const [languagePreference, setLanguagePreference] = useState(language === 'ta' ? 'TAMIL' : 'ENGLISH');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'USER' | 'ASSISTANT'; content: string; safetyRisk?: boolean; providerAvailable?: boolean }[]>([]);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [today, setToday] = useState<any>(null);

  useEffect(() => {
    setLanguagePreference(language === 'ta' ? 'TAMIL' : 'ENGLISH');
  }, [language]);

  useEffect(() => {
    Promise.allSettled([api.get('/wellbeing/me/privacy'), api.get('/wellbeing/me/today')]).then(([privacyRes, todayRes]) => {
      if (privacyRes.status === 'fulfilled') setPrivacy(privacyRes.value.data.data);
      if (todayRes.status === 'fulfilled') setToday(todayRes.value.data.data);
    });
  }, []);

  const send = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');
    setMessages(current => [...current, { role: 'USER', content: trimmed }]);
    try {
      const res = await api.post('/wellbeing/me/chat', { message: trimmed, languagePreference, sessionId });
      setSessionId(res.data.data.sessionId || null);
      setMessages(current => [...current, {
        role: 'ASSISTANT',
        content: res.data.data.message,
        safetyRisk: res.data.data.safetyRisk,
        providerAvailable: res.data.data.providerAvailable,
      }]);
    } catch {
      setMessages(current => [...current, { role: 'ASSISTANT', content: 'The wellness companion is temporarily unavailable. Your check-in has been saved safely. You can use Emergency Help, Counsellor Support, or Wellbeing Resources.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 fade-in-up">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-maroon-700">Sakhi Wellness Companion</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">A supportive wellbeing companion, not a doctor, therapist, diagnosis tool, or emergency responder.</p>
          </div>
          <label className="text-xs font-bold uppercase text-gray-500">Language
            <select value={languagePreference} onChange={e => setLanguagePreference(e.target.value)} className="mt-1 block rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-maroon-700">
              <option value="AUTO">Auto</option>
              <option value="ENGLISH">English</option>
              <option value="TAMIL">தமிழ்</option>
              <option value="TANGLISH">Tanglish</option>
            </select>
          </label>
        </div>
        <div className="mt-4 rounded-lg border border-gray-200 bg-cream-50 p-3 text-sm text-gray-600">
          Today’s Check-In Summary: {privacy?.personalizeAiWithCheckIns && today ? `${today.mood.replaceAll('_', ' ')}, stress ${today.stressLevel}/5, energy ${today.energyLevel}/5, sleep ${today.sleepQuality.replaceAll('_', ' ')}` : 'Not shared with AI unless you enable personalization.'}
        </div>
      </section>

      <section className="min-h-[420px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {messages.length === 0 ? (
          <div className="flex min-h-64 flex-col justify-center rounded-lg border border-dashed border-gray-200 bg-cream-50 p-6 text-center text-gray-500">No chat messages yet. Choose a quick action or type what you would like support with.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={`max-w-[86%] rounded-lg p-3 text-sm leading-6 ${message.role === 'USER' ? 'ml-auto bg-maroon-700 text-white' : 'bg-cream-50 text-gray-700 border border-gray-200'}`}>
                {message.safetyRisk && <p className="mb-2 inline-flex items-center gap-2 font-bold text-error-red"><ShieldAlert className="h-4 w-4" />Immediate safety support suggested</p>}
                <p>{message.content}</p>
                {message.providerAvailable === false && message.role === 'ASSISTANT' && <p className="mt-2 text-xs text-gray-500">AI provider unavailable; showing local safety guidance.</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">{quick.map(item => <button key={item} onClick={() => send(item)} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-maroon-700">{item}</button>)}</div>

      <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Type a message..." className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm" />
        <button onClick={() => send()} disabled={sending} className="inline-flex items-center gap-2 rounded-md bg-maroon-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Send className="h-4 w-4" />Send</button>
      </div>
      <Link to="/student/wellbeing/support" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-maroon-700"><LifeBuoy className="h-4 w-4" />Request Counsellor Support</Link>
    </div>
  );
};
