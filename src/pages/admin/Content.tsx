import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { Settings, AlertTriangle, CheckCircle, RefreshCw, Save, Landmark } from 'lucide-react';
import { AdminSkeletonBlock } from '../../components/admin/AdminUI.js';

export const AdminContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Content Fields
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [coordinatorMessage, setCoordinatorMessage] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/public/site-content');
      if (res.data.success) {
        const data = res.data.data;
        const about = data.about || {};
        const home = data.home || {};
        setVision(about.metadata?.vision || '');
        setMission(about.metadata?.mission || '');
        setCoordinatorMessage(home.metadata?.empowermentQuote || '');
        setAddress(home.metadata?.contactAddress || '');
        setPhone(home.metadata?.contactPhone || '');
        setEmail(home.metadata?.contactEmail || '');
      } else {
        setErrorMsg('Failed to query site configuration contents.');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setErrorMsg('Lost connection to site content database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const aboutRes = await api.put('/admin/site-content/about', {
        title: "Women's Empowerment Cell & Singa Pen Club",
        content: mission,
        metadata: { vision, mission }
      });
      const homeRes = await api.put('/admin/site-content/home', {
        title: 'Welcome to Singa Pen Portal',
        content: coordinatorMessage,
        metadata: {
          empowermentQuote: coordinatorMessage,
          contactAddress: address,
          contactPhone: phone,
          contactEmail: email
        }
      });
      if (aboutRes.data.success && homeRes.data.success) {
        setSuccessMsg('Landing page content and coordinator contacts updated successfully!');
      } else {
        setErrorMsg('Failed to save portal configuration updates.');
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setErrorMsg('Connection error during content update request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminSkeletonBlock rows={6} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-maroon-700">Landing Page Site Content Configuration</h1>
        <p className="text-xs text-gray-500">Edit core message parameters, advisor statements, and cell support contacts.</p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main configuration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-150 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 pb-1.5 border-b border-gray-100 flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Charter vision & Mission Statements</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Vision */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Women's Empowerment Cell Vision Block</label>
              <textarea
                rows={3}
                required
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 font-sans"
              />
            </div>

            {/* Mission */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Singa Pen Club Mission Block</label>
              <textarea
                rows={3}
                required
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 font-sans"
              />
            </div>

            {/* Coordinator Message */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Coordinator Message Board</label>
              <textarea
                rows={3}
                required
                value={coordinatorMessage}
                onChange={(e) => setCoordinatorMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Contacts column */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 pb-1.5 border-b border-gray-100 flex items-center space-x-2">
            <Landmark className="w-4 h-4" />
            <span>Public Support Contacts Block</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Hotline */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Contact Support phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Public Support email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-gray-500 uppercase">Office block Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
          <button
            type="button"
            onClick={fetchContent}
            className="px-4 py-2 text-xs font-bold border rounded hover:bg-gray-50 text-gray-600 inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Content</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-maroon-700 text-white rounded font-bold hover:bg-maroon-800 shadow-sm inline-flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Site Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
