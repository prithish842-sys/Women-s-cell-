import homeHero from '../assets/images/hero/desktop/homepage.png';
import aboutHero from '../assets/images/hero/desktop/aboutpage.png';
import clubHero from '../assets/images/hero/desktop/singapenclub.png';
import schemesHero from '../assets/images/hero/desktop/schemespage.png';
import skillsHero from '../assets/images/hero/desktop/skillspage.png';
import safetyHero from '../assets/images/hero/desktop/safetypage.png';
import galleryHero from '../assets/images/hero/desktop/gallerypage.png';

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