import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { Search, Landmark, SlidersHorizontal, ArrowRight, ShieldAlert, Bookmark, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { SchemeCardSkeleton } from '../../components/common/Skeleton.js';

export const Schemes: React.FC = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/public/schemes');
      if (res.data.success) {
        setSchemes(res.data.data);
        setFiltered(res.data.data);
      } else {
        setError('Failed to fetch government schemes catalog.');
      }
      if (user?.role === 'STUDENT') {
        const savedRes = await api.get('/students/me/saved-schemes');
        if (savedRes.data.success) {
          setSavedIds(new Set(savedRes.data.data.map((row: any) => row.scheme.id || row.scheme._id)));
        }
      }
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('College database server is temporarily offline.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (schemeId: string) => {
    if (savedIds.has(schemeId)) await api.delete(`/students/me/saved-schemes/${schemeId}`);
    else await api.post(`/students/me/saved-schemes/${schemeId}`);
    await fetchSchemes();
  };

  useEffect(() => {
    let result = [...schemes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(term) || 
        s.shortDescription.toLowerCase().includes(term) || 
        s.provider.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      const group = schemeGroups.find(item => item.value === selectedCategory);
      if (group) {
        result = result.filter(s => group.categories.some(category => category.toLowerCase() === String(s.category).toLowerCase()));
      }
    }

    if (selectedStatus) {
      result = result.filter(s => s.status === selectedStatus);
    }

    setFiltered(result);
  }, [searchTerm, selectedCategory, selectedStatus, schemes]);

  const schemeGroups = [
    { value: 'education', label: 'Girl Student Education', categories: ['Scholarship', 'Education'] },
    { value: 'entrepreneurship', label: 'Women Entrepreneurship', categories: ['Entrepreneurship', 'Startup Support'] },
    { value: 'skills', label: 'Skill Training & Employment', categories: ['Skill Development', 'Employment', 'Training'] },
    { value: 'financial', label: 'Financial Assistance', categories: ['Financial Assistance'] },
    { value: 'community', label: 'Rural & Community Women', categories: ['Rural Women'] },
    { value: 'other', label: 'Other Support', categories: ['Other'] },
  ];

  const getSchemeGroup = (category: string) => (
    schemeGroups.find(group => group.categories.some(item => item.toLowerCase() === String(category).toLowerCase())) || schemeGroups[schemeGroups.length - 1]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'EXPIRED': return 'bg-gray-100 text-gray-700 border border-gray-200';
      default: return 'bg-green-50 text-green-700 border border-green-200'; // ACTIVE
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  } as const;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-bold text-rose-600 uppercase tracking-widest">
            <Landmark className="w-3.5 h-3.5 text-rose-600" />
            <span>Welfare & Skill Grants</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-maroon-700">Government Schemes for Women</h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Explore direct scholarships, vocational training funds, and micro-loan subsidies offered by state and central ministries.
          </p>
          <div className="w-24 h-1 bg-gold-600 mx-auto rounded"></div>
        </div>

        {/* Official Disclaimer Banner */}
        <section className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed text-amber-900 max-w-4xl mx-auto">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Official Verification Disclaimer:</span> Scheme guidelines and dates are aggregated from public portals for community awareness. The Women's Empowerment Cell of Sankara College of Science and Commerce does not handle final disbursements. Students are requested to always verify criteria and deadlines on the direct government portals before filing applications.
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-maroon-700 pb-2 border-b border-gray-100">
            <SlidersHorizontal className="w-4 h-4 text-gold-600" />
            <span>Filter active scholarship grants</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search title, provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-maroon-700 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
            >
              <option value="">All Women/Girl Categories</option>
              {schemeGroups.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-maroon-700"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active (Applications Open)</option>
              <option value="UPCOMING">Upcoming Grants</option>
              <option value="EXPIRED">Closed / Past Deadlines</option>
            </select>
          </div>
        </section>

        {/* Schemes Catalog Cards Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, n) => <SchemeCardSkeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 border border-red-150 bg-red-50 rounded-xl">
            <p className="font-semibold">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl text-gray-500">
            <p className="font-semibold text-base">No government schemes match these search filters</p>
            <p className="text-xs">Adjust your search parameters above to view other listed schemes.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {schemeGroups.map(group => {
              const groupSchemes = filtered.filter(scheme => getSchemeGroup(scheme.category).value === group.value);
              if (groupSchemes.length === 0) return null;

              return (
                <section key={group.value} className="space-y-4">
                  <div className="flex items-center justify-between gap-4 border-b border-gray-150 pb-3">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-maroon-700">{group.label}</h2>
                      <p className="text-xs text-gray-500">{groupSchemes.length} active scheme{groupSchemes.length === 1 ? '' : 's'} listed</p>
                    </div>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                  >
                    {groupSchemes.map((scheme) => (
                      <motion.div
                        key={scheme._id}
                        variants={itemVariants}
                        whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(107,23,61,0.08), 0 8px 10px -6px rgba(107,23,61,0.08)" }}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm transition-shadow p-6 flex flex-col justify-between"
                      >
                        <div>
                          <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-50 text-rose-600 rounded mb-3">
                            {scheme.category}
                          </span>
                          {scheme.isFeatured && (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-100 text-amber-800 rounded ml-2">
                              Featured
                            </span>
                          )}
                          <h3 className="text-base font-bold text-maroon-700 line-clamp-2 font-serif">
                            {scheme.title}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            By {scheme.provider}
                          </p>
                          <p className="text-xs text-gray-600 mt-3.5 leading-relaxed line-clamp-3">
                            {scheme.shortDescription}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100 mt-4 flex flex-wrap items-center justify-between gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusColor(scheme.status)}`}>
                            {scheme.status}
                          </span>
                          <Link
                            to={`/schemes/${scheme.slug}`}
                            className="text-xs font-bold text-maroon-700 hover:text-rose-600 flex items-center space-x-0.5"
                          >
                            <span>Guidelines</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {user?.role === 'STUDENT' && (
                            <button type="button" onClick={() => toggleSave(scheme._id)} className={`text-xs font-bold flex items-center space-x-1 ${savedIds.has(scheme._id) ? 'text-maroon-700' : 'text-gray-500 hover:text-maroon-700'}`}>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>{savedIds.has(scheme._id) ? 'Saved' : 'Save'}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              );
            })}

            <section className="rounded-xl border border-gray-150 bg-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon-700">Need more government listings?</h2>
                <p className="text-sm text-gray-500">Search the official Government of India scheme portal for additional women and girl-student programmes.</p>
              </div>
              <a
                href="https://www.myscheme.gov.in/search/category/Women%20and%20Child"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-maroon-800"
              >
                <ExternalLink className="h-4 w-4" />
                More Schemes
              </a>
            </section>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
