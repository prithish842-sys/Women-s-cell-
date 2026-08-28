import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, ExternalLink, Eye, GraduationCap, HeartHandshake, Landmark, Rocket, Shield, Sparkles, Target, Users } from 'lucide-react';
import api from '../../utils/api.js';
import { SiteContentMap } from '../../types.js';
import { PortalHero, SectionHeading } from '../../components/common/ReferenceChrome.js';
import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';
import sankaraLogo from '../../assets/branding/sankara-logo.png';

export const About: React.FC = () => {
  const [content, setContent] = useState<SiteContentMap>({});

  useEffect(() => {
    let active = true;
    const loadContent = async () => {
      try {
        const contentRes = await api.get('/public/site-content');
        if (active && contentRes.data.success) setContent(contentRes.data.data);
      } catch (error) {
        console.error('About page content failed to load:', error);
      }
    };
    loadContent();
    return () => { active = false; };
  }, []);

  const about = content.about;
  const metadata = about?.metadata || {};
  const objectives: string[] = Array.isArray(metadata.objectives) ? metadata.objectives : [];
  const roleCards = [
    {
      title: 'Skill Discovery & Growth',
      copy: 'Help students record, develop and showcase academic, creative, technical and professional abilities.',
      icon: Award,
    },
    {
      title: 'Opportunities & Government Support',
      copy: 'Make scholarships, schemes, skill-development initiatives and women-focused opportunities easier to discover.',
      icon: Landmark,
    },
    {
      title: 'Leadership & Participation',
      copy: 'Encourage students to participate in college activities, Women Empowerment Cell initiatives and leadership opportunities.',
      icon: Users,
    },
    {
      title: 'Safety, Wellbeing & Awareness',
      copy: 'Provide quick access to verified safety resources, support information, awareness material and relevant helplines.',
      icon: Shield,
    },
    {
      title: 'Faculty-Student Collaboration',
      copy: 'Allow authorised faculty to discover students by skills and availability for projects, activities and institutional programmes.',
      icon: GraduationCap,
    },
    {
      title: 'Continuing Community',
      copy: 'Preserve member profiles and contributions as students progress academically and later become alumni.',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="reference-shell">
      <PortalHero
        image={pageHeroImages.about}
                    mobileImage={mobilePageHeroImages.about}
mobileImagePosition="57% center"
          mobileImageWidth="100%"
        title="Empowering Women."
        subtitle="Empowering Future."
        copy={about?.content || "Singa Pen Portal is a one-stop digital platform dedicated to the holistic empowerment of women through opportunities, skills, safety and wellbeing, proudly established at Sankara College of Science and Commerce."}
        showText={false}
      />

      <main className="reference-container -mt-6 space-y-6 pb-10">
        <section className="relative z-10 grid gap-4 lg:grid-cols-3">
          <InfoCard icon={<Target className="h-7 w-7" />} title="Our Mission" tone="text-[#e91670]" copy={metadata.mission || 'To empower women by providing equal access to opportunities, skills, resources and support systems.'} />
          <InfoCard icon={<Eye className="h-7 w-7" />} title="Our Vision" tone="text-[#7c3aed]" copy={metadata.vision || 'A society where every woman is safe, skilled, financially independent and has the freedom to dream and achieve without limits.'} />
          <div className="reference-card min-h-[178px] p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-13 w-13 place-items-center rounded-full bg-[#eaffff] text-[#0891b2]"><Rocket className="h-7 w-7" /></span>
              <div>
                <h2 className="text-xl font-black text-[#0891b2]">Our Objectives</h2>
                <div className="mt-4 space-y-2">
                  {(objectives.length ? objectives : ['Provide equal access to education and skilling', 'Promote safety, wellbeing and mental health', 'Support entrepreneurship and financial independence', 'Build a strong community of women leaders', 'Advocate for gender equality and inclusion']).slice(0, 5).map((objective) => (
                    <p key={objective} className="flex items-start gap-2 text-sm font-semibold leading-5 text-[#33456e]">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0891b2]" /> {objective}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="reference-panel relative overflow-hidden rounded-lg p-7">
            <img
              src={sankaraLogo}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 object-contain opacity-[0.08] grayscale sm:h-72 sm:w-72"
            />
            <div className="relative z-10">
              <SectionHeading
                icon={<Sparkles className="h-5 w-5 text-[#7c3aed]" />}
                title="Role of Singa Pen at Sankara"
                caption="Empowering students beyond the classroom."
              />
              <p className="max-w-3xl text-sm font-semibold leading-7 text-[#33456e]">
                Singa Pen serves as a student-focused initiative of the Women Empowerment Cell at Sankara College of Science and Commerce. It brings information, skills, opportunities, support and student participation into one connected platform, helping women students discover resources, develop confidence, showcase their abilities and engage more actively in college initiatives.
              </p>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#52617f]">
                The portal complements Sankara's emphasis on learning beyond the curriculum, leadership, career readiness, culture, values and socially responsible student development.
              </p>
              <a
                href="https://www.sankara.ac.in/science-and-commerce/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#c7d7ff] bg-white px-4 py-2.5 text-xs font-black text-[#075cff] transition hover:border-[#075cff] hover:bg-[#f7faff]"
              >
                Visit Sankara College Website
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>

          <section className="reference-panel rounded-lg p-5">
            <SectionHeading icon={<Users className="h-5 w-5 text-[#7c3aed]" />} title="How Singa Pen Supports Students" caption="Practical ways students benefit from the portal." />
            <div className="grid gap-3 sm:grid-cols-2">
              {roleCards.map(({ title, icon: Icon, copy }) => (
                <article key={title as string} className="reference-card flex gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]"><Icon className="h-5 w-5" /></span>
                  <span>
                    <strong className="block text-sm font-black text-[#06123a]">{title}</strong>
                    <small className="mt-1 block text-xs font-semibold leading-5 text-[#52617f]">{copy}</small>
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; copy: string; tone: string }> = ({ icon, title, copy, tone }) => (
  <article className="reference-card min-h-[178px] p-6">
    <div className="flex items-start gap-4">
      <span className={`grid h-13 w-13 place-items-center rounded-full bg-[#fff0f6] ${tone}`}>{icon}</span>
      <div>
        <h2 className={`text-xl font-black ${tone}`}>{title}</h2>
        <p className="mt-4 text-sm font-semibold leading-6 text-[#33456e]">{copy}</p>
      </div>
    </div>
  </article>
);
export default About;
