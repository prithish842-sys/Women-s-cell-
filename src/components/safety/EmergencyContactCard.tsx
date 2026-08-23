import React, { useState } from 'react';
import { Copy, ExternalLink, Mail, MapPin, Phone, Save } from 'lucide-react';

type Resource = {
  _id: string;
  name: string;
  purpose: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  website?: string;
  category: string;
  isEmergency?: boolean;
  isOfficial?: boolean;
  sourceName?: string;
  verifiedDate?: string;
};

export const EmergencyContactCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const [copied, setCopied] = useState(false);
  const copyNumber = async () => {
    if (!resource.phone) return;
    await navigator.clipboard?.writeText(resource.phone);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const saveContact = () => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${resource.name}`];
    if (resource.phone) lines.push(`TEL:${resource.phone}`);
    if (resource.email) lines.push(`EMAIL:${resource.email}`);
    if (resource.website) lines.push(`URL:${resource.website}`);
    lines.push('END:VCARD');
    const blob = new Blob([lines.join('\n')], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article className="flex min-h-64 flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-maroon-700">{resource.name}</h2>
            <p className="mt-1 text-xs font-bold uppercase text-gray-500">{resource.category.replaceAll('_', ' ')}</p>
          </div>
          {resource.isEmergency && <span className="rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">Emergency</span>}
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-600">{resource.purpose}</p>
        {resource.sourceName && (
          <p className="mt-3 text-xs text-gray-500">
            Source: {resource.sourceName}{resource.verifiedDate ? ` · Verified ${resource.verifiedDate}` : ''}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        {resource.phone && <a href={`tel:${resource.phone}`} className="inline-flex items-center gap-1 rounded-md bg-maroon-700 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" />Call</a>}
        {resource.phone && <button onClick={copyNumber} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-maroon-700"><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</button>}
        {resource.email && <a href={`mailto:${resource.email}`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-maroon-700"><Mail className="h-3.5 w-3.5" />Email</a>}
        {resource.website && <a href={resource.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-maroon-700"><ExternalLink className="h-3.5 w-3.5" />Website</a>}
        {resource.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resource.address)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-maroon-700"><MapPin className="h-3.5 w-3.5" />Map</a>}
        {(resource.phone || resource.email || resource.website) && <button onClick={saveContact} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-maroon-700"><Save className="h-3.5 w-3.5" />Save</button>}
      </div>
    </article>
  );
};
