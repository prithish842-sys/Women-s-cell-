import React from 'react';

import OriginalProfileCard from '../components/animation-preview/OriginalProfileCard.js';

export const AnimationPreviewPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <OriginalProfileCard />
    </div>
  );
};

