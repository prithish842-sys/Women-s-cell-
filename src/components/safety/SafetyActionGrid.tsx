import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Bus, HeartPulse, LifeBuoy, LockKeyhole, MessageSquareWarning, MonitorSmartphone, Shield, Siren } from 'lucide-react';

const actions = [
  { label: 'Emergency Self-Protection', path: '/safety/guides/emergency-self-protection', icon: Shield },
  { label: 'Digital Safety for Women', path: '/safety/guides/digital-safety-for-women', icon: LockKeyhole },
  { label: 'Safe Travel Awareness', path: '/safety/guides/safe-travel-awareness', icon: Bus },
  { label: 'Report Harassment', path: '/icc-complaint', icon: MessageSquareWarning },
  { label: 'Cyber Crime Complaint', path: '/safety/cyber', icon: MonitorSmartphone },
  { label: 'Anonymous Concern', path: '/safety/anonymous', icon: LifeBuoy },
  { label: 'Daily Wellbeing', path: '/student/wellbeing', icon: HeartPulse },
  { label: 'AI Wellness Companion', path: '/student/wellbeing/chat', icon: Brain },
  { label: 'Emergency Help', path: '/safety/emergency', icon: Siren },
];

export const SafetyActionGrid: React.FC = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {actions.map((action) => {
      const Icon = action.icon;
      return (
        <Link key={action.path} to={action.path} className="group flex min-h-24 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-maroon-700 focus:outline-none focus:ring-2 focus:ring-amethyst/35">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-rose-50 text-maroon-700 group-hover:bg-maroon-700 group-hover:text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-maroon-700">{action.label}</span>
        </Link>
      );
    })}
  </div>
);
