export type WomensCellMemberType = 'STUDENT' | 'FACULTY';

export interface WomensCellMemberRecord {
  name: string;
  type: WomensCellMemberType;
  role?: string;
  department: string;
  course?: string;
  designation?: string;
  displayStudyYear?: string | null;
  currentStudyYear?: number;
  courseDurationYears?: number;
  joiningYear?: number;
  expectedPassingYear?: number;
  expectedCompletionDate?: string;
  registerNumber?: string;
  staffId?: string;
  email: string;
  identifier: string;
  imageFile: string;
  profileImage: string;
}

export interface StudentInChargeRole {
  identifier: string;
  registerNumber: string;
  officialPosition: string;
  functionalRole: string;
  primaryResponsibility: string;
  guidance: string[];
}

export function normalizeWomensCellName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(dr|mrs|ms|prof)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

const uploadBase = '/uploads/members/womens-cell';

export const womensCellMembers: WomensCellMemberRecord[] = [
  {
    name: 'ROJA.P',
    type: 'STUDENT',
    role: 'Chairman',
    department: 'Commerce with PA',
    course: 'B.Com (PA)',
    displayStudyYear: 'III',
    currentStudyYear: 3,
    courseDurationYears: 3,
    joiningYear: 2024,
    expectedPassingYear: 2027,
    expectedCompletionDate: '2027-04-30',
    registerNumber: 'WEC-STU-001',
    email: 'rojapbcompa2024@sankara.ac.in',
    identifier: 'WEC-STU-ROJA-P',
    imageFile: 'roja.jpeg',
    profileImage: `${uploadBase}/roja.jpeg`,
  },
  {
    name: 'Tharani.P',
    type: 'STUDENT',
    role: 'Vice Chairman',
    department: 'Dept. of Commerce (CA)',
    course: 'B.Com (CA)',
    displayStudyYear: 'III',
    currentStudyYear: 3,
    courseDurationYears: 3,
    joiningYear: 2024,
    expectedPassingYear: 2027,
    expectedCompletionDate: '2027-04-30',
    registerNumber: 'WEC-STU-004',
    email: 'tharanipbcomca2024@sankara.ac.in',
    identifier: 'WEC-STU-S-THARANI-P',
    imageFile: 'tharani.jpeg',
    profileImage: `${uploadBase}/tharani.jpeg`,
  },
  {
    name: 'Anusiya.A',
    type: 'STUDENT',
    role: 'Secretary',
    department: 'Computer Science',
    course: 'B.Sc Computer Science',
    displayStudyYear: 'II',
    currentStudyYear: 2,
    courseDurationYears: 3,
    joiningYear: 2025,
    expectedPassingYear: 2028,
    expectedCompletionDate: '2028-04-30',
    registerNumber: 'WEC-STU-003',
    email: 'anusiyabsccs2025@sankara.ac.in',
    identifier: 'WEC-STU-ANUSIYA-A',
    imageFile: 'anusiya.jpeg',
    profileImage: `${uploadBase}/anusiya.jpeg`,
  },
  {
    name: 'Durganandhini V',
    type: 'STUDENT',
    role: 'Joint Secretary',
    department: 'Commerce IT',
    course: 'B.Com IT',
    displayStudyYear: null,
    currentStudyYear: 1,
    courseDurationYears: 3,
    joiningYear: 2026,
    expectedPassingYear: 2029,
    expectedCompletionDate: '2029-04-30',
    registerNumber: 'WEC-STU-002',
    email: 'durganandhininandhini524@gmail.com',
    identifier: 'WEC-STU-DURGANANDHINI-V',
    imageFile: 'durganandhini.jpeg',
    profileImage: `${uploadBase}/durganandhini.jpeg`,
  },
  {
    name: 'Dr.A.INDUMATHI',
    type: 'FACULTY',
    role: 'Coordinator',
    designation: 'Associate Professor',
    department: 'Tamil',
    staffId: 'WEC-FAC-001',
    email: 'indumathia@sankara.ac.in',
    identifier: 'WEC-FAC-INDUMATHI',
    imageFile: 'indumathi.jpeg',
    profileImage: `${uploadBase}/indumathi.jpeg`,
  },
  {
    name: 'Dr Jayagowri G S',
    type: 'FACULTY',
    designation: 'Assistant Professor',
    department: 'Commerce with PA & IT',
    staffId: 'WEC-FAC-002',
    email: 'jayagowrigs@sankara.ac.in',
    identifier: 'WEC-FAC-JAYAGOWRI-GS',
    imageFile: 'jayagowri.jpeg',
    profileImage: `${uploadBase}/jayagowri.jpeg`,
  },
  {
    name: 'Mrs. S. Vinitha',
    type: 'FACULTY',
    designation: 'Assistant Professor',
    department: 'Commerce CA',
    staffId: 'WEC-FAC-003',
    email: 'vinithas@sankara.ac.in',
    identifier: 'WEC-FAC-S-VINITHA',
    imageFile: 'vinitha.jpeg',
    profileImage: `${uploadBase}/vinitha.jpeg`,
  },
  {
    name: 'Mrs. Revathi Mani',
    type: 'FACULTY',
    designation: 'Assistant Professor',
    department: 'Catering Science and Hotel Management',
    staffId: 'WEC-FAC-004',
    email: 'revathim@sankara.ac.in',
    identifier: 'WEC-FAC-REVATHI-MANI',
    imageFile: 'revathi_mani.jpeg',
    profileImage: `${uploadBase}/revathi_mani.jpeg`,
  },
  {
    name: 'S. Archana',
    type: 'FACULTY',
    designation: 'Assistant Professor',
    department: 'Commerce CA',
    staffId: 'WEC-FAC-005',
    email: 'archanas@sankara.ac.in',
    identifier: 'WEC-FAC-S-ARCHANA',
    imageFile: 'archana.jpeg',
    profileImage: `${uploadBase}/archana.jpeg`,
  },
  {
    name: 'SathyPriya.S',
    type: 'FACULTY',
    role: 'Faculty',
    designation: 'Faculty',
    department: 'Bachelor of Computer Science',
    staffId: 'WEC-FAC-007',
    email: 'sathyapriyas@sankara.ac.in',
    identifier: 'WEC-FAC-SATHYPRIYA-S',
    imageFile: 'sathyapriya.jpeg',
    profileImage: `${uploadBase}/sathyapriya.jpeg`,
  },
  {
    name: 'Mrs. R. RESHMI',
    type: 'FACULTY',
    designation: 'Assistant Professor',
    department: 'Information Technology',
    staffId: 'WEC-FAC-006',
    email: 'reshmir@sankara.ac.in',
    identifier: 'WEC-FAC-R-RESHMI',
    imageFile: 'reshmi.jpeg',
    profileImage: `${uploadBase}/reshmi.jpeg`,
  },
];

export const womensCellMemberByName = new Map(
  womensCellMembers.map(member => [normalizeWomensCellName(member.name), member]),
);

export const studentInChargeRoles: StudentInChargeRole[] = [
  {
    identifier: 'WEC-STU-ROJA-P',
    registerNumber: 'WEC-STU-001',
    officialPosition: 'Chairman',
    functionalRole: 'Student Engagement Lead',
    primaryResponsibility: 'Weekly Student Interaction',
    guidance: ['Weekly Student Connect', 'Student Feedback', 'Peer Interaction', 'Student Requirements', 'Follow-up'],
  },
  {
    identifier: 'WEC-STU-S-THARANI-P',
    registerNumber: 'WEC-STU-004',
    officialPosition: 'Vice Chairman',
    functionalRole: 'Skill & Career Development Lead',
    primaryResponsibility: 'Career and skill-development coordination',
    guidance: ['Career Guidance', 'Skill Development', 'Peer Learning', 'Aptitude Session', 'Communication Session'],
  },
  {
    identifier: 'WEC-STU-ANUSIYA-A',
    registerNumber: 'WEC-STU-003',
    officialPosition: 'Secretary',
    functionalRole: 'Schemes & Opportunities Coordinator',
    primaryResponsibility: 'Scheme and opportunity awareness',
    guidance: ['Scheme Awareness', 'Scholarship', 'Internship', 'Competition', 'Training', 'Entrepreneurship Opportunity'],
  },
  {
    identifier: 'WEC-STU-DURGANANDHINI-V',
    registerNumber: 'WEC-STU-002',
    officialPosition: 'Joint Secretary',
    functionalRole: 'Events & Community Coordinator',
    primaryResponsibility: 'Event participation and volunteer coordination',
    guidance: ['Event Coordination', 'Campaign', 'Awareness Programme', 'Volunteer Coordination', 'Student Participation'],
  },
];

export const studentInChargeByIdentifier = new Map(
  studentInChargeRoles.map(role => [role.identifier, role]),
);

export const studentInChargeByRegisterNumber = new Map(
  studentInChargeRoles.map(role => [role.registerNumber, role]),
);
