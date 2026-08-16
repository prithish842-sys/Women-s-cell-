import { SchemeStatus } from '@prisma/client';

const verifiedDate = '2026-08-09';

type VerifiedGovernmentScheme = {
  title: string;
  slug: string;
  provider: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string[];
  applicationProcess: string;
  officialUrl: string;
  contactInformation: string;
  status: SchemeStatus;
  isFeatured: boolean;
};

export const verifiedGovernmentSchemes: VerifiedGovernmentScheme[] = [
  {
    title: 'Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme - Pudhumai Penn',
    slug: 'pudhumai-penn-higher-education-assurance',
    provider: 'Tamil Nadu Social Welfare & Women Empowerment Department',
    category: 'Education',
    shortDescription: 'Monthly assistance of Rs.1,000 for eligible girl students from Tamil Nadu government schools pursuing higher education.',
    fullDescription: `Verified on ${verifiedDate} from the official Tamil Nadu Social Welfare & Women Empowerment Department portal. The scheme supports eligible girl students who studied from Classes 6 to 12 in government schools and continue into recognized higher education courses.`,
    eligibility: 'Girl students who studied Classes 6 to 12 in Tamil Nadu government schools and are enrolled in recognized undergraduate, diploma, ITI, or eligible higher education courses.',
    benefits: 'Rs.1,000 per month through direct benefit transfer until uninterrupted completion of the eligible first higher education course.',
    requiredDocuments: ['Student identity proof', 'Government school study proof', 'College bonafide certificate', 'Bank account details'],
    applicationProcess: 'Apply through the official Pudhumai Penn / Penkalvi process with college coordination where required.',
    officialUrl: 'https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn',
    contactInformation: `Source: Official Tamil Nadu Social Welfare & Women Empowerment Department. Verified on ${verifiedDate}.`,
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    title: 'Tamil Nadu Women Entrepreneurs Empowerment Scheme (TWEES)',
    slug: 'tamil-nadu-women-entrepreneurs-empowerment-scheme-twees',
    provider: 'Tamil Nadu Micro, Small and Medium Enterprises Department',
    category: 'Entrepreneurship',
    shortDescription: 'Tamil Nadu MSME scheme supporting women entrepreneurs with enterprise assistance through the official TWEES portal.',
    fullDescription: `Verified on ${verifiedDate} from the official Tamil Nadu MSME TWEES portal, which shows FY 2026-2027 scheme dashboard and online application modules.`,
    eligibility: 'Women entrepreneurs meeting the eligibility conditions published by the Tamil Nadu MSME TWEES portal.',
    benefits: 'Enterprise-support assistance as per the current TWEES guidelines, eligibility checks, and application process published by Tamil Nadu MSME.',
    requiredDocuments: ['Identity proof', 'Enterprise details', 'Project or business documents', 'Documents listed by the official TWEES portal'],
    applicationProcess: 'Use the official TWEES portal eligibility, guidelines, and online application flow.',
    officialUrl: 'https://www.msmeonline.tn.gov.in/twees/index.php',
    contactInformation: `Source: Official Tamil Nadu MSME TWEES portal. Verified on ${verifiedDate}.`,
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    title: 'Stand-Up India',
    slug: 'stand-up-india-women-entrepreneurs',
    provider: 'Government of India - Ministry of Finance / myScheme',
    category: 'Startup Support',
    shortDescription: 'Bank loan facilitation for women entrepreneurs setting up greenfield enterprises.',
    fullDescription: `Verified on ${verifiedDate} from Government of India myScheme. The scheme facilitates bank loans for SC/ST and women entrepreneurs for greenfield enterprise setup.`,
    eligibility: 'Women entrepreneurs aged 18 or above setting up eligible greenfield enterprises, subject to bank and official scheme conditions.',
    benefits: 'Bank loan facilitation for eligible enterprise setup as described on the official myScheme / Stand-Up India listing.',
    requiredDocuments: ['Identity proof', 'Business plan', 'Enterprise and bank documents', 'Documents required by the lending bank'],
    applicationProcess: 'Review eligibility through myScheme and apply via the official Stand-Up India / bank-linked process.',
    officialUrl: 'https://www.myscheme.gov.in/schemes/sui',
    contactInformation: `Source: Government of India myScheme. Verified on ${verifiedDate}.`,
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    title: 'New Swarnima Scheme for Women',
    slug: 'new-swarnima-scheme-for-women',
    provider: 'Government of India - myScheme',
    category: 'Financial Assistance',
    shortDescription: 'Loan support for women entrepreneurs from backward classes through the official government scheme listing.',
    fullDescription: `Verified on ${verifiedDate} from Government of India myScheme. The listing describes financial support for women entrepreneurs from backward classes.`,
    eligibility: 'Women from backward classes meeting the income, age, and lending conditions specified on the official scheme page.',
    benefits: 'Loan support up to the officially specified limit and interest terms published on myScheme.',
    requiredDocuments: ['Identity proof', 'Category or eligibility proof', 'Income proof', 'Business purpose documents'],
    applicationProcess: 'Follow the application instructions and channel specified on the official myScheme page.',
    officialUrl: 'https://www.myscheme.gov.in/schemes/nssw',
    contactInformation: `Source: Government of India myScheme. Verified on ${verifiedDate}.`,
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    title: 'Mahila Samriddhi Yojana',
    slug: 'mahila-samriddhi-yojana-women-entrepreneurs',
    provider: 'Government of India - myScheme',
    category: 'Entrepreneurship',
    shortDescription: 'Financial support scheme for women entrepreneurs from backward or poor backgrounds.',
    fullDescription: `Verified on ${verifiedDate} from Government of India myScheme. The listing describes support for women entrepreneurs from backward or poor backgrounds.`,
    eligibility: 'Women entrepreneurs meeting the social, economic, and scheme-specific criteria listed on the official government page.',
    benefits: 'Financial support for eligible women entrepreneurs as provided through the official scheme framework.',
    requiredDocuments: ['Identity proof', 'Eligibility proof', 'Income proof', 'Business or self-employment documents'],
    applicationProcess: 'Use the official myScheme guidance and linked implementation channel.',
    officialUrl: 'https://www.myscheme.gov.in/schemes/cbssc-msy',
    contactInformation: `Source: Government of India myScheme. Verified on ${verifiedDate}.`,
    status: 'ACTIVE',
    isFeatured: false,
  },
];

export { verifiedDate as governmentSchemeVerifiedDate };
