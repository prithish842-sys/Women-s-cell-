import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, Eye, HeartHandshake, Landmark, Rocket, Shield, Sparkles, Target, Users } from 'lucide-react';
import api from '../../utils/api.js';
import { SiteContentMap } from '../../types.js';
import { PortalHero, SectionHeading } from '../../components/common/ReferenceChrome.js';
import { mobilePageHeroImages, pageHeroImages } from '../../utils/pageHeroImages.js';

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

  return (
    <div className="reference-shell">
      <PortalHero
        image={pageHeroImages.about}
                    mobileImage={mobilePageHeroImages.about}
mobileImagePosition="57% center"
          mobileImageWidth="100%"
        title="Empowering Women."
        subtitle="Empowering Future."
        copy={about?.content || 'Singa Pen Portal is a one-stop digital platform dedicated to the holistic empowerment of women through opportunities, skills, safety and wellbeing.'}
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
          <section className="reference-panel rounded-lg p-7">
            <SectionHeading icon={<Sparkles className="h-5 w-5 text-[#7c3aed]" />} title="Role of Singa Pen" caption="How the club works inside the college." />
            <div className="space-y-3">
              {[
                ['Student Empowerment', 'Creates a visible space for students to participate, lead and access support.'],
                ['Skill Development', 'Encourages students to identify, present and improve practical skills.'],
                ['Leadership', 'Helps students take part in club activities, coordination and responsible initiatives.'],
                ['Awareness & Safety', 'Connects students with safety guidance, support resources and confidence-building information.'],
                ['Government Opportunities', 'Makes relevant schemes easier to discover and understand.'],
                ['Community Engagement', 'Supports collaboration through members, activities and gallery documentation.'],
              ].map(([value, copy]) => (
                <p key={value} className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
                  <strong className="font-black text-[#e91670]">{value}</strong>
                  <span className="font-semibold text-[#52617f]">{copy}</span>
                </p>
              ))}
            </div>
          </section>

          <section className="reference-panel rounded-lg p-5">
            <SectionHeading icon={<Users className="h-5 w-5 text-[#7c3aed]" />} title="Key Areas of Support" caption="Practical ways students benefit from the portal." />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Skills & Career', Award, 'Skill profiles, discovery and project-readiness support.'],
                ['Government Opportunities', Landmark, 'Scheme browsing, eligibility awareness and student opportunity discovery.'],
                ['Safety & Awareness', Shield, 'Safety tools, verified resources and pathways to urgent help.'],
                ['Leadership & Participation', Users, 'Singa Pen Club participation, responsibilities and initiative support.'],
                ['Community Support', HeartHandshake, 'A visible support network for collaboration and encouragement.'],
              ].map(([title, Icon, copy]) => (
                <article key={title as string} className="reference-card flex gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f5ff] text-[#075cff]"><Icon className="h-5 w-5" /></span>
                  <span>
                    <strong className="block text-sm font-black text-[#06123a]">{title as string}</strong>
                    <small className="mt-1 block text-xs font-semibold leading-5 text-[#52617f]">{copy as string}</small>
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
<PortalHero
  image={pageHeroImages.about}
  title="About Singa Pen"
  subtitle="Women's Empowerment Cell"
  copy="A platform created to support, connect and empower women through opportunities, awareness, leadership and wellbeing."
  showText={false}
/>