import homeHero from '../../page images/homepage.png';
import aboutHero from '../../page images/aboutpage.png';
import clubHero from '../../page images/singapenclub.png';
import schemesHero from '../../page images/schemespage.png';
import skillsHero from '../../page images/skillspage.png';
import safetyHero from '../../page images/safetypage.png';
import galleryHero from '../../page images/gallerypage.png';

import mobileHomeHero from '../assets/images/hero/mobile/homepage.png';
import mobileAboutHero from '../assets/images/hero/mobile/aboutpage.png';
import mobileClubHero from '../assets/images/hero/mobile/singapenclub.png';
import mobileSchemesHero from '../assets/images/hero/mobile/schemespage.png';
import mobileSkillsHero from '../assets/images/hero/mobile/skillspage.png';
import mobileSafetyHero from '../assets/images/hero/mobile/safetypage.png';
import mobileGalleryHero from '../assets/images/hero/mobile/gallerypage.png';

export const pageHeroImages = {
  home: homeHero,
  about: aboutHero,
  club: clubHero,
  schemes: schemesHero,
  skills: skillsHero,
  safety: safetyHero,
  gallery: galleryHero,
} as const;

export const mobilePageHeroImages = {
  home: mobileHomeHero,
  about: mobileAboutHero,
  club: mobileClubHero,
  schemes: mobileSchemesHero,
  skills: mobileSkillsHero,
  safety: mobileSafetyHero,
  gallery: mobileGalleryHero,
} as const;

