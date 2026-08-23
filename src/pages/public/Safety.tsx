import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  ArrowRight,
  BellRing,
  Briefcase,
  Bus,
  CircleAlert,
  FileText,
  Flame,
  Gavel,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  RefreshCw,
  Shield,
  Siren,
  Users,
} from 'lucide-react';
import api from '../../utils/api.js';
import { PageWrapper } from '../../components/common/PageWrapper.js';
import { SkillCardSkeleton } from '../../components/common/Skeleton.js';
import { PortalHero, SectionHeading } from '../../components/common/ReferenceChrome.js';
import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

const emergencyNumbers = [
  { label: 'Police', number: '100', icon: Shield, tone: 'from-blue-700 to-blue-500' },
  { label: 'Fire', number: '101', icon: Flame, tone: 'from-rose-700 to-pink-500' },
  { label: 'Ambulance', number: '102', icon: Ambulance, tone: 'from-teal-700 to-cyan-500' },
  { label: 'Women Helpline', number: '181', icon: LifeBuoy, tone: 'from-violet-700 to-purple-500' },
  { label: 'Child Helpline', number: '1098', icon: HelpCircle, tone: 'from-amber-700 to-orange-500' },
];

const toolRows = [
  {
    title: 'Safety Tools',
    caption: 'Quick tools for your safety and peace of mind.',
    items: [
      { label: 'SOS Alert', copy: 'Send an emergency alert with your location.', path: '/safety/emergency', icon: Siren, tone: 'from-rose-600 to-pink-500', action: 'Send Alert' },
      { label: 'Safe Circle', copy: 'Share your trip and live location with trusted people.', path: '/student/wellbeing', icon: Users, tone: 'from-violet-600 to-purple-500', action: 'Share Now' },
      { label: 'Check Safety', copy: 'Check the safety of a place before you go.', path: '/safety/guides/safe-travel-awareness', icon: Shield, tone: 'from-teal-600 to-cyan-500', action: 'Check Now' },
      { label: 'Safety Tips', copy: 'Practical tips to stay safe in everyday situations.', path: '/safety/guides/emergency-self-protection', icon: BellRing, tone: 'from-amber-500 to-orange-500', action: 'View Tips' },
    ],
  },
  {
    title: 'Digital Safety',
    caption: 'Stay safe in the digital world.',
    items: [
      { label: 'Cyber Safety Guide', copy: 'Learn how to protect yourself online and avoid scams.', path: '/safety/guides/digital-safety-for-women', icon: Shield, tone: 'from-blue-600 to-blue-500', action: 'Explore Guide' },
      { label: 'Report Online Abuse', copy: 'Report cyberbullying, harassment or harmful content.', path: '/safety/cyber', icon: MessageSquareWarning, tone: 'from-pink-600 to-rose-500', action: 'Report Now' },
      { label: 'Privacy Settings', copy: 'Review and strengthen your privacy on social platforms.', path: '/safety/cyber', icon: LockKeyhole, tone: 'from-violet-700 to-purple-500', action: 'Manage Privacy' },
      { label: 'Digital Wellbeing', copy: 'Maintain a healthy balance in your digital life.', path: '/student/wellbeing', icon: HeartPulse, tone: 'from-teal-600 to-cyan-500', action: 'Learn More' },
    ],
  },
];

const compactCards = [
  { label: 'Safe Travel Tips', copy: 'Tips for safe travel at home and while outdoors.', path: '/safety/guides/safe-travel-awareness', icon: Briefcase, tone: 'from-violet-600 to-purple-500', action: 'View Tips' },
  { label: 'Transport Safety', copy: 'Safety guidelines for public and private transport.', path: '/safety/guides/safe-travel-awareness', icon: Bus, tone: 'from-blue-600 to-blue-500', action: 'Learn More' },
  { label: 'Night Safety', copy: 'Stay aware and follow tips for night-time safety.', path: '/safety/guides/emergency-self-protection', icon: CircleAlert, tone: 'from-pink-600 to-rose-500', action: 'View Tips' },
  { label: 'Trusted Places', copy: 'Find nearby safe spaces and women-friendly locations.', path: '/safety/emergency', icon: MapPin, tone: 'from-teal-600 to-cyan-500', action: 'Find Now' },
  { label: 'Report Incident', copy: 'Report physical harassment, violence or unsafe incidents.', path: '/icc-complaint', icon: FileText, tone: 'from-rose-600 to-red-500', action: 'Report Now' },
  { label: 'File a Complaint', copy: 'File a formal complaint with relevant authorities.', path: '/icc-complaint', icon: Gavel, tone: 'from-violet-600 to-purple-500', action: 'File Now' },
  { label: 'Track Complaint', copy: 'Track the status of your submitted complaints.', path: '/student/dashboard', icon: MessageCircle, tone: 'from-teal-600 to-cyan-500', action: 'Track Now' },
];

const supportCards = [
  { label: 'Women Helpline 181', copy: '24x7 support for any kind of assistance.', path: '/safety/emergency', icon: Phone, tone: 'from-violet-600 to-purple-500', action: 'Call 181' },
  { label: 'Live Chat Support', copy: 'Talk to our support team confidentially.', path: '/student/wellbeing/chat', icon: MessageCircle, tone: 'from-blue-600 to-blue-500', action: 'Start Chat' },
  { label: 'Nearest Safe Zone', copy: 'Find public safe zones and police stations near you.', path: '/safety/emergency', icon: MapPin, tone: 'from-teal-600 to-cyan-500', action: 'Find Now' },
  { label: 'Counselling Support', copy: 'Professional support for your mental well-being.', path: '/student/wellbeing/support', icon: HeartHandshake, tone: 'from-pink-600 to-rose-500', action: 'Get Support' },
  { label: 'Legal Aid', copy: 'Free legal guidance and women support services.', path: '/icc-complaint', icon: Gavel, tone: 'from-blue-600 to-blue-500', action: 'Learn More' },
  { label: 'NGO Support', copy: 'Connect with trusted NGOs and community groups.', path: '/members', icon: Users, tone: 'from-orange-500 to-red-500', action: 'Explore NGOs' },
];

export const Safety: React.FC = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/safety/guides');
      setGuides(res.data.data || []);
    } catch {
      setError('Could not load Safety & Support content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PageWrapper>
      <div className="reference-shell">
        <PortalHero
          image={pageHeroImages.safety}
                    mobileImage={mobilePageHeroImages.safety}
mobileImagePosition="59% center"
          mobileImageWidth="100%"
          title="Your Safety. Our Priority."
          subtitle="You matter. We're here for you."
          copy="Explore tools, guidance, and support to help you stay safe, online and offline. Reach out anytime. You are not alone."
          showText={false}
        />

        <main className="reference-container -mt-8 space-y-4 pb-8">
          <section className="reference-panel relative z-10 grid gap-3 rounded-lg bg-[#06123a] p-4 text-white lg:grid-cols-[1.45fr_repeat(5,minmax(0,1fr))_1.8fr]">
            <div className="flex items-center gap-3 px-2">
              <Siren className="h-7 w-7 text-[#ff2a75]" />
              <div>
                <h2 className="text-lg font-black">In an Emergency? Get Help Now.</h2>
                <p className="text-xs font-semibold text-white/65">Important numbers at your fingertips.</p>
              </div>
            </div>
            {emergencyNumbers.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.number} href={`tel:${item.number}`} className={`flex min-h-[64px] items-center gap-2 rounded-lg bg-gradient-to-br ${item.tone} px-3 text-white/95`}>
                  <Icon className="h-7 w-7 shrink-0" />
                  <span><small className="block text-[0.7rem] font-bold">{item.label}</small><strong className="text-xl font-black">{item.number}</strong></span>
                </a>
              );
            })}
            <a href="tel:112" className="flex min-h-[64px] items-center justify-between gap-3 rounded-lg bg-[linear-gradient(135deg,#ff245d,#ff3151)] px-5">
              <Phone className="h-9 w-9" />
              <span><strong className="block text-base font-black">Emergency SOS</strong><small className="font-semibold text-white/80">Tap to call for emergency.</small></span>
              <span className="rounded-md bg-white px-3 py-2 text-xs font-black text-[#ff245d]">Call 112</span>
            </a>
          </section>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <SkillCardSkeleton key={i} />)}</div>
          ) : error ? (
            <div className="reference-card flex items-center justify-between p-5 text-sm font-bold text-[#b91c1c]">
              <span>{error}</span>
              <button onClick={load} className="inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-xs font-black"><RefreshCw className="h-4 w-4" />Retry</button>
            </div>
          ) : (
            <>
              {toolRows.map((row) => (
                <section key={row.title}>
                  <SectionHeading icon={<Shield className="h-5 w-5" />} title={row.title} caption={row.caption} />
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {row.items.map((item) => <SafetyCard key={item.label} {...item} />)}
                  </div>
                </section>
              ))}

              {guides.length > 0 && (
                <section className="grid gap-3 md:grid-cols-3">
                  {guides.slice(0, 3).map((guide) => (
                    <Link key={guide.slug} to={`/safety/guides/${guide.slug}`} className="reference-card p-4">
                      <p className="text-sm font-black text-[#06123a]">{guide.title}</p>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#52617f]">{guide.introduction}</p>
                    </Link>
                  ))}
                </section>
              )}
            </>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
            <section>
              <SectionHeading title="Travel Safety" caption="Travel smart. Stay safe." />
              <div className="grid gap-3 sm:grid-cols-2">
                {compactCards.slice(0, 4).map((item) => <SafetyCard key={item.label} compact {...item} />)}
              </div>
            </section>
            <section>
              <SectionHeading title="Report & Take Action" caption="See something wrong? Take action." />
              <div className="grid gap-3 sm:grid-cols-3">
                {compactCards.slice(4).map((item) => <SafetyCard key={item.label} compact {...item} />)}
              </div>
            </section>
          </div>

          <section>
            <SectionHeading title="Support & Resources" caption="You are not alone. Help is always here." />
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {supportCards.map((item) => <SafetyCard key={item.label} compact {...item} />)}
            </div>
          </section>

          <section className="reference-panel grid gap-4 rounded-lg border-violet-200 bg-[#fbf7ff] p-4 lg:grid-cols-[1.25fr_3fr_1fr]">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-[#21105d]"><Shield className="h-5 w-5" /> ICC Complaint / Report</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#4b3d75]">Report workplace harassment or misconduct through the Internal Complaints Committee confidentially.</p>
              <Link to="/safety/guides/emergency-self-protection" className="mt-3 inline-flex rounded-md border border-violet-300 px-3 py-2 text-xs font-black text-[#6d28d9]">Learn About ICC</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {['Understand', 'File Complaint', 'ICC Review', 'Resolution'].map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#6d28d9] text-xs font-black text-white">{index + 1}</span>
                  <div>
                    <strong className="block text-xs font-black text-[#21105d]">{step}</strong>
                    <span className="text-[0.68rem] font-semibold text-[#5c4d82]">{index === 0 ? 'Learn about rights.' : index === 1 ? 'Submit to ICC.' : index === 2 ? 'Reviewed confidentially.' : 'Action will be informed.'}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/icc-complaint" className="inline-flex items-center justify-center gap-2 self-center rounded-md bg-[#6d28d9] px-5 py-3 text-sm font-black text-white">
              File ICC Complaint <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

interface SafetyCardProps {
  label: string;
  copy: string;
  path: string;
  action: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}

const SafetyCard: React.FC<SafetyCardProps> = ({ label, copy, path, action, tone, icon: Icon, compact }) => (
  <Link to={path} className={`reference-card safety-float-card flex items-center gap-4 p-4 ${compact ? 'min-h-[82px]' : 'min-h-[92px]'}`}>
    <span className={`safety-float-icon grid ${compact ? 'h-10 w-10' : 'h-12 w-12'} shrink-0 place-items-center rounded-lg bg-gradient-to-br ${tone} text-white`}>
      <Icon className="h-5 w-5" />
    </span>
    <span>
      <strong className="block text-sm font-black text-[#06123a]">{label}</strong>
      <span className="mt-1 line-clamp-2 block text-[0.72rem] font-semibold leading-4 text-[#52617f]">{copy}</span>
      <span className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-black text-[#075cff]">{action} <ArrowRight className="h-3 w-3" /></span>
    </span>
  </Link>
);
<PortalHero
  image={pageHeroImages.safety}
  title="Safety & Support"
  subtitle="Help When You Need It"
  copy="Access verified safety information, emergency resources and trusted support options."
  showText={false}
/>