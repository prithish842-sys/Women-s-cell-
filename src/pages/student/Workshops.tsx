import React, { useEffect, useState } from 'react';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { CalendarDays, CheckCircle2, MapPin, RefreshCw } from 'lucide-react';
import { WorkshopRegistrationModal } from '../../components/workshops/WorkshopRegistrationModal.js';

export const StudentWorkshops: React.FC = () => {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationWorkshop, setRegistrationWorkshop] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students/me/workshops');
      setWorkshops(res.data.data || []);
    } catch {
      setError('Could not load student workshops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const interest = async (id: string, status: string) => {
    await api.post(`/students/me/workshops/${id}/interest`, { status });
    await load();
  };

  return (
    <div className="space-y-6 fade-in-up">
      <section className="border-b border-gray-200 pb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-700">Workshops</h1>
          <p className="text-xs text-gray-500">Save interest, register, and track attended sessions.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 border bg-white rounded-md text-xs font-bold"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </section>
      {loading ? <div className="h-48 bg-white border rounded-xl animate-pulse" /> : error ? <p className="text-red-600">{error}</p> : workshops.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl text-gray-500 text-sm">No published workshops yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workshops.map(workshop => {
            const participation = workshop.participations?.[0];
            return (
              <article key={workshop._id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                {workshop.posterImage && <img src={resolveUploadUrl(workshop.posterImage)} alt={workshop.title} className="h-36 w-full object-cover" />}
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">{workshop.status}</span>
                    {participation && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700">{participation.status}</span>}
                  </div>
                  <h3 className="font-serif font-bold text-maroon-700">{workshop.title}</h3>
                  <p className="text-xs text-gray-600">{workshop.shortDescription}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(workshop.startDateTime).toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {workshop.venue}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => interest(workshop._id, 'INTERESTED')} className="px-3 py-1.5 border rounded text-xs font-bold">Save Workshop</button>
                    <button onClick={() => setRegistrationWorkshop(workshop)} className="px-3 py-1.5 bg-maroon-700 text-white rounded text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Register</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <WorkshopRegistrationModal
        workshop={registrationWorkshop}
        open={!!registrationWorkshop}
        onClose={() => setRegistrationWorkshop(null)}
        onSuccess={load}
      />
    </div>
  );
};
