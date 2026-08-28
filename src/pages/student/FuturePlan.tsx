import React, { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { Briefcase, AlertTriangle, CheckCircle, Save, HelpCircle } from 'lucide-react';
import { DashboardSkeleton } from '../../components/common/Skeleton.js';

export const StudentFuturePlanView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fields
  const [interestedInEntrepreneurship, setInterestedInEntrepreneurship] = useState(false);
  const [businessIdea, setBusinessIdea] = useState('');
  const [preferredIndustry, setPreferredIndustry] = useState('');
  const [incubationSupportRequired, setIncubationSupportRequired] = useState(false);
  const [mentorshipSought, setMentorshipSought] = useState(false);

  useEffect(() => {
    fetchFuturePlan();
  }, []);

  const fetchFuturePlan = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/students/me/future-plan');
      if (res.data.success) {
        const data = res.data.data;
        setInterestedInEntrepreneurship(data.interestedInEntrepreneurship || false);
        setBusinessIdea(data.businessIdea || '');
        setPreferredIndustry(data.preferredIndustry || '');
        setIncubationSupportRequired(data.incubationSupportRequired || false);
        setMentorshipSought(data.mentorshipSought || false);
      } else {
        setErrorMsg('Failed to fetch entrepreneurship logs.');
      }
    } catch (err) {
      console.error('Error fetching future plan:', err);
      setErrorMsg('Could not fetch entrepreneurship profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    const payload = {
      interestedInEntrepreneurship,
      businessIdea: interestedInEntrepreneurship ? businessIdea.trim() : '',
      preferredIndustry: interestedInEntrepreneurship ? preferredIndustry.trim() : '',
      incubationSupportRequired: interestedInEntrepreneurship ? incubationSupportRequired : false,
      mentorshipSought: interestedInEntrepreneurship ? mentorshipSought : false
    };

    try {
      const res = await api.put('/students/me/future-plan', payload);
      if (res.data.success) {
        setSuccessMsg('Entrepreneurship & Future Plan configurations saved successfully!');
      } else {
        setErrorMsg('Failed to apply entrepreneurship updates.');
      }
    } catch (err) {
      console.error('Error saving future plan:', err);
      setErrorMsg('A connection timeout occurred while updating entrepreneurship records.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton cards={3} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-serif text-2xl font-bold text-maroon-700">Entrepreneurship & Future Launch</h1>
        <p className="text-xs text-gray-500">Log business ideas to request guidance, skill support and mentorship.</p>
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

      {/* Main card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-150 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-700 pb-1.5 border-b border-gray-100 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Entrepreneurship Status</span>
          </h3>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start space-x-3.5">
            <input
              type="checkbox"
              id="interestedInEntrepreneurship"
              checked={interestedInEntrepreneurship}
              onChange={(e) => setInterestedInEntrepreneurship(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700 mt-0.5"
            />
            <div className="space-y-1">
              <label htmlFor="interestedInEntrepreneurship" className="block text-sm font-bold text-gray-800 cursor-pointer">
                I am interested in starting my own business / startup.
              </label>
              <p className="text-xs text-gray-500 leading-normal">
                Checking this box records your entrepreneurship interest for Women Empowerment Cell guidance, workshops and expert reviews where supported.
              </p>
            </div>
          </div>
        </div>

        {interestedInEntrepreneurship && (
          <div className="space-y-4 pt-2 fade-in-up">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Target Industry Category</label>
              <input
                type="text"
                placeholder="e.g. EdTech, Fine Arts / HandiCrafts, E-Commerce, Agritech"
                value={preferredIndustry}
                onChange={(e) => setPreferredIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Core Business Idea Proposal</label>
              <textarea
                rows={3}
                placeholder="Briefly describe the product, services, or vocational marketplace you intend to design or scale..."
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-maroon-700 focus:outline-none font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-rose-50/20 rounded-xl border border-rose-100 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="incubationSupportRequired"
                  checked={incubationSupportRequired}
                  onChange={(e) => setIncubationSupportRequired(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700 mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="incubationSupportRequired" className="block text-xs font-bold text-gray-800 cursor-pointer">
                    Request Workspace / Resource Support
                  </label>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Apply for co-working tables and shared Wi-Fi connections inside Room 14 Admin Block.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-rose-50/20 rounded-xl border border-rose-100 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="mentorshipSought"
                  checked={mentorshipSought}
                  onChange={(e) => setMentorshipSought(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700 mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="mentorshipSought" className="block text-xs font-bold text-gray-800 cursor-pointer">
                    Require Active Industry Mentorship
                  </label>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Get paired with distinguished college alumni or visiting angel network directors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Save Launch Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
