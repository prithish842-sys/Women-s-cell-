import React, { useEffect, useState } from 'react';
import { CheckCircle, Heart, BookOpen } from 'lucide-react';
import api from '../../utils/api.js';
import { SiteContentMap } from '../../types.js';

export const About: React.FC = () => {
  const [content, setContent] = useState<SiteContentMap>({});

  useEffect(() => {
    let active = true;
    const loadContent = async () => {
      try {
        const contentRes = await api.get('/public/site-content');
        if (!active) return;
        if (contentRes.data.success) setContent(contentRes.data.data);
      } catch (error) {
        console.error('About page content failed to load:', error);
      }
    };
    loadContent();
    return () => {
      active = false;
    };
  }, []);

  const about = content.about;
  const metadata = about?.metadata || {};
  const objectives: string[] = Array.isArray(metadata.objectives) ? metadata.objectives : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="font-serif text-4xl font-bold text-maroon-700">About Our Women's Empowerment Cell</h1>
        <p className="text-sm text-gray-600 max-w-xl mx-auto">
          {about?.title || 'Dedicated to building an equitable, self-reliant, and safe campus ecosystem for girl students.'}
        </p>
        <div className="w-24 h-1 bg-gold-600 mx-auto rounded"></div>
      </div>

      {/* History/Overview Card */}
      <section className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm space-y-4">
        <h2 className="font-serif text-2xl font-bold text-maroon-700">Historical Foundations</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {about?.content || "The Women's Empowerment Cell supports safety, empowerment, leadership, and student-led community growth through the Singa Pen Club."}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Through this integrated digital portal, we track student accomplishments, organize specialized bootcamps, counsel students on state scholarships, and run localized project recruitments.
        </p>
      </section>

      {/* Vision & Mission bento cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-maroon-900/5 to-rose-600/5 p-6 rounded-xl border border-maroon-200 shadow-sm space-y-3">
          <Heart className="w-8 h-8 text-rose-600" />
          <h3 className="text-lg font-bold text-maroon-700">Vision Statement</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {metadata.vision || 'To build a secure, progressive, and equitable campus ecosystem where young women emerge as self-reliant leaders, innovators, and entrepreneurs.'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-maroon-900/5 to-rose-600/5 p-6 rounded-xl border border-maroon-200 shadow-sm space-y-3">
          <BookOpen className="w-8 h-8 text-maroon-700" />
          <h3 className="text-lg font-bold text-maroon-700">Core Mission</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {metadata.mission || 'To organize training, raise scheme awareness, mentor student ideas, and display student talent to the academic community.'}
          </p>
        </div>
      </section>

      {/* Objectives */}
      <section className="bg-cream-100 p-8 rounded-2xl border-2 border-gold-600 shadow-inner space-y-4">
        <h2 className="font-serif text-2xl font-bold text-maroon-700">Key Cell Objectives</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          {(objectives.length ? objectives : [
            'Organize hands-on skill workshops and awareness programmes.',
            'Facilitate student applications for state and central women schemes.',
            'Act as an incubator for female-led business proposals on campus.',
            'Maintain a searchable skills database for college collaborations.'
          ]).map((objective) => (
            <div key={objective} className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{objective}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
