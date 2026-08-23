import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import api from '../../utils/api.js';

type FooterHelpline = { name: string; phone: string; isEmergency?: boolean };
type FooterStaffContact = { name: string; responsibility?: string; designation?: string; email?: string };

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const quickLinks = [
    ['Home', '/'],
    ['About Us', '/about'],
    ['Singa Pen Club', '/members'],
    ['Govt Schemes', '/schemes'],
    ['Skills', '/skills'],
    ['Safety', '/safety'],
    ['Gallery', '/gallery'],
  ];
  const resources = ['Help Center', 'FAQs', 'Blog', 'Events', 'Privacy Policy', 'Terms & Conditions'];
  const [helplines, setHelplines] = useState<FooterHelpline[]>([
    { name: 'Emergency Response Support System', phone: '112', isEmergency: true },
    { name: 'Women Helpline', phone: '181', isEmergency: true },
    { name: 'Tele MANAS', phone: '14416' },
  ]);
  const [staffContacts, setStaffContacts] = useState<FooterStaffContact[]>([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/safety/official-resources'),
      api.get('/public/in-charges'),
    ]).then(([resourceRes, staffRes]) => {
      if (!active) return;
      if (resourceRes.status === 'fulfilled' && resourceRes.value.data.success) {
        setHelplines(
          resourceRes.value.data.data
            .filter((resource: FooterHelpline) => resource.phone)
            .slice(0, 4),
        );
      }
      if (staffRes.status === 'fulfilled' && staffRes.value.data.success) {
        setStaffContacts(staffRes.value.data.data.slice(0, 3));
      }
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="bg-[linear-gradient(180deg,#031039_0%,#06184d_100%)] text-white">
      <div className="reference-container grid gap-8 border-b border-white/12 py-9 md:grid-cols-[1.2fr_0.7fr_0.85fr_1fr] lg:grid-cols-[1.15fr_0.65fr_0.85fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/8 text-sm font-black">SP</span>
            <div>
              <h2 className="text-xl font-black leading-none">Singa Pen Portal</h2>
              <p className="mt-1 text-[0.68rem] font-semibold text-white/65">Empowering Women. Empowering Future.</p>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-7 text-white/72">Women's Empowerment Cell of Sankara College of Science and Commerce, supporting opportunities, skills, safety and wellbeing.</p>
        </div>

        <div className="md:justify-self-center">
          <h3 className="mb-3 text-sm font-black">Quick Links</h3>
          <ul className="space-y-1.5 text-sm text-white/72">
            {quickLinks.map(([label, path]) => <li key={label}><Link to={path} className="hover:text-white">{label}</Link></li>)}
          </ul>
        </div>

        <div className="md:justify-self-end">
          <h3 className="mb-3 text-sm font-black">Resources</h3>
          <ul className="space-y-1.5 text-sm text-white/72">
            {resources.map((item) => <li key={item}><span>{item}</span></li>)}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Support Contacts</h3>
          <div className="grid gap-4 text-sm text-white/72">
            <div className="space-y-1.5">
              {helplines.map((resource) => (
                <a key={`${resource.name}-${resource.phone}`} href={`tel:${resource.phone}`} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:text-white">
                  <span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-cyan-300" />{resource.name}</span>
                  <strong className="text-white">{resource.phone}</strong>
                </a>
              ))}
            </div>
            {staffContacts.length > 0 && (
              <div className="space-y-1.5">
                {staffContacts.map((contact) => (
                  contact.email ? (
                    <a key={contact.email} href={`mailto:${contact.email}`} className="block rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:text-white">
                      <span className="block font-black text-white">{contact.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5 text-cyan-300" /> {contact.designation || contact.responsibility || 'Women Empowerment Cell'}</span>
                    </a>
                  ) : (
                    <div key={contact.name} className="block rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <span className="block font-black text-white">{contact.name}</span>
                      <span className="mt-0.5 block text-xs">{contact.designation || contact.responsibility || 'Women Empowerment Cell'}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      <div className="reference-container flex flex-col gap-3 py-5 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
        <p>© {currentYear} Singa Pen Portal. All rights reserved.</p>
        <p>Made with <span className="text-[#ff2a75]">heart</span> for every woman.</p>
      </div>
    </footer>
  );
};

export default Footer;
