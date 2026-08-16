import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { Landmark, Award, Search, ArrowRight, Sparkles, Compass, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  PageWrapper, 
  AnimatedCounter, 
  ScrollReveal, 
  SkeletonCard, 
  InteractiveButton 
} from '../../components/common/PageWrapper.js';

export const Home: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    alumniCount: 0,
    singaPenMembers: 0,
    activeSchemes: 0,
    totalSkills: 0,
    departmentCount: 0
  });
  const [featuredSchemes, setFeaturedSchemes] = useState<any[]>([]);
  const [latestAlbums, setLatestAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, schemesRes, albumsRes] = await Promise.all([
          api.get('/public/statistics'),
          api.get('/public/schemes'),
          api.get('/public/gallery')
        ]);

        if (statsRes.data.success) setStats(statsRes.data.data);
        if (schemesRes.data.success) {
          // Take featured, or first 3 active schemes
          setFeaturedSchemes(schemesRes.data.data.slice(0, 3));
        }
        if (albumsRes.data.success) {
          // Take top 3 albums
          setLatestAlbums(albumsRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching landing page details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <PageWrapper>
      <div className="space-y-16">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-800 to-maroon-700 text-cream-100 py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-8 border-gold-600">
          {/* Background Subtle Traditional Accent Patterns */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
          
          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero text */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center space-x-2 bg-maroon-900/40 border border-gold-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-gold-500 uppercase tracking-widest font-sans"
              >
                <Sparkles className="w-4 h-4" />
                <span>Rise, Lead, and Inspire</span>
              </motion.div>
              
              <h1 className="mx-auto max-w-[18rem] font-serif text-3xl sm:max-w-2xl sm:text-5xl lg:mx-0 lg:text-6xl font-bold leading-tight text-white tracking-tight break-words">
                Unleashing the <span className="text-gold-500 italic">Singa Pen</span> in Every Woman
              </h1>
              
              <p className="text-base sm:text-lg text-cream-100/85 font-sans leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Welcome to the official portal of the Women's Empowerment Cell of Sankara College of Science and Commerce and its elite Singa Pen (Lioness) Club. We bridge academic distinction with practical leadership, startup incubator support, and direct scholarship distribution channels.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <Link to="/register" className="w-full sm:w-auto">
                  <InteractiveButton className="w-full whitespace-normal px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-bold shadow-lg border border-rose-500/25 text-center leading-snug">
                    Join the Student Portal
                  </InteractiveButton>
                </Link>
                <Link to="/members" className="w-full sm:w-auto">
                  <InteractiveButton className="w-full whitespace-normal px-5 py-3.5 bg-transparent hover:bg-white/10 text-gold-500 border-2 border-gold-600 rounded-md text-sm font-bold text-center leading-snug">
                    Explore Singa Pen Club
                  </InteractiveButton>
                </Link>
              </div>
            </motion.div>

            {/* Hero Visual Card Panel - Slid up nicely */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-full max-w-md bg-maroon-900/40 backdrop-blur-sm p-8 rounded-xl border-2 border-gold-600/80 shadow-2xl relative text-cream-100">
                <div className="absolute top-2 right-2 w-16 h-16 opacity-5 bg-[radial-gradient(#FFF_2px,transparent_2px)] [background-size:8px_8px]"></div>
                
                <h3 className="font-serif text-xl font-bold text-gold-500 pb-3 border-b border-maroon-800">
                  Cell Coordinator Message
                </h3>
                <p className="text-sm italic leading-relaxed text-cream-100/90 py-4 font-serif">
                  "Our cell is not just an anti-harassment board; it is an active empowerment launchpad. We ensure that every female student leaves our institution equipped with a strong digital skill portfolio, leadership exposure, and deep awareness of societal and commercial opportunities."
                </p>
                <div className="flex items-center space-x-3 pt-4 border-t border-maroon-800/40">
                  <div className="w-10 h-10 rounded-full bg-gold-600 border border-white text-maroon-900 font-serif font-bold flex items-center justify-center">
                    MN
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Prof. Meera Nair</h4>
                    <p className="text-xs text-gold-500 font-medium">Coordinator, Women's Empowerment Cell & Advisor</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. Core Platform Statistics Grid with Count-up */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-rose-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-maroon-700">
                <AnimatedCounter value={stats.totalStudents || 12} />
              </p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Registered Students</p>
            </div>
            <div className="space-y-1 border-l border-gray-150">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-maroon-700">
                <AnimatedCounter value={stats.singaPenMembers || 8} />
              </p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Club Members</p>
            </div>
            <div className="space-y-1 border-l border-gray-150">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-maroon-700">
                <AnimatedCounter value={stats.activeSchemes || 4} />
              </p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Govt Schemes</p>
            </div>
            <div className="space-y-1 border-l border-gray-150">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-maroon-700">
                <AnimatedCounter value={stats.totalSkills || 20} />
              </p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Skills Logged</p>
            </div>
          </div>
        </section>

        {/* 3. Vision & Mission Section with Scroll Reveal */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-cream-100 to-rose-50 p-8 rounded-2xl border-2 border-gold-600/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 text-maroon-700 opacity-15">
                <Heart className="w-16 h-16" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-maroon-700 mb-4 pb-2 border-b-2 border-maroon-600/20">
                Women's Empowerment Cell Vision
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans">
                To create an inclusive, safe, and robust development environment on campus where young women student developers, designers, and thinkers grow into resilient industry leaders, self-sufficient artisans, and dynamic female startup creators.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cream-100 to-rose-50 p-8 rounded-2xl border-2 border-gold-600/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 text-maroon-700 opacity-15">
                <Compass className="w-16 h-16" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-maroon-700 mb-4 pb-2 border-b-2 border-maroon-600/20">
                Singa Pen Club Mission
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-sans">
                The Singa Pen Club is the action-oriented wing of our cell. We operate regular hands-on vocational modules (coding, designing, crafting), run financial scheme counseling drives, and manage the campus skill matrix to aid administrative tasks.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* 4. Features Bento Grid */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl font-bold text-maroon-700 uppercase tracking-tight">Platform Core Features</h2>
              <p className="text-sm text-gray-600 max-w-xl mx-auto">
                Singa Pen Portal integrates safety with self-sufficiency. Empowering students with verified workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(107, 23, 61, 0.08)" }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-maroon-700">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-maroon-700">Singa Pen Club Directory</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Meet the executive leaders, coordinators, and active volunteers of our Singa Pen club. Explore their certified milestones and verified college project roles.
                </p>
                <Link to="/members" className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-maroon-700">
                  <span>View Club Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(107, 23, 61, 0.08)" }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-maroon-700">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-maroon-700">Scholarship & Scheme Awareness</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Consolidated, up-to-date catalog of active state and national government initiatives (e.g. Pudhumai Penn, AICTE scholarships, MSME micro-finance margins).
                </p>
                <Link to="/schemes" className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-maroon-700">
                  <span>Browse Scheme Guidelines</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(107, 23, 61, 0.08)" }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-maroon-700">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-maroon-700">Faculty Talent Match</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Empowers professors, deans, and administrative heads to securely search student profiles based on precise skill tags (e.g. Figma, Python) for college collaborations.
                </p>
                <Link to="/login" className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600 hover:text-maroon-700">
                  <span>Faculty Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>
          </section>
        </ScrollReveal>

        {/* 5. Featured Government Schemes with Hover scale/shadow effects */}
        <ScrollReveal>
          <section className="bg-maroon-900/5 py-16 border-y-2 border-rose-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="font-serif text-3xl font-bold text-maroon-700">Empowerment Schemes</h2>
                  <p className="text-sm text-gray-600">
                    Latest active government funding and education scholarships for girl students.
                  </p>
                </div>
                <Link to="/schemes" className="shrink-0">
                  <InteractiveButton className="px-5 py-2.5 border-2 border-maroon-700 text-maroon-700 hover:bg-maroon-700 hover:text-white rounded-md text-xs font-bold transition-colors">
                    Browse All Schemes
                  </InteractiveButton>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading ? (
                  [1, 2, 3].map((n) => (
                    <SkeletonCard key={n} />
                  ))
                ) : featuredSchemes.length > 0 ? (
                  featuredSchemes.map((scheme, idx) => (
                    <motion.div 
                      key={scheme._id} 
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      whileHover={{ y: -6, borderColor: "#6B173D", boxShadow: "0 12px 30px -10px rgba(107, 23, 61, 0.12)" }}
                      className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 flex flex-col justify-between transition-colors duration-250"
                    >
                      <div>
                        <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded mb-3">
                          {scheme.category}
                        </span>
                        <h3 className="font-serif text-base font-bold text-maroon-700 line-clamp-1">
                          {scheme.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          By {scheme.provider}
                        </p>
                        <p className="text-xs text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                          {scheme.shortDescription}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-gray-100 mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-400">
                          Ends: {scheme.endDate}
                        </span>
                        <Link
                          to={`/schemes/${scheme.slug}`}
                          className="text-xs font-bold text-maroon-700 hover:text-rose-600 flex items-center space-x-0.5"
                        >
                          <span>Read More</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 text-gray-500 text-sm">
                    No featured government schemes available.
                  </div>
                )}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 5b. Latest Moments (Gallery Showcase) Section */}
        <ScrollReveal>
          <section className="bg-matte-cream py-16 border-y border-matte-beige">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="font-serif text-3xl font-bold text-maroon-700">Latest Moments</h2>
                  <p className="text-sm text-gray-600">
                    Snapshots of recent symposiums, entrepreneur stalls, and club initiatives.
                  </p>
                </div>
                <Link to="/gallery">
                  <InteractiveButton className="px-5 py-2.5 border border-matte-beige hover:bg-white text-matte-maroon rounded-md text-xs font-bold transition-all bg-white/40">
                    Explore Photo Gallery
                  </InteractiveButton>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading ? (
                  [1, 2, 3].map((n) => <SkeletonCard key={n} />)
                ) : latestAlbums.length > 0 ? (
                  latestAlbums.map((album, idx) => (
                    <motion.div
                      key={album._id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      className="bg-white rounded-2xl border border-matte-beige overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-matte-cream overflow-hidden">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 bg-matte-maroon/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded">
                          {album.category}
                        </span>
                        <span className="absolute bottom-3 right-3 bg-black/75 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                          {album.photoCount} PHOTOS
                        </span>
                      </div>

                      <div className="p-5 space-y-2 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-serif text-base font-bold text-matte-maroon line-clamp-1">
                            {album.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {album.shortDescription}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-matte-beige mt-4 flex justify-between items-center text-[10px] text-matte-charcoal/50">
                          <span>{album.eventDate ? new Date(album.eventDate).toLocaleDateString() : ''}</span>
                          <Link to={`/gallery/${album.slug}`} className="text-xs font-bold text-matte-maroon hover:text-matte-rose flex items-center space-x-1">
                            <span>View Album</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 text-gray-500 text-sm">
                    No gallery albums available.
                  </div>
                )}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 6. Traditional Women Empowerment Quote Accent */}
        <ScrollReveal>
          <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
            <span className="text-3xl text-gold-600 block font-serif">✿ ✿ ✿</span>
            <blockquote className="font-serif text-lg sm:text-xl md:text-2xl italic leading-relaxed text-maroon-900">
              “Every female student is a born leader. Our cell provides the academic and entrepreneurial ecosystem, funding resources, and digital skills training to help her conquer her highest dreams.”
            </blockquote>
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
              - WOMEN'S EMPOWERMENT CELL OF SANKARA COLLEGE
            </p>
          </section>
        </ScrollReveal>

        {/* 7. Call To Action (C.T.A) Section with traditional gradient */}
        <ScrollReveal>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="traditional-gradient text-cream-100 rounded-2xl p-8 sm:p-12 border-2 border-gold-600 text-center relative overflow-hidden shadow-xl">
              {/* Decorative Pattern Accent overlay */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FFF_2px,transparent_2px)] [background-size:12px_12px]"></div>
              
              <div className="relative max-w-2xl mx-auto space-y-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                  Ready to Shape Your Future?
                </h2>
                <p className="text-xs font-semibold tracking-wider uppercase text-gold-500 font-sans">
                  Take part in the Sankara Women's Empowerment Cell ecosystem
                </p>
                <p className="text-sm text-cream-100/90 leading-relaxed font-sans">
                  Are you a female student of Sankara College of Science and Commerce? Create your professional skill profile immediately. Showcase your technical talents, get matched for college projects, and stay updated on eligible government scholarships.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <Link to="/register" className="w-full sm:w-auto">
                    <InteractiveButton className="w-full px-6 py-3.5 bg-gold-600 hover:bg-gold-500 text-maroon-900 rounded-md text-sm font-bold shadow-md">
                      Register Student Account
                    </InteractiveButton>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <InteractiveButton className="w-full px-6 py-3.5 bg-maroon-900/60 hover:bg-maroon-900/90 text-cream-100 border border-gold-600/55 rounded-md text-sm font-bold">
                      Sign In to Portal
                    </InteractiveButton>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </PageWrapper>
  );
};
