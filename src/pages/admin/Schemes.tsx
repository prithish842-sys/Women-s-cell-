import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { 
  Landmark, Plus, Trash2, Edit3, ShieldAlert, CheckCircle, 
  Save, X, Star, FileText, CheckCircle2
} from 'lucide-react';
import { AdminNotice, AdminPageHeader, AdminSkeletonBlock, AdminStatCard, adminButton, adminCard, formatNumber } from '../../components/admin/AdminUI.js';

export const AdminSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, featured: 0, active: 0, upcoming: 0, studentEngagementTotal: 0 });

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('Scholarship');
  const [eligibility, setEligibility] = useState('');
  const [benefits, setBenefits] = useState('');
  const [requiredDocsInput, setRequiredDocsInput] = useState(''); // Comma separated
  const [applicationProcess, setApplicationProcess] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactInformation, setContactInformation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isFeatured, setIsFeatured] = useState(false);

  const categories = [
    'Scholarship', 'Education', 'Entrepreneurship', 'Skill Development', 
    'Financial Assistance', 'Startup Support', 'Rural Women', 'Employment', 
    'Training', 'Other'
  ];

  useEffect(() => {
    void fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/admin/schemes', { params: { page: 1, limit: 500 } });
      if (res.data.success) {
        setSchemes(res.data.data);
        setMeta(res.data.meta || { page: 1, totalPages: 1, total: res.data.data.length, featured: 0, active: 0, upcoming: 0, studentEngagementTotal: 0 });
      } else {
        setErrorMsg('Failed to query active schemes.');
      }
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setErrorMsg('Lost connection to schemes catalog database.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setShortDescription('');
    setFullDescription('');
    setProvider('');
    setCategory('Scholarship');
    setEligibility('');
    setBenefits('');
    setRequiredDocsInput('');
    setApplicationProcess('');
    setOfficialUrl('');
    setStartDate('');
    setEndDate('');
    setContactInformation('');
    setStatus('ACTIVE');
    setIsFeatured(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (scheme: any) => {
    setIsEditing(true);
    setEditingId(scheme._id);
    setTitle(scheme.title || '');
    setShortDescription(scheme.shortDescription || '');
    setFullDescription(scheme.fullDescription || '');
    setProvider(scheme.provider || '');
    setCategory(scheme.category || 'Scholarship');
    setEligibility(scheme.eligibility || '');
    setBenefits(scheme.benefits || '');
    setRequiredDocsInput(scheme.requiredDocuments ? scheme.requiredDocuments.join(', ') : '');
    setApplicationProcess(scheme.applicationProcess || '');
    setOfficialUrl(scheme.officialUrl || '');
    setStartDate(scheme.startDate || '');
    setEndDate(scheme.endDate || '');
    setContactInformation(scheme.contactInformation || '');
    setStatus(scheme.status || 'ACTIVE');
    setIsFeatured(scheme.isFeatured || false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !shortDescription.trim() || !provider.trim() || !officialUrl.trim()) {
      setErrorMsg('Please supply Title, Short Description, Provider, and Official Government URL.');
      return;
    }

    const docs = requiredDocsInput
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const payload = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      provider: provider.trim(),
      category,
      eligibility: eligibility.trim(),
      benefits: benefits.trim(),
      requiredDocuments: docs,
      applicationProcess: applicationProcess.trim(),
      officialUrl: officialUrl.trim(),
      startDate,
      endDate,
      contactInformation: contactInformation.trim(),
      status,
      isFeatured
    };

    try {
      if (editingId) {
        // Edit Scheme
        const res = await api.put(`/admin/schemes/${editingId}`, payload);
        if (res.data.success) {
          setSuccessMsg(`Scheme "${title}" guidelines edited successfully.`);
          fetchSchemes();
          resetForm();
        } else {
          setErrorMsg(res.data.message || 'Failed to edit scheme parameters.');
        }
      } else {
        // Create Scheme
        const res = await api.post('/admin/schemes', payload);
        if (res.data.success) {
          setSuccessMsg(`Scheme "${title}" successfully published to catalog.`);
          fetchSchemes();
          resetForm();
        } else {
          setErrorMsg(res.data.message || 'Failed to publish new scheme.');
        }
      }
    } catch (err: any) {
      console.error('Error saving scheme:', err);
      setErrorMsg(err.response?.data?.message || 'Server error publishing guidelines.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the scheme "${name}" from our public catalog?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/admin/schemes/${id}`);
      if (res.data.success) {
        setSuccessMsg(`Scheme "${name}" deleted from catalogs.`);
        fetchSchemes();
      } else {
        setErrorMsg('Failed to delete scheme.');
      }
    } catch (err) {
      console.error('Error deleting scheme:', err);
      setErrorMsg('Could not process scheme deletion on server.');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <AdminPageHeader
        title="Govt Schemes"
        description="Manage and monitor government schemes on the platform."
        action={!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={adminButton}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Scheme</span>
          </button>
        ) : null}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Schemes" value={formatNumber(meta.total)} icon={FileText} tone="purple" footer={`Featured: ${formatNumber(meta.featured)}`} />
        <AdminStatCard label="Active Schemes" value={formatNumber(meta.active)} icon={CheckCircle2} tone="green" footer="Applications open by status" />
        <AdminStatCard label="Upcoming" value={formatNumber(meta.upcoming)} icon={Landmark} tone="blue" footer="Not open yet" />
        <AdminStatCard label="Student Interest" value={formatNumber(meta.studentEngagementTotal)} icon={ShieldAlert} tone="orange" footer="Students who saved schemes in the portal" />
      </section>

      {/* Notifications */}
      {errorMsg && (
          <AdminNotice type="error">{errorMsg}</AdminNotice>
      )}

      {successMsg && (
          <AdminNotice type="success">{successMsg}</AdminNotice>
      )}

      {/* Form Block */}
      {isEditing && (
        <section className="bg-white p-6 rounded-xl border-2 border-gold-600 shadow-md space-y-6">
          <div className="pb-2 border-b border-gray-150 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-maroon-700 flex items-center space-x-1.5">
              <Landmark className="w-5 h-5 text-rose-600" />
              <span>{editingId ? 'Edit Scheme Specifications' : 'Publish New Empowerment Scheme'}</span>
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Scheme Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TNSDC Skill Training Grant for Women"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              {/* Provider */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Offered by / Provider Ministry</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department of Social Welfare, Tamil Nadu"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Official government URL */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Official government Link URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://scholarships.gov.in/some-scheme"
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Filing Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Filing Deadline Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Filing Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-maroon-700 bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Applications Open)</option>
                  <option value="UPCOMING">UPCOMING (Not Open Yet)</option>
                  <option value="EXPIRED">EXPIRED (Deadline Passed)</option>
                </select>
              </div>

              {/* Support Hotline */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-500 uppercase">Coordinator Support Hotline / Contact</label>
                <input
                  type="text"
                  placeholder="e.g. 1800-412-4455 / Ext 12"
                  value={contactInformation}
                  onChange={(e) => setContactInformation(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Teaser / Short Description (Public list snippet)</label>
              <textarea
                rows={2}
                required
                maxLength={250}
                placeholder="Write a brief, high-impact summary of who can apply and funding benefits (max 250 characters)..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none font-sans"
              />
            </div>

            {/* Full Description */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Full Description / Scheme Scope</label>
              <textarea
                rows={3}
                placeholder="Describe complete details of the scheme, parameters, and central benefits..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none font-sans"
              />
            </div>

            {/* Eligibility */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Eligibility Criteria Guidelines</label>
              <textarea
                rows={2}
                placeholder="e.g. Must be a female resident of TN, family income below 2.5 LPA..."
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none font-sans"
              />
            </div>

            {/* Benefits */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Disbursement Benefits</label>
              <textarea
                rows={2}
                placeholder="e.g. Rs. 1,000 per month direct bank transfer until course completion..."
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none font-sans"
              />
            </div>

            {/* Required Documents */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Required Documents (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Aadhaar Card, Income Certificate, College ID, Marksheet"
                value={requiredDocsInput}
                onChange={(e) => setRequiredDocsInput(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
              />
            </div>

            {/* Application Process */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-500 uppercase">Application process Steps</label>
              <textarea
                rows={2}
                placeholder="e.g. 1. Register on NSP portal, 2. Submit documents to Admin Block Desk 4..."
                value={applicationProcess}
                onChange={(e) => setApplicationProcess(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none font-sans"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700"
              />
              <label htmlFor="isFeatured" className="font-bold text-gray-700 cursor-pointer">
                Highlight as a FEATURED Scheme (Renders prominently on landing homepage)
              </label>
            </div>

            <div className="pt-4 border-t border-gray-150 flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-maroon-700 text-white font-bold rounded shadow-sm hover:bg-maroon-800"
              >
                Save Scheme Guidelines
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Schemes List Cards */}
      {loading ? (
        <AdminSkeletonBlock rows={6} />
      ) : schemes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-500 text-xs">
          No government schemes added yet. Publish one now.
        </div>
      ) : (
        <div className={`${adminCard} p-4`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#071247]">All Schemes</h2>
            <span className="text-xs font-bold text-[#63708f]">{formatNumber(meta.total)} total scheme records</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemes.map((sc) => (
            <div 
              key={sc._id}
              className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md ${
                sc.isFeatured ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-50 text-rose-600 rounded">
                      {sc.category}
                    </span>
                    {sc.isFeatured && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded ml-1.5 inline-flex items-center space-x-0.5">
                        <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                        <span>Featured</span>
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-maroon-700 mt-2 line-clamp-1">{sc.title}</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">By {sc.provider}</p>
                    <p className="mt-2 text-[10px] font-black text-[#2563eb]">{formatNumber(sc.studentEngagementCount || 0)} interested student(s) · saved in portal</p>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    sc.status === 'EXPIRED'
                      ? 'bg-white text-slate-700 border border-slate-200'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {sc.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed italic">
                  "{sc.shortDescription}"
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-5 flex items-center justify-between text-xs font-semibold">
                <span className="text-[10px] font-mono text-gray-400">Ends: {sc.endDate}</span>
                <div className="space-x-1 flex">
                  <button
                    onClick={() => handleEditClick(sc)}
                    className="p-1.5 text-[#415176] hover:text-maroon-700 hover:bg-rose-50/55 rounded transition-all inline-flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(sc._id, sc.title)}
                    className="p-1.5 text-[#415176] hover:text-red-600 hover:bg-red-50 rounded transition-all inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
          <div className="mt-4 border-t border-[#edf2fb] pt-3 text-xs font-semibold text-[#63708f]">
            Showing the complete current scheme catalogue. “Interested students” is based on students who saved the scheme inside this portal; official government application submission happens on the linked government website.
          </div>
        </div>
      )}
    </div>
  );
};
