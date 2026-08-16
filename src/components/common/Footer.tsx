import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Star, BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-bg text-cream-100 border-t-4 border-gold-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: College and Women's Empowerment Cell Intro */}
          <div className="md:col-span-1.5 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-maroon-700 to-rose-600 flex items-center justify-center font-serif text-white font-bold text-xs border border-gold-500">
                SP
              </div>
              <h3 className="font-serif text-base font-bold uppercase tracking-tight text-white">
                Singa Pen Portal
              </h3>
            </div>
            <p className="text-xs text-cream-100/80 leading-relaxed max-w-sm font-sans">
              The official portal for the Women's Empowerment Cell of Sankara College of Science and Commerce and its Singa Pen executive club. Enabling leadership, professional skill matching, entrepreneurial launches, and state scheme distribution.
            </p>
            <div className="inline-flex items-center space-x-1.5 text-[10px] text-cream-100 font-semibold uppercase tracking-wider bg-maroon-900/60 px-2.5 py-1.5 border border-gold-600/30 rounded">
              <Shield className="w-3 h-3 text-gold-500" />
              <span>Anti-Harassment & Safety Compliant</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-bold tracking-widest text-gold-500 uppercase border-b border-white/10 pb-1.5">
              Quick Navigation
            </h4>
            <ul className="text-xs space-y-2.5">
              <li>
                <Link to="/" className="text-cream-100/75 hover:text-gold-500 hover:underline transition-all">Home Page</Link>
              </li>
              <li>
                <Link to="/about" className="text-cream-100/75 hover:text-gold-500 hover:underline transition-all">About Women's Empowerment Cell</Link>
              </li>
              <li>
                <Link to="/members" className="text-cream-100/75 hover:text-gold-500 hover:underline transition-all">Singa Pen club Members</Link>
              </li>
              <li>
                <Link to="/schemes" className="text-cream-100/75 hover:text-gold-500 hover:underline transition-all">Government Schemes</Link>
              </li>
              <li>
                <Link to="/login" className="text-cream-100/75 hover:text-gold-500 hover:underline transition-all">Member Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Areas */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-bold tracking-widest text-gold-500 uppercase border-b border-white/10 pb-1.5">
              Key Focus Areas
            </h4>
            <ul className="text-xs space-y-2.5 text-cream-100/75">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                <span>Women Student Directory</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                <span>Skill-based Student Searches</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                <span>Scholarships & Subsidies</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                <span>Incubating Young Startups</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div className="space-y-3">
            <h4 className="font-serif text-xs font-bold tracking-widest text-gold-500 uppercase border-b border-white/10 pb-1.5">
              Cell Contacts
            </h4>
            <ul className="text-xs space-y-3 text-cream-100/75">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed">Sankara College of Science and Commerce, Coimbatore - 641035</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                <span>044-22334455 / Ext 112</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                <span className="underline hover:text-gold-500">womenscell@college.edu</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Credits */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-cream-100/75 space-y-2">
          <p className="font-serif italic text-sm text-cream-100/90">
            Defining the new standard of campus-led women empowerment.
          </p>
          <p className="font-sans font-bold uppercase tracking-wider text-[10px] text-gold-500">
            © {currentYear} Sankara College of Science and Commerce. All rights reserved.
          </p>
          <p className="text-[10px] text-cream-100/50 max-w-xl mx-auto italic font-sans leading-relaxed">
            Disclaimer: Government scheme data listed here is for awareness. Students are requested to refer to formal official government links for eligibility verification before applying.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
