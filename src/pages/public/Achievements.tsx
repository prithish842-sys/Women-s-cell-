import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { Calendar, Award, BookOpen, Search, Sparkles, AlertCircle, Eye, Download, User, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { assignImageFallback, galleryFallbackImage, withResolvedImage } from '../../utils/imageFallback.js';
import { AchievementCardSkeleton } from '../../components/common/Skeleton.js';
import { ProgressiveImage } from '../../components/common/ProgressiveImage.js';

interface Achievement {
  _id: string;
  title: string;
  description: string;
  achievementType: string;
  studentId?: string;
  memberName?: string;
  department?: string;
  eventName?: string;
  achievementDate?: string;
  level: string;
  position?: string;
  image?: string;
  certificate?: string;
  isFeatured: boolean;
  studentName: string;
  studentAcademicStatus?: string;
}

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('');

  // Selected Achievement Detail Modal
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);

  const types = [
    { value: 'ALL', label: 'All Types' },
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CULTURAL', label: 'Cultural' },
    { value: 'ENTREPRENEURSHIP', label: 'Entrepreneurship' },
    { value: 'SKILL', label: 'Skills' },
    { value: 'COMPETITION', label: 'Competitions' },
    { value: 'COMMUNITY_SERVICE', label: 'Community Service' },
    { value: 'LEADERSHIP', label: 'Leadership' }
  ];

  const levels = [
    { value: 'ALL', label: 'All Levels' },
    { value: 'COLLEGE', label: 'College' },
    { value: 'INTER_COLLEGE', label: 'Inter-Collegiate' },
    { value: 'DISTRICT', label: 'District' },
    { value: 'STATE', label: 'State' },
    { value: 'NATIONAL', label: 'National' },
    { value: 'INTERNATIONAL', label: 'International' }
  ];

  const departments = [
    { value: 'ALL', label: 'All Departments' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Electronics & Communication', label: 'Electronics & Communication' },
    { value: 'Business Administration', label: 'Business Administration' },
    { value: 'English Literature', label: 'English Literature' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Chemistry', label: 'Chemistry' }
  ];

  const years = [
    { value: '', label: 'All Years' },
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' }
  ];

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        let url = `/public/achievements?isFeatured=false`; // We pull all, and filter or display featured at top
        
        // Let's pass the active filter queries to the API
        let queryParams: string[] = [];
        if (selectedType !== 'ALL') queryParams.push(`achievementType=${selectedType}`);
        if (selectedLevel !== 'ALL') queryParams.push(`level=${selectedLevel}`);
        if (selectedDept !== 'ALL') queryParams.push(`department=${selectedDept}`);
        if (selectedYear) queryParams.push(`year=${selectedYear}`);

        if (queryParams.length > 0) {
          url = `/public/achievements?${queryParams.join('&')}`;
        } else {
          url = '/public/achievements';
        }

        const res = await api.get(url);
        if (res.data.success) {
          setAchievements(res.data.data);
        } else {
          setError('Failed to fetch achievements.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading student achievements. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [selectedType, selectedLevel, selectedDept, selectedYear]);

  const filteredAchievements = achievements.filter(ach =>
    ach.title.toLowerCase().includes(search.toLowerCase()) ||
    ach.description.toLowerCase().includes(search.toLowerCase()) ||
    ach.studentName.toLowerCase().includes(search.toLowerCase()) ||
    (ach.eventName && ach.eventName.toLowerCase().includes(search.toLowerCase()))
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INTERNATIONAL':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NATIONAL':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DISTRICT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-matte-cream text-matte-maroon border-matte-beige';
    }
  };

  const featuredAchievements = filteredAchievements.filter(a => a.isFeatured);
  const regularAchievements = filteredAchievements.filter(a => !a.isFeatured);

  return (
    <div className="min-h-screen bg-matte-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Block */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-matte-blush/20 border border-matte-rose text-matte-maroon text-xs font-semibold tracking-wider uppercase font-sans">
            <Award className="w-3.5 h-3.5 text-matte-gold" />
            <span>Honoring Our Lionesses</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-matte-maroon tracking-tight">
            Featured Achievements
          </h1>
          <p className="text-sm sm:text-base text-matte-charcoal/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Celebrating the academic, entrepreneurial, sports, leadership, and digital triumphs achieved by our students at College, National, and International levels.
          </p>
          <div className="w-24 h-0.5 bg-matte-gold mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Multi-Filter Panel */}
        <div className="bg-matte-cream rounded-2xl p-6 border border-matte-beige shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-matte-charcoal/60 uppercase tracking-wider">Achievement Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon cursor-pointer"
              >
                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Level */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-matte-charcoal/60 uppercase tracking-wider">Competition Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon cursor-pointer"
              >
                {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-matte-charcoal/60 uppercase tracking-wider">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon cursor-pointer"
              >
                {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-matte-charcoal/60 uppercase tracking-wider">Calendar Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-white border border-matte-beige rounded-xl p-2.5 text-xs text-matte-charcoal focus:outline-none focus:ring-1 focus:ring-matte-maroon cursor-pointer"
              >
                {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>

          <div className="traditional-line"></div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by student name, award title, hackathon event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-matte-beige text-xs text-matte-charcoal placeholder-matte-charcoal/40 focus:outline-none focus:ring-1 focus:ring-matte-maroon"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-matte-charcoal/40" />
          </div>
        </div>

        {/* Featured Section */}
        {featuredAchievements.length > 0 && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-matte-maroon flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-matte-gold" />
              <span>Pioneering Highlights</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredAchievements.map((ach) => (
                <div
                  key={ach._id}
                  className="bg-matte-cream border-2 border-matte-gold/40 rounded-2xl overflow-hidden p-6 shadow-sm hover:shadow-md hover:border-matte-rose/40 transition-all flex flex-col sm:flex-row gap-6"
                >
                  {/* Photo representation */}
                  <div className="w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-matte-beige shrink-0">
                    <ProgressiveImage
                      src={ach.image}
                      fallbackSrc={galleryFallbackImage}
                      alt={ach.title}
                      referrerPolicy="no-referrer"
                      onError={(event) => assignImageFallback(event, galleryFallbackImage)}
                      wrapperClassName="h-full w-full"
                      imageClassName="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-grow space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[9px] font-bold tracking-wider uppercase font-sans px-2 py-0.5 rounded-md bg-matte-maroon text-matte-white">
                          {ach.achievementType}
                        </span>
                        <span className={`text-[9px] font-medium tracking-wide uppercase font-sans px-2 py-0.5 rounded border ${getLevelColor(ach.level)}`}>
                          {ach.level}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-matte-maroon line-clamp-1">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-matte-charcoal/80 line-clamp-3 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-matte-beige">
                      <div className="flex justify-between items-center text-[10px] text-matte-charcoal/60 font-sans">
                        <span>Achiever: <strong className="text-matte-maroon">{ach.studentName}</strong> ({ach.department})</span>
                        {ach.achievementDate && <span>{new Date(ach.achievementDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>}
                      </div>
                      <div className="flex space-x-2 justify-end">
                        {ach.certificate && (
                          <a
                            href={withResolvedImage(ach.certificate, '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-matte-white border border-matte-beige hover:border-matte-rose/30 rounded-lg text-[10px] font-medium text-matte-maroon transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-matte-rose" />
                            <span>Certificate</span>
                          </a>
                        )}
                        <button
                          onClick={() => setActiveAchievement(ach)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-matte-maroon hover:bg-matte-maroon/90 rounded-lg text-[10px] font-medium text-white transition-colors cursor-pointer"
                        >
                          <span>Full details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Section */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-matte-maroon flex items-center space-x-2">
            <span>Roll of Honour</span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <AchievementCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-matte-rose/30 text-matte-maroon p-6 rounded-2xl flex items-center space-x-3 max-w-lg mx-auto">
              <AlertCircle className="w-6 h-6 text-matte-rose" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : regularAchievements.length === 0 && featuredAchievements.length === 0 ? (
            <div className="text-center py-16 bg-matte-cream border border-dashed border-matte-beige rounded-2xl max-w-lg mx-auto p-8 space-y-2">
              <Award className="w-10 h-10 text-matte-charcoal/30 mx-auto" />
              <p className="font-serif text-base font-semibold text-matte-charcoal">No achievements discovered</p>
              <p className="text-xs text-matte-charcoal/50">Try broadening your filter categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularAchievements.map((ach) => (
                <div
                  key={ach._id}
                  className="bg-white border border-matte-beige hover:border-matte-rose/30 hover:shadow-md rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold tracking-wider uppercase font-sans px-2 py-0.5 rounded-md bg-matte-cream text-matte-maroon border border-matte-beige">
                        {ach.achievementType}
                      </span>
                      <span className={`text-[9px] font-medium tracking-wide uppercase font-sans px-2 py-0.5 rounded border ${getLevelColor(ach.level)}`}>
                        {ach.level}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-matte-maroon line-clamp-1">
                      {ach.title}
                    </h3>
                    <p className="text-xs text-matte-charcoal/70 line-clamp-3 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-matte-beige">
                    <div className="flex justify-between items-start text-[10px] text-matte-charcoal/60 font-sans">
                      <div>
                        <span className="block font-semibold text-matte-maroon">{ach.studentName}</span>
                        <span className="block text-[9px] text-matte-charcoal/50">{ach.department}</span>
                      </div>
                      {ach.achievementDate && (
                        <span>{new Date(ach.achievementDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                      )}
                    </div>

                    <div className="flex space-x-2 justify-end pt-1">
                      {ach.certificate && (
                        <a
                          href={withResolvedImage(ach.certificate, '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-matte-cream hover:bg-matte-blush/20 border border-matte-beige rounded-lg text-[9px] font-medium text-matte-maroon transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-matte-rose" />
                          <span>View Cert</span>
                        </a>
                      )}
                      <button
                        onClick={() => setActiveAchievement(ach)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-matte-maroon hover:bg-matte-maroon/90 rounded-lg text-[9px] font-medium text-white transition-colors cursor-pointer"
                      >
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievement Detail Modal with AnimatePresence */}
      <AnimatePresence>
        {activeAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-matte-charcoal/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden border border-matte-beige w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="bg-matte-cream p-5 border-b border-matte-beige flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-bold tracking-wider uppercase font-sans px-2 py-0.5 rounded-md bg-matte-maroon text-matte-white">
                      {activeAchievement.achievementType}
                    </span>
                    <span className={`text-[9px] font-medium tracking-wide uppercase font-sans px-2 py-0.5 rounded border ${getLevelColor(activeAchievement.level)}`}>
                      {activeAchievement.level}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono tracking-wider text-matte-charcoal/50 uppercase">Student Merit Profile</span>
                </div>
                <button
                  onClick={() => setActiveAchievement(null)}
                  className="p-1.5 hover:bg-matte-beige/50 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-matte-maroon" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-bold text-matte-maroon tracking-tight leading-snug">
                    {activeAchievement.title}
                  </h2>
                  {activeAchievement.position && (
                    <div className="text-matte-gold font-sans font-bold text-sm tracking-wide flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-matte-gold" />
                      <span>{activeAchievement.position}</span>
                    </div>
                  )}
                </div>

                {/* Achiever Bio Block */}
                <div className="bg-matte-cream rounded-xl p-4 border border-matte-beige flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-matte-charcoal/50 block font-semibold uppercase tracking-wider">Student Achiever</span>
                    <span className="font-serif text-base font-bold text-matte-maroon">{activeAchievement.studentName}</span>
                    <span className="text-xs text-matte-charcoal/70 block">{activeAchievement.department}</span>
                  </div>
                  <div className="text-right text-xs text-matte-charcoal/60 font-sans">
                    {activeAchievement.achievementDate && (
                      <span className="block">Date: <strong>{new Date(activeAchievement.achievementDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                    )}
                    {activeAchievement.eventName && (
                      <span className="block">Event: <strong>{activeAchievement.eventName}</strong></span>
                    )}
                  </div>
                </div>

                {/* Full Description */}
                <div className="space-y-2 font-sans text-sm text-matte-charcoal/80 leading-relaxed font-light">
                  <span className="text-[10px] text-matte-charcoal/50 block font-bold uppercase tracking-wider">Achievement Description</span>
                  <p>{activeAchievement.description}</p>
                </div>

                {/* Image & Certificate files representation */}
                {(activeAchievement.image || activeAchievement.certificate) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {activeAchievement.image && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-matte-charcoal/50 block font-bold uppercase tracking-wider">Event Photo</span>
                        <div className="aspect-video rounded-xl overflow-hidden bg-matte-cream border border-matte-beige">
                          <ProgressiveImage
                            src={activeAchievement.image}
                            fallbackSrc={galleryFallbackImage}
                            alt="Achievement Event"
                            referrerPolicy="no-referrer"
                            onError={(event) => assignImageFallback(event, galleryFallbackImage)}
                            wrapperClassName="h-full w-full"
                            imageClassName="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {activeAchievement.certificate && (
                      <div className="space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-matte-charcoal/50 block font-bold uppercase tracking-wider">Official Certificate</span>
                          <div className="bg-matte-cream rounded-xl p-4 border border-matte-beige flex items-center justify-between mt-1">
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-matte-maroon block truncate max-w-[180px]">Certificate File</span>
                              <span className="text-[10px] text-matte-charcoal/50 block uppercase font-mono">
                                {activeAchievement.certificate.endsWith('.pdf') ? 'PDF Document' : 'Image Format'}
                              </span>
                            </div>
                            <a
                              href={withResolvedImage(activeAchievement.certificate, '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white rounded-lg border border-matte-beige hover:border-matte-rose/30 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-matte-rose" />
                            </a>
                          </div>
                        </div>

                        <a
                          href={withResolvedImage(activeAchievement.certificate, '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-matte-cream hover:bg-matte-blush/20 border border-matte-beige rounded-xl text-xs font-medium text-matte-maroon text-center transition-colors cursor-pointer"
                        >
                          Open Certificate in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-matte-cream p-4 border-t border-matte-beige flex justify-end shrink-0">
                <button
                  onClick={() => setActiveAchievement(null)}
                  className="px-5 py-2 bg-matte-maroon text-matte-white rounded-xl text-xs font-semibold hover:bg-matte-maroon/90 transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
