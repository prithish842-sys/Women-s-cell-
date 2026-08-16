import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { resolveUploadUrl } from '../../utils/api.js';
import { AlertCircle, CalendarDays, CheckCircle2, MapPin, Star } from 'lucide-react';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { WorkshopRegistrationModal } from '../../components/workshops/WorkshopRegistrationModal.js';

export const Workshops: React.FC = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationWorkshop, setRegistrationWorkshop] = useState<any>(null);
  const [registerError, setRegisterError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = slug ? await api.get(`/public/workshops/${slug}`) : await api.get('/public/workshops', { params: { category } });
      if (slug) setDetail(res.data.data);
      else setWorkshops(res.data.data || []);
    } catch {
      setError('Could not load workshops calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slug, category]);

  useEffect(() => {
    const requestedId = (location.state as any)?.registerWorkshopId;
    if (!requestedId || authLoading || user?.role !== 'STUDENT') return;
    const selected = detail?._id === requestedId ? detail : workshops.find(workshop => workshop._id === requestedId);
    if (selected) {
      setRegistrationWorkshop(selected);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [authLoading, detail, location.pathname, location.state, navigate, user?.role, workshops]);

  const categories = ['SKILL_DEVELOPMENT','AWARENESS','ENTREPRENEURSHIP','CAREER','SAFETY','HEALTH','COMPETITION','LEADERSHIP','OTHER'];

  const openRegistration = (event: React.MouseEvent, workshop: any) => {
    event.preventDefault();
    event.stopPropagation();
    setRegisterError('');
    if (!user) {
      navigate('/login', {
        state: {
          returnTo: location.pathname,
          registerWorkshopId: workshop._id,
        },
      });
      return;
    }
    if (user.role !== 'STUDENT') {
      setRegisterError('Only student accounts can register for workshops.');
      return;
    }
    setRegistrationWorkshop(workshop);
  };

  if (slug) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-12">
          {loading ? <div className="h-80 bg-white border rounded-xl animate-pulse" /> : error ? <p className="text-red-600">{error}</p> : detail && (
            <article className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
              {detail.posterImage && <img src={resolveUploadUrl(detail.posterImage)} alt={detail.title} className="w-full h-64 object-cover" />}
              <div className="p-6 space-y-4">
                <span className="text-[10px] uppercase font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded">{detail.status}</span>
                <h1 className="font-serif text-3xl font-bold text-maroon-700">{detail.title}</h1>
                <p className="text-sm text-gray-600 leading-relaxed">{detail.fullDescription}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-maroon-700" /> {new Date(detail.startDateTime).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-maroon-700" /> {detail.venue}</div>
                </div>
                {registerError && (
                  <div className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{registerError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => openRegistration(event, detail)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-700 text-white rounded-md text-sm font-bold hover:bg-maroon-800"
                >
                  <CheckCircle2 className="w-4 h-4" /> Register
                </button>
              </div>
            </article>
          )}
        </div>
        <WorkshopRegistrationModal
          workshop={registrationWorkshop}
          open={!!registrationWorkshop}
          onClose={() => setRegistrationWorkshop(null)}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-4xl font-bold text-maroon-700">Workshops Calendar</h1>
          <p className="text-sm text-gray-600">Upcoming training, awareness, leadership, and entrepreneurship sessions.</p>
        </div>
        <section className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col md:flex-row gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-white">
            <option value="">All categories</option>
            {categories.map(cat => <option key={cat}>{cat.replace(/_/g, ' ')}</option>)}
          </select>
        </section>
        {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(n => <div key={n} className="h-56 bg-white border rounded-xl animate-pulse" />)}</div> : error ? (
          <div className="text-center text-red-600 bg-red-50 border rounded-xl py-10">{error}</div>
        ) : workshops.length === 0 ? (
          <div className="text-center text-gray-500 bg-white border rounded-xl py-14">No published workshops match these filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {registerError && (
              <div className="md:col-span-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                {registerError}
              </div>
            )}
            {workshops.map(workshop => (
              <div key={workshop._id} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm flex flex-col">
                {workshop.posterImage ? <img src={resolveUploadUrl(workshop.posterImage)} alt={workshop.title} className="h-40 w-full object-cover" /> : <div className="h-40 bg-rose-50 flex items-center justify-center"><CalendarDays className="w-10 h-10 text-maroon-700" /></div>}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex gap-2">{workshop.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}<span className="text-[10px] font-bold text-rose-700">{workshop.category?.replace(/_/g, ' ')}</span></div>
                  <h3 className="font-serif font-bold text-maroon-700 mt-2">{workshop.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3 flex-1">{workshop.shortDescription}</p>
                  <div className="text-[11px] text-gray-400 mt-4">{new Date(workshop.startDateTime).toLocaleString()} · {workshop.venue}</div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => openRegistration(event, workshop)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-maroon-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-maroon-800"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Register</span>
                    </button>
                    <Link to={`/workshops/${workshop.slug}`} className="text-xs font-bold text-maroon-700 hover:text-rose-600">View details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <WorkshopRegistrationModal
        workshop={registrationWorkshop}
        open={!!registrationWorkshop}
        onClose={() => setRegistrationWorkshop(null)}
      />
    </PageWrapper>
  );
};
