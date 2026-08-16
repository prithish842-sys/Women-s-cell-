import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Users, StudentProfiles, FacultyProfiles, GovernmentSchemes, SiteContents, Skills, GalleryAlbums, GalleryImages, Achievements } from '../models/index.js';
import { prisma } from '../config/prisma.js';

export async function runSeed() {
  console.log('--- Starting Database Seeding ---');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seeding is disabled in production.');
  }
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Destructive seed is disabled. Set ALLOW_DESTRUCTIVE_SEED=true only for local development.');
  }

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (
    !seedPassword ||
    seedPassword === 'CHANGE_ME_FOR_LOCAL_SEED' ||
    !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(seedPassword)
  ) {
    throw new Error('SEED_DEFAULT_PASSWORD must be set to a strong local seed password before running npm run seed.');
  }

  // 1. Clear existing PostgreSQL tables through Prisma repositories to prevent duplicates.
  await prisma.notification.deleteMany({});
  await prisma.skillRequestRecipient.deleteMany({});
  await prisma.skillRequest.deleteMany({});
  await prisma.workshopParticipation.deleteMany({});
  await prisma.workshop.deleteMany({});
  await prisma.savedScheme.deleteMany({});
  await Skills.deleteMany({});
  await GalleryImages.deleteMany({});
  await Achievements.deleteMany({});
  await GalleryAlbums.deleteMany({});
  await GovernmentSchemes.deleteMany({});
  await SiteContents.deleteMany({});
  await StudentProfiles.deleteMany({});
  await FacultyProfiles.deleteMany({});
  await Users.deleteMany({});

  console.log('✔ Cleared existing collections.');

  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);

  // 2. Create Users
  // Admin
  const adminUser = await Users.create({
    name: 'Dr. Aruna Sundar',
    email: 'aruna.admin@college.edu',
    passwordHash: defaultPasswordHash,
    role: 'ADMIN',
    identifier: 'ADMIN101',
    isActive: true,
    lastLoginAt: new Date().toISOString()
  });

  // Faculty Accounts
  const faculty1 = await Users.create({
    name: 'Prof. Meera Nair',
    email: 'meera.nair@college.edu',
    passwordHash: defaultPasswordHash,
    role: 'FACULTY',
    identifier: 'FAC201',
    isActive: true,
    lastLoginAt: ''
  });

  const faculty2 = await Users.create({
    name: 'Dr. Kavitha Selvam',
    email: 'kavitha.selvam@college.edu',
    passwordHash: defaultPasswordHash,
    role: 'FACULTY',
    identifier: 'FAC202',
    isActive: true,
    lastLoginAt: ''
  });

  await FacultyProfiles.create({
    userId: faculty1._id!,
    staffId: 'FAC201',
    department: 'Computer Science & Engineering',
    designation: "Associate Professor & Women's Empowerment Cell Coordinator",
    phone: '9840123456'
  });

  await FacultyProfiles.create({
    userId: faculty2._id!,
    staffId: 'FAC202',
    department: 'Business Administration',
    designation: 'Assistant Professor',
    phone: '9444123456'
  });

  console.log('✔ Created Admin and Faculty users.');

  // 3. Create Students
  // Define student dataset with varied joining academic years, expected passing years, and completion dates.
  // This satisfies the academic status matrix:
  // Active, Final-year, Passing-out-soon, Passed-out
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed June is academic start

  const studentData = [
    {
      name: 'Priyanka Sen',
      email: 'priyanka.sen@college.edu',
      registerNumber: 'REG401',
      phone: '9840213567',
      department: 'Computer Science',
      course: 'B.Sc Computer Science',
      bio: 'Enthusiastic developer interested in frontend arts, graphic layout, and machine learning.',
      joiningAcademicYear: `${currentYear - 1}-${currentYear}`,
      joiningYear: currentYear - 1,
      expectedPassingYear: currentYear + 2,
      expectedCompletionDate: `${currentYear + 2}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: true,
      clubRole: 'President' as const,
      achievements: ['Won the State Web Designing Hackathon 2025', 'Organizer of Girls Who Code Chapter'],
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'An AI-powered smart organic clothing matching mobile app.',
        futurePlan: 'Build a fashion tech startup in Chennai.',
        preferredIndustry: 'Fashion & E-Commerce'
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Saturday', 'Sunday'],
        preferredCollaboration: 'Remote Freelance'
      }
    },
    {
      name: 'Anjali Sharma',
      email: 'anjali.sharma@college.edu',
      registerNumber: 'REG402',
      phone: '9123456789',
      department: 'Information Technology',
      course: 'B.Tech IT',
      bio: 'Aspiring cyber security specialist and competitive programmer. Loves breaking codes and building tools.',
      joiningAcademicYear: `${currentYear - 2}-${currentYear - 1}`,
      joiningYear: currentYear - 2,
      expectedPassingYear: currentYear + 2,
      expectedCompletionDate: `${currentYear + 2}-05-15`,
      courseDurationYears: 4,
      isSingaPenMember: true,
      clubRole: 'Vice President' as const,
      achievements: ['Smart India Hackathon Finalist', 'Published paper on Cyber Safety for Women'],
      entrepreneurship: {
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Friday', 'Saturday'],
        preferredCollaboration: 'On-Campus Lab Collaboration'
      }
    },
    {
      name: 'Deepika Raman',
      email: 'deepika.raman@college.edu',
      registerNumber: 'REG403',
      phone: '9876543210',
      department: 'Electronics & Communication',
      course: 'B.E ECE',
      bio: 'Loves hardware programming, IoT controllers, and baking premium pastry cookies on weekends.',
      joiningAcademicYear: `${currentYear - 2}-${currentYear - 1}`,
      joiningYear: currentYear - 2,
      expectedPassingYear: currentYear + 1, // Final Year student
      expectedCompletionDate: `${currentYear + 1}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: true,
      clubRole: 'Secretary' as const,
      achievements: ['Designed smart IoT women safety bracelet prototype'],
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'Organic and healthy baking bakery outlet catering to colleges.',
        futurePlan: 'Launch "Deepi Cookies" startup cloud kitchen.',
        preferredIndustry: 'Food Tech'
      },
      availability: {
        availableForProjects: false
      }
    },
    {
      name: 'Keerthana Selvaraj',
      email: 'keerthana.sel@college.edu',
      registerNumber: 'REG404',
      phone: '9884123987',
      department: 'Computer Science',
      course: 'B.Sc Computer Science',
      bio: 'Creative visual designer, fine arts enthusiast, and expert in wedding tailoring styles.',
      joiningAcademicYear: `${currentYear - 2}-${currentYear - 1}`,
      joiningYear: currentYear - 2,
      expectedPassingYear: currentYear + 1, // Final Year
      expectedCompletionDate: `${currentYear + 1}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: true,
      clubRole: 'Treasurer' as const,
      achievements: ['Curator of Annual College Empowerment Art Exhibition'],
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'A customized, modern boutique store for local handcrafts.',
        futurePlan: 'Open an ethnic bridal wear design studio.',
        preferredIndustry: 'Textiles & Handloom'
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Monday', 'Tuesday'],
        preferredCollaboration: 'Design Freelancer'
      }
    },
    {
      name: 'Swetha Ramakrishnan',
      email: 'swetha.ram@college.edu',
      registerNumber: 'REG405',
      phone: '9443567112',
      department: 'Business Administration',
      course: 'M.B.A',
      bio: 'Finance major with key strengths in marketing, sales pitches, accounting and business budgeting.',
      joiningAcademicYear: `${currentYear - 1}-${currentYear}`,
      joiningYear: currentYear - 1,
      expectedPassingYear: currentYear + 1, // Final Year (2 years course)
      expectedCompletionDate: `${currentYear + 1}-05-20`,
      courseDurationYears: 2,
      isSingaPenMember: true,
      clubRole: 'Joint Secretary' as const,
      achievements: ['Winner of National B-Plan Presentation Contest'],
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'Empowerment financial advisory app for rural women business collectives.',
        preferredIndustry: 'FinTech'
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Sunday'],
        preferredCollaboration: 'Business Consultant'
      }
    },
    {
      name: 'Pooja Krishnan',
      email: 'pooja.krish@college.edu',
      registerNumber: 'REG406',
      phone: '9544123560',
      department: 'Information Technology',
      course: 'B.Tech IT',
      // PASSING_OUT_SOON (expected passing is current year, date is 30 days away)
      bio: 'Fullstack web application developer. Master of React, Node, and Tailwind styling layout designs.',
      joiningAcademicYear: `${currentYear - 3}-${currentYear - 2}`,
      joiningYear: currentYear - 3,
      expectedPassingYear: currentYear,
      expectedCompletionDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0], // 45 days from today (within 90-day bracket)
      courseDurationYears: 4,
      isSingaPenMember: true,
      clubRole: 'Coordinator' as const,
      achievements: ['Lead Frontend Engineer for college cultural portal'],
      entrepreneurship: {
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Weekdays'],
        preferredCollaboration: 'Full-time role'
      }
    },
    {
      name: 'Rithika Mohan',
      email: 'rithika.mo@college.edu',
      registerNumber: 'REG407',
      phone: '9940122334',
      department: 'English Literature',
      course: 'B.A English',
      bio: 'Orator, content writer, and public speaking coach. Certified poet and debate club host.',
      joiningAcademicYear: `${currentYear - 2}-${currentYear - 1}`,
      joiningYear: currentYear - 2,
      expectedPassingYear: currentYear + 1,
      expectedCompletionDate: `${currentYear + 1}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: true,
      clubRole: 'Volunteer' as const,
      achievements: ['Won the South-Zone Elocution Championship'],
      entrepreneurship: {
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Wednesday', 'Saturday']
      }
    },
    {
      name: 'Nisha Sundaram',
      email: 'nisha.sun@college.edu',
      registerNumber: 'REG408',
      phone: '9841122334',
      department: 'Computer Applications',
      course: 'B.C.A',
      // PASSED_OUT student (Passed out last year)
      bio: 'Alumni. Former Singa Pen executive. Currently junior software architect in Bangalore.',
      joiningAcademicYear: `${currentYear - 4}-${currentYear - 3}`,
      joiningYear: currentYear - 4,
      expectedPassingYear: currentYear - 1,
      expectedCompletionDate: `${currentYear - 1}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: true,
      clubRole: 'Member' as const,
      achievements: ['Best Performer of Singa Pen Club 2024'],
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'Co-working and child care safe spaces for remote women developers.',
        preferredIndustry: 'Real Estate / Social Enterprise'
      },
      availability: {
        availableForProjects: false
      }
    },
    // Non-club-members to make directory interesting and test search
    {
      name: 'Meenakshi Iyer',
      email: 'meenakshi.iyer@college.edu',
      registerNumber: 'REG409',
      phone: '9176543210',
      department: 'Business Administration',
      course: 'B.B.A',
      bio: 'Interested in product management, sales, data spreadsheets, and event organization management.',
      joiningAcademicYear: `${currentYear - 1}-${currentYear}`,
      joiningYear: currentYear - 1,
      expectedPassingYear: currentYear + 2,
      expectedCompletionDate: `${currentYear + 2}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: false,
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'A local eco-friendly home delivery laundry service network.'
      },
      availability: {
        availableForProjects: true
      }
    },
    {
      name: 'Fathima Jameela',
      email: 'fathima.jam@college.edu',
      registerNumber: 'REG410',
      phone: '9566112233',
      department: 'Mathematics',
      course: 'B.Sc Maths',
      bio: 'Math genius, data analytics enthusiast, tutor, and beauty-wellness blogger.',
      joiningAcademicYear: `${currentYear - 2}-${currentYear - 1}`,
      joiningYear: currentYear - 2,
      expectedPassingYear: currentYear + 1,
      expectedCompletionDate: `${currentYear + 1}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: false,
      entrepreneurship: {
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Saturday']
      }
    },
    {
      name: 'Harini Viswanathan',
      email: 'harini.vis@college.edu',
      registerNumber: 'REG411',
      phone: '9840223344',
      department: 'Electronics & Communication',
      course: 'B.E ECE',
      bio: 'Embedded C coder, robot builder, and microchip soldering tech expert.',
      joiningAcademicYear: `${currentYear - 3}-${currentYear - 2}`,
      joiningYear: currentYear - 3,
      expectedPassingYear: currentYear + 1,
      expectedCompletionDate: `${currentYear + 1}-05-15`,
      courseDurationYears: 4,
      isSingaPenMember: false,
      entrepreneurship: {
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: true
      }
    },
    {
      name: 'Gayathri Krishnan',
      email: 'gayathri.k@college.edu',
      registerNumber: 'REG412',
      phone: '9003112233',
      department: 'Chemistry',
      course: 'B.Sc Chemistry',
      bio: 'Interested in clinical chemical formulation, cosmetology, making organic soaps and creams.',
      joiningAcademicYear: `${currentYear - 1}-${currentYear}`,
      joiningYear: currentYear - 1,
      expectedPassingYear: currentYear + 2,
      expectedCompletionDate: `${currentYear + 2}-04-30`,
      courseDurationYears: 3,
      isSingaPenMember: false,
      entrepreneurship: {
        interestedInEntrepreneurship: true,
        businessIdea: 'Handmade vegan cold-process organic soaps, candles, and body oils.',
        futurePlan: 'Sell customized wellness gift sets online.',
        preferredIndustry: 'Beauty & Wellness'
      },
      availability: {
        availableForProjects: true,
        availableDays: ['Saturday', 'Sunday']
      }
    }
  ];

  for (const s of studentData) {
    const user = await Users.create({
      name: s.name,
      email: s.email,
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      identifier: s.registerNumber,
      isActive: true,
      lastLoginAt: ''
    });

    await StudentProfiles.create({
      userId: user._id!,
      registerNumber: s.registerNumber,
      phone: s.phone,
      department: s.department,
      course: s.course,
      bio: s.bio,
      joiningAcademicYear: s.joiningAcademicYear,
      joiningYear: s.joiningYear,
      expectedPassingYear: s.expectedPassingYear,
      expectedCompletionDate: s.expectedCompletionDate,
      courseDurationYears: s.courseDurationYears,
      isSingaPenMember: s.isSingaPenMember,
      clubRole: s.clubRole,
      achievements: s.achievements || [],
      clubJoinedAt: s.isSingaPenMember ? new Date().toISOString() : undefined,
      entrepreneurship: s.entrepreneurship,
      availability: s.availability
    });
  }

  console.log(`✔ Seeded ${studentData.length} student profiles and user entries.`);

  // 4. Create Skills (Seed at least 20 skills associated with different student users)
  const CSUser = await Users.findOne({ email: 'priyanka.sen@college.edu' });
  const ITUser = await Users.findOne({ email: 'anjali.sharma@college.edu' });
  const ECEUser = await Users.findOne({ email: 'deepika.raman@college.edu' });
  const CS2User = await Users.findOne({ email: 'keerthana.sel@college.edu' });
  const MBAUser = await Users.findOne({ email: 'swetha.ram@college.edu' });
  const POUser = await Users.findOne({ email: 'pooja.krish@college.edu' });
  const LITUser = await Users.findOne({ email: 'rithika.mo@college.edu' });
  const ALUser = await Users.findOne({ email: 'nisha.sun@college.edu' });
  const CHEMUser = await Users.findOne({ email: 'gayathri.k@college.edu' });

  const skillsData = [
    // Priyanka Sen (Computer Science)
    { userId: CSUser!._id!, name: 'React Development', cat: 'Technology', lvl: 'ADVANCED', exp: 2, desc: 'Building responsive fullstack applications using React, Vite, and tailwind structures.', tools: ['Vite', 'React', 'TailwindCSS'], isPri: true },
    { userId: CSUser!._id!, name: 'Graphic Design', cat: 'Graphic Design', lvl: 'INTERMEDIATE', exp: 1, desc: 'Laying out high contrast flyers, vector posters, and college event credentials.', tools: ['Figma', 'Illustrator'], isPri: true },
    { userId: CSUser!._id!, name: 'Node.js Backend', cat: 'Programming', lvl: 'BEGINNER', exp: 1, desc: 'Developing secure REST APIs using Express structures.', tools: ['Express', 'Node.js'], isPri: false },

    // Anjali Sharma (IT)
    { userId: ITUser!._id!, name: 'Python Programming', cat: 'Programming', lvl: 'EXPERT', exp: 3, desc: 'Implementing complex algorithms, file data analysis, and server configurations.', tools: ['Python', 'Pandas', 'NumPy'], isPri: true },
    { userId: ITUser!._id!, name: 'Cyber Security Auditing', cat: 'Technology', lvl: 'ADVANCED', exp: 2, desc: 'Performing secure vulnerability scans and database SQL injection mitigation reviews.', tools: ['Wireshark', 'BurpSuite'], isPri: true },

    // Deepika Raman (ECE)
    { userId: ECEUser!._id!, name: 'IoT Systems', cat: 'Technology', lvl: 'ADVANCED', exp: 2, desc: 'Integrating Raspberry Pi hardware chips with telemetry sensors and local server loops.', tools: ['Arduino', 'Raspberry Pi', 'C++'], isPri: true },
    { userId: ECEUser!._id!, name: 'Baking & Confectionery', cat: 'Cooking and Baking', lvl: 'ADVANCED', exp: 4, desc: 'Formulating healthy multi-grain premium dry biscuits, cakes, and bread pastries.', tools: ['Industrial Oven', 'Mixer'], isPri: true },

    // Keerthana Selvaraj (CS - Craft/Design focus)
    { userId: CS2User!._id!, name: 'Tailoring & Embroidery', cat: 'Tailoring', lvl: 'EXPERT', exp: 5, desc: 'Designing customized ethnic bridal wear and standard college uniform patterns.', tools: ['Singer Machine', 'Drafting Boards'], isPri: true },
    { userId: CS2User!._id!, name: 'Figma Prototyping', cat: 'Graphic Design', lvl: 'INTERMEDIATE', exp: 2, desc: 'Mapping user flows, structural bento grids, and high fidelity vector interfaces.', tools: ['Figma'], isPri: true },

    // Swetha Ramakrishnan (MBA)
    { userId: MBAUser!._id!, name: 'Business Pitching', cat: 'Business Planning', lvl: 'EXPERT', exp: 3, desc: 'Pitching financial plans to venture collectives. Drafting cash flow sheets.', tools: ['MS Excel', 'PowerPoint'], isPri: true },
    { userId: MBAUser!._id!, name: 'Social Media Strategy', cat: 'Social Media Marketing', lvl: 'ADVANCED', exp: 2, desc: 'Driving high-impression content calendars across local startup brands.', tools: ['Canva', 'Later', 'Meta Analytics'], isPri: true },
    { userId: MBAUser!._id!, name: 'Financial Accounting', cat: 'Accounting', lvl: 'INTERMEDIATE', exp: 2, desc: 'Preparing ledger files, balance sheets, and tax summaries.', tools: ['Tally', 'Excel'], isPri: false },

    // Pooja Krishnan (IT - Passing soon)
    { userId: POUser!._id!, name: 'Full-Stack JavaScript', cat: 'Programming', lvl: 'ADVANCED', exp: 3, desc: 'Building custom database web platforms using Node, Express, React and cloud storage.', tools: ['MongoDB', 'Express', 'React', 'Node'], isPri: true },
    { userId: POUser!._id!, name: 'Video Editing', cat: 'Video Editing', lvl: 'INTERMEDIATE', exp: 1, desc: 'Splicing interview clips, adding subtitles, custom transitions, and sound tracks.', tools: ['Premiere Pro', 'DaVinci Resolve'], isPri: false },

    // Rithika Mohan (English Lit)
    { userId: LITUser!._id!, name: 'Public Speaking', cat: 'Public Speaking', lvl: 'EXPERT', exp: 4, desc: 'Orating on topics of social importance, confidence coaching, and hosting major events.', tools: ['Microphone', 'Audience management'], isPri: true },
    { userId: LITUser!._id!, name: 'Content Writing', cat: 'Content Writing', lvl: 'ADVANCED', exp: 3, desc: 'Drafting high-conversion blog posts, press briefings, and student club catalogs.', tools: ['MS Word', 'Google Docs'], isPri: true },

    // Nisha Sundaram (Alumni)
    { userId: ALUser!._id!, name: 'React Native Apps', cat: 'Programming', lvl: 'EXPERT', exp: 4, desc: 'Deploying cross-platform iOS and Android mobile stores for e-commerce platforms.', tools: ['React Native', 'Expo', 'Redux'], isPri: true },
    { userId: ALUser!._id!, name: 'Beauty & Hair Styling', cat: 'Beauty and Wellness', lvl: 'ADVANCED', exp: 3, desc: 'Specialist bridal makeup, organic cosmetology styling, and skin treatments.', tools: ['Cosmetic Kits'], isPri: false },

    // Gayathri Krishnan (Chemistry)
    { userId: CHEMUser!._id!, name: 'Soap & Candle Formulation', cat: 'Arts and Crafts', lvl: 'ADVANCED', exp: 3, desc: 'Creating cold-process customized herbal skin-safe soaps and aroma soy candles.', tools: ['Curing Racks', 'Mold Slicers'], isPri: true },
    { userId: CHEMUser!._id!, name: 'Wellness Blogging', cat: 'Content Writing', lvl: 'INTERMEDIATE', exp: 2, desc: 'Writing organic reviews, wellness rituals, and chemical safety formulas for personal care products.', tools: ['WordPress', 'SEO Tools'], isPri: false }
  ];

  for (const sk of skillsData) {
    if (!sk.userId) continue;
    await Skills.create({
      studentId: sk.userId,
      skillName: sk.name,
      normalizedSkillName: sk.name.toLowerCase().trim(),
      category: sk.cat,
      skillLevel: sk.lvl as any,
      yearsOfExperience: sk.exp,
      description: sk.desc,
      tools: sk.tools,
      isPrimary: sk.isPri
    });
  }

  console.log(`✔ Seeded ${skillsData.length} student skill listings.`);

  // 5. Create Government Schemes (Seed at least 8 real/realistic schemes for women empowerment)
  const schemesData = [
    {
      title: 'Moovalur Ramamirtham Ammaiyar Pudhumai Penn Scheme',
      shortDescription: 'Provides monthly financial assistance of Rs 1,000 for government school girl students pursuing higher education.',
      fullDescription: 'The Pudhumai Penn scheme by the Govt of Tamil Nadu aims to encourage girls to pursue college degrees. It credits Rs 1,000 monthly directly into the bank accounts of girls who studied from class 6th to 12th in government schools.',
      provider: 'Social Welfare and Women Empowerment Department, Tamil Nadu',
      category: 'Scholarship' as const,
      eligibility: 'Must be a girl student. Must have studied in Government Schools of Tamil Nadu from 6th to 12th standard. Pursuing undergraduate degree or diploma.',
      benefits: 'Rs 1,000 per month paid directly until course completion.',
      requiredDocuments: ['Government School Transfer Certificate', 'Aadhaar Card', 'College Admission Receipt', 'Bank Passbook Front Page'],
      applicationProcess: "Apply online through the Penkalvi web portal or coordinate with the Women's Empowerment Cell administrative desk.",
      officialUrl: 'https://penkalvi.tn.gov.in',
      startDate: `${currentYear}-06-01`,
      endDate: `${currentYear + 1}-05-31`,
      contactInformation: "Toll-free student helpline: 14417, or contact Prof. Meera Nair (Women's Empowerment Cell Coordinator).",
      isFeatured: true
    },
    {
      title: 'Tamil Nadu Naan Mudhalvan Skill Development Scheme',
      shortDescription: 'Free high-tech skill training and certification courses in AI, coding, and design to increase college girls employability.',
      fullDescription: 'Naan Mudhalvan is a state-wide skill program initiated by the Hon’ble Chief Minister of Tamil Nadu. It provides industry-grade certifications in frontend programming, IoT, logistics, and data sciences to equip young college women for corporate recruitments.',
      provider: 'Tamil Nadu Skill Development Corporation (TNSDC)',
      category: 'Skill Development' as const,
      eligibility: 'Currently enrolled undergraduate or postgraduate college students in registered Tamil Nadu universities.',
      benefits: 'Free access to industry-curated coding platforms, Microsoft certifications, and direct placement drives.',
      requiredDocuments: ['College Identity Card', 'Aadhaar Card', 'Mark Sheets (Class 10th & 12th)'],
      applicationProcess: 'Register on the Naan Mudhalvan portal using college credentials and choose your desired tech track.',
      officialUrl: 'https://www.naanmudhalvan.tn.gov.in',
      startDate: `${currentYear}-07-01`,
      endDate: `${currentYear + 1}-03-31`,
      contactInformation: 'Naan Mudhalvan helpline: 044-22500100',
      isFeatured: true
    },
    {
      title: 'Mahila Co-operative Startup Funding Initiative',
      shortDescription: 'Collateral-free low interest commercial micro-loans of up to Rs 5 Lakhs for women student entrepreneurs.',
      fullDescription: 'A custom national funding program designed specifically to convert young women student projects into real micro-ventures. This provides small business loans with zero collateral requirement and highly subsidized interest rates.',
      provider: 'National Cooperative Development Corporation',
      category: 'Entrepreneurship' as const,
      eligibility: 'Women college students or recent alumni (within 3 years of passing) aged 18 to 28. Business plan must be verified by college incubation desk.',
      benefits: 'Low interest rate (4% per annum). Collateral-free loan up to Rs 5,000,000. 12 months repayment holiday.',
      requiredDocuments: ['Business Pitch Deck', 'College Bonafide Certificate', 'Project Report Co-Signed by Faculty', 'PAN Card & Aadhaar'],
      applicationProcess: "Submit your formal business idea and proposal via the Women's Empowerment Cell and incubation desk to be forwarded to partner banks.",
      officialUrl: 'https://www.ncdc.in',
      startDate: `${currentYear}-04-01`,
      endDate: `${currentYear + 1}-03-31`,
      contactInformation: 'Startup empowerment wing: startup-women@ncdc.in',
      isFeatured: true
    },
    {
      title: 'Pragati Scholarship Scheme for Girl Students',
      shortDescription: 'Provides Rs 50,000 per annum to girls pursuing professional degree and diploma education.',
      fullDescription: 'Pragati is a scheme implemented by AICTE to provide financial support to girl students for technical and professional education. It aims to empower girls and promote technical education among them.',
      provider: 'All India Council for Technical Education (AICTE)',
      category: 'Education' as const,
      eligibility: 'Maximum two girl children per family. Family income must be less than Rs 8 Lakh per annum. Admitted to 1st year degree/diploma program of AICTE approved colleges.',
      benefits: 'Rs 50,000 per annum towards college tuition, computer, and book purchases.',
      requiredDocuments: ['Annual Family Income Certificate', 'College Fee Receipt', 'AICTE Admission Letter', 'Aadhaar Card'],
      applicationProcess: 'Apply online through the National Scholarship Portal (NSP) and submit verifying files to the college administration.',
      officialUrl: 'https://scholarships.gov.in',
      startDate: `${currentYear}-09-01`,
      endDate: `${currentYear}-12-31`, // Closed/Expired if current month is past December
      contactInformation: 'AICTE student support help desk: pragati@aicte-india.org',
      isFeatured: false
    },
    {
      title: 'Prime Minister Employment Generation Programme (PMEGP) for Women',
      shortDescription: 'Credit-linked subsidy program providing up to 35% margin money for launching manufacturing or service startups.',
      fullDescription: 'A major central credit scheme aimed at creating micro-enterprises. Under PMEGP, women entrepreneurs in rural and urban areas receive highly subsidized loans with government margins to launch small production mills or tailoring units.',
      provider: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
      category: 'Startup Support' as const,
      eligibility: 'Any individual female above 18 years of age. Minimum standard 8th pass for manufacturing projects costing above Rs 10 Lakhs.',
      benefits: 'Up to 35% subsidy on project costs. Loan up to Rs 50 Lakhs for manufacturing, and Rs 20 Lakhs for service business.',
      requiredDocuments: ['Detailed Project Report (DPR)', 'Aadhaar Card', 'Educational Certificate', 'Community Certificate'],
      applicationProcess: 'Apply online via the KVIC PMEGP portal, listing our college incubation desk as reference center.',
      officialUrl: 'https://www.kviconline.gov.in/pmegpeportal',
      startDate: `${currentYear}-04-01`,
      endDate: `${currentYear + 1}-03-31`,
      isFeatured: false
    },
    {
      title: 'Tamil Nadu Rural Women Entrepreneurship Development Scheme',
      shortDescription: 'Micro-grants and marketing training camps to help college girls launch rural cottage businesses.',
      fullDescription: 'This state initiative focuses on training college girls from rural regions in handmade wellness goods, tailoring, organic beauty lotions, and agro-foods, coupled with setting up college campus sales booths.',
      provider: 'Social Welfare Board of Tamil Nadu',
      category: 'Rural Women' as const,
      eligibility: 'College girls hailing from semi-urban or village panchayats in Tamil Nadu.',
      benefits: 'Free 2-week entrepreneurship workshop on campus, Rs 15,000 initial micro-grant for buying production raw materials.',
      requiredDocuments: ['Village Residence Certificate', 'College Bonafide', 'Community Certificate'],
      applicationProcess: 'Register on campus with the Singa Pen Club Student Board during the startup week.',
      officialUrl: 'https://www.tn.gov.in/dept/socialwelfare',
      startDate: `${currentYear}-10-01`,
      endDate: `${currentYear + 1}-02-28`,
      isFeatured: false
    },
    {
      title: 'AICTE Saksham Scholarship for Specially Abled Girls',
      shortDescription: 'Provides Rs 50,000 per annum to physically challenged girl students pursuing professional degrees.',
      fullDescription: 'A specialized AICTE scheme designed to support specially-abled girls in acquiring technical skills. It reduces financial pressure on families and ensures equal access to professional growth.',
      provider: 'AICTE, Government of India',
      category: 'Education' as const,
      eligibility: 'Girl student with disability level greater than 40%. Family income below Rs 8 Lakh per year. Currently studying in AICTE degree/diploma.',
      benefits: 'Rs 50,000 per annum credited as direct benefit transfer.',
      requiredDocuments: ['Disability Certificate', 'Income Certificate', 'College Enrolment Receipt', 'Bank Passbook'],
      applicationProcess: 'Register and submit on the National Scholarship Portal under the AICTE Saksham section.',
      officialUrl: 'https://scholarships.gov.in',
      startDate: `${currentYear}-08-15`,
      endDate: `${currentYear + 1}-01-15`,
      isFeatured: false
    },
    {
      title: 'Aditya Birla Scholarship for Academic Excellence',
      shortDescription: 'Private merit scholarship covering full tuition fees for outstanding girl students in management and tech.',
      fullDescription: 'The Aditya Birla Group Scholarship program fosters future leadership. It rewards top academic achievers across premier universities, completely sponsoring their tuition, exam, and hostel fees.',
      provider: 'Aditya Birla Group Foundation',
      category: 'Other' as const,
      eligibility: 'Girl student in top 15% of university rankings in first semester of tech or management course.',
      benefits: '100% tuition and hostel fee reimbursement. Annual mentorship workshops under corporate heads.',
      requiredDocuments: ['First Semester College CGPA Sheet', 'HSC Mark Sheet', 'Family Income Tax Returns'],
      applicationProcess: 'Eligible girls are nominated directly by the college dean to the Aditya Birla Board.',
      officialUrl: 'https://www.adityabirlascholars.net',
      startDate: `${currentYear}-09-01`,
      endDate: `${currentYear}-10-31`, // Expired or active based on date
      isFeatured: false
    }
  ];

  for (const sc of schemesData) {
    const slug = sc.title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await GovernmentSchemes.create({
      ...sc,
      slug,
      createdBy: adminUser._id!
    });
  }

  console.log(`✔ Seeded ${schemesData.length} government schemes.`);

  // 6. Create Site Content (Homepage details, About Cell, Vision, Mission)
  await SiteContents.create({
    sectionKey: 'home',
    title: 'Welcome to Singa Pen Portal',
    content: 'Empowering young college women through core leadership, modern tech skill development, financial scheme awareness, and entrepreneurial incubation.',
    metadata: {
      heroTitle: 'Rise, Lead, and Inspire',
      heroSubtitle: "Welcome to the Women's Empowerment Cell of Sankara College of Science and Commerce and Singa Pen Club Portal. A dedicated platform bridging leadership, skill search, and government support for every student.",
      empowermentQuote: '“Every girl is a born lioness (Singa Pen). All she needs is a supportive ecosystem, real-world skills, and the confidence to conquer her dreams.”',
      contactEmail: 'womenscell@college.edu',
      contactPhone: '044-22334455'
    },
    updatedBy: adminUser._id!
  });

  await SiteContents.create({
    sectionKey: 'about',
    title: "Women's Empowerment Cell & Singa Pen Club",
    content: "The Women's Empowerment Cell of Sankara College of Science and Commerce has been a pillar of safety, empowerment, and leadership since its inception. In 2024, the \"Singa Pen\" (Lioness) club was established to serve as the student-led action wing of the cell.",
    metadata: {
      vision: 'To build a secure, progressive, and equitable campus ecosystem where young women emerge as self-reliant leaders, tech innovators, and successful entrepreneurs.',
      mission: 'To organize high-impact training workshops, raise direct awareness about government scholarships/subsidies, mentor micro-business plans, and display student talent to the academic community.',
      objectives: [
        'Organize hands-on skill workshops (coding, tailoring, arts, wellness).',
        'Directly facilitate student applications for state and central women schemes.',
        'Act as an incubator for female-led business proposals on campus.',
        'Maintain a searchable skills database for college collaborations.'
      ]
    },
    updatedBy: adminUser._id!
  });

  console.log('✔ Seeded college site configuration content.');

  // 7. Seed Gallery & Achievements with local placeholder files to prevent broken images
  console.log('--- Seeding Gallery and Achievements ---');

  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Helper to write safe local 1x1 png image
  const writePlaceholderPng = (filename: string) => {
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Png, 'base64'));
    return `/uploads/${filename}`;
  };

  // Helper to write safe local pdf file
  const writePlaceholderPdf = (filename: string) => {
    const dummyPdfContent = '%PDF-1.4 %âãÏÓ 1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj 2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj 3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<<>>>> endobj xref 0 4 0000000000 65535 f 0000000015 00000 n 0000000060 00000 n 0000000111 00000 n trailer <</Size 4/Root 1 0 R>> startxref 201 %%EOF';
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, dummyPdfContent);
    return `/uploads/${filename}`;
  };

  // Create Album records
  const albumsData = [
    {
      title: 'Pudhumai Penn Induction & Celebration 2025',
      shortDescription: 'Celebrating the induction of new scholarship recipients under the Pudhumai Penn program, empowering them with academic stipends.',
      fullDescription: 'The Pudhumai Penn induction event by the Govt of Tamil Nadu aims to encourage girls to pursue college degrees. It credits Rs 1,000 monthly directly into the bank accounts of girls who studied from class 6th to 12th in government schools.',
      category: 'CELEBRATION' as const,
      eventDate: '2025-10-15',
      venue: 'Main College Auditorium',
      organizedBy: "Women's Empowerment Cell Coordinator & Singa Pen Student Board",
      isFeatured: true,
      isPublished: true,
      coverFilename: 'demo_album1_cover.png',
      images: [
        { filename: 'demo_album1_1.png', caption: 'Recipients of Pudhumai Penn Scholarship with Chief Guest.' },
        { filename: 'demo_album1_2.png', caption: 'Student representative Priyanka Sen delivering the thank you note.' },
        { filename: 'demo_album1_3.png', caption: 'Distribution of free certificates and student passbooks.' }
      ]
    },
    {
      title: 'Naan Mudhalvan Advanced Python & AI Bootcamp',
      shortDescription: 'Hands-on coding bootcamp covering data processing, web scraping, and machine learning models for college girl developers.',
      fullDescription: 'Naan Mudhalvan is a state-wide skill program initiated by the Hon’ble Chief Minister of Tamil Nadu. It provides industry-grade certifications in frontend programming, IoT, logistics, and data sciences to equip young college women for corporate recruitments.',
      category: 'WORKSHOP' as const,
      eventDate: '2025-11-20',
      venue: 'Central Computer Science Lab',
      organizedBy: "Tamil Nadu Skill Development Corporation in association with Women's Empowerment Cell",
      isFeatured: true,
      isPublished: true,
      coverFilename: 'demo_album2_cover.png',
      images: [
        { filename: 'demo_album2_1.png', caption: 'Students coding complex neural networks in Python.' },
        { filename: 'demo_album2_2.png', caption: 'Prof. Meera Nair inspecting students\' code submissions.' },
        { filename: 'demo_album2_3.png', caption: 'Group photo of all 45 certified girl programmers.' }
      ]
    },
    {
      title: 'Singa Pen Entrepreneurship Bazaar & Food Stall',
      shortDescription: 'An on-campus exhibition showcasing handmade items, bakery confectioneries, custom tailoring, and organic cosmetics made by student micro-ventures.',
      fullDescription: 'This event provides a safe ecosystem for student-led businesses to run active commerce stalls, receive feedback from faculty, and gain exposure to retail and pricing models.',
      category: 'SINGA_PEN_ACTIVITY' as const,
      eventDate: '2026-01-22',
      venue: 'College Quadrangle Lawn',
      organizedBy: 'Singa Pen Club Entrepreneurship Wing',
      isFeatured: true,
      isPublished: true,
      coverFilename: 'demo_album3_cover.png',
      images: [
        { filename: 'demo_album3_1.png', caption: 'Custom bridal wear boutique stall managed by Keerthana Selvaraj.' },
        { filename: 'demo_album3_2.png', caption: 'Deepi Cookies & healthy confectionery stall with long student queues.' },
        { filename: 'demo_album3_3.png', caption: 'Organic cold-process herbal soap stall by Gayathri Krishnan.' }
      ]
    },
    {
      title: 'Annual Women Safety & Self-Defense Workshop',
      shortDescription: 'A comprehensive martial arts and safety awareness session for first-year undergraduate students.',
      fullDescription: 'Practical session involving tactical safety release maneuvers, digital cyber safety guidelines, and emergency helpline configurations led by physical directors.',
      category: 'AWARENESS_PROGRAM' as const,
      eventDate: '2026-02-10',
      venue: 'College Gymnasium Hall',
      organizedBy: 'Singa Pen Volunteers',
      isFeatured: false,
      isPublished: true,
      coverFilename: 'demo_album4_cover.png',
      images: [
        { filename: 'demo_album4_1.png', caption: 'Demonstration of core blocking techniques by physical directors.' },
        { filename: 'demo_album4_2.png', caption: 'Students practicing tactical lock releases in pairs.' },
        { filename: 'demo_album4_3.png', caption: 'Interactive QA session on digital safety and cyber safety apps.' }
      ]
    }
  ];

  for (const albumData of albumsData) {
    const slug = albumData.title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const coverUrl = writePlaceholderPng(albumData.coverFilename);

    const album = await GalleryAlbums.create({
      title: albumData.title,
      slug,
      shortDescription: albumData.shortDescription,
      fullDescription: albumData.fullDescription,
      category: albumData.category,
      coverImage: coverUrl,
      eventDate: albumData.eventDate,
      venue: albumData.venue,
      organizedBy: albumData.organizedBy,
      isFeatured: albumData.isFeatured,
      isPublished: albumData.isPublished,
      createdBy: adminUser._id!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    let displayOrder = 1;
    for (const imgInfo of albumData.images) {
      const imgUrl = writePlaceholderPng(imgInfo.filename);
      await GalleryImages.create({
        albumId: album._id!,
        imageUrl: imgUrl,
        caption: imgInfo.caption,
        displayOrder,
        isFeatured: displayOrder === 1,
        uploadedBy: adminUser._id!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      displayOrder++;
    }
  }

  console.log(`✔ Seeded ${albumsData.length} gallery albums and ${albumsData.length * 3} associated images.`);

  // Create Achievement records mapping to actual student users
  const achievementsData = [
    {
      title: 'Winner of State Web Designing Hackathon 2025',
      description: 'Secured first place among 60 collegiate teams in the Tamil Nadu State Empowerment Hackathon for creating a secure women’s helpline web interface with automated SOS alerts.',
      achievementType: 'COMPETITION' as const,
      studentEmail: 'priyanka.sen@college.edu',
      eventName: 'State Web-Tech Hackathon 2025',
      achievementDate: '2025-09-10',
      level: 'STATE' as const,
      position: '1st Place (Gold Medalist)',
      imageFilename: 'demo_ach_hackathon.png',
      certFilename: 'demo_cert_hackathon.pdf',
      isFeatured: true,
      isPublic: true
    },
    {
      title: 'National B-Plan Presentation Contest Winner',
      description: 'Presented an innovative credit-linked business advisory plan for rural women micro-entrepreneur collectives, bagging the top cash prize of Rs 1 Lakh.',
      achievementType: 'ENTREPRENEURSHIP' as const,
      studentEmail: 'swetha.ram@college.edu',
      eventName: 'Aspiration National Business Summit',
      achievementDate: '2025-11-05',
      level: 'NATIONAL' as const,
      position: 'Grand Champion (Rs 1,00,000 Cash Prize)',
      imageFilename: 'demo_ach_bplan.png',
      certFilename: 'demo_cert_bplan.pdf',
      isFeatured: true,
      isPublic: true
    },
    {
      title: 'Published Cyber Safety Research Paper',
      description: 'Authored a peer-reviewed research paper titled "Implementing Zero-Trust End-to-End Cryptography for Distress Helpline Databases" published in IEEE Student Section Journal.',
      achievementType: 'ACADEMIC' as const,
      studentEmail: 'anjali.sharma@college.edu',
      eventName: 'IEEE International Cyber-Safety Conference',
      achievementDate: '2025-12-18',
      level: 'INTERNATIONAL' as const,
      position: 'Best Student Paper Award',
      imageFilename: 'demo_ach_ieee.png',
      certFilename: 'demo_cert_ieee.pdf',
      isFeatured: true,
      isPublic: true
    },
    {
      title: 'Designed Smart IoT Women Safety Bracelet Prototype',
      description: 'Developed a wearable micro-controller bracelet that features instant panic buttons, automated Bluetooth GPS triggers, and an audible alarm speaker.',
      achievementType: 'SKILL' as const,
      studentEmail: 'deepika.raman@college.edu',
      eventName: 'Annual Innovative Hardware & Robotics Expo',
      achievementDate: '2025-10-22',
      level: 'COLLEGE' as const,
      position: 'Best Innovative Design Award',
      imageFilename: 'demo_ach_iot.png',
      certFilename: 'demo_cert_iot.pdf',
      isFeatured: false,
      isPublic: true
    },
    {
      title: 'District Athletics 400m Champion',
      description: 'Represented the college and won the gold medal in the 400m track and field competition at the District Inter-Collegiate Sports Meet 2025.',
      achievementType: 'SPORTS' as const,
      studentEmail: 'pooja.krish@college.edu',
      eventName: 'District Annual Athletics Championship',
      achievementDate: '2025-08-14',
      level: 'DISTRICT' as const,
      position: 'Gold Medalist (400m Dash)',
      imageFilename: 'demo_ach_sports.png',
      certFilename: 'demo_cert_sports.pdf',
      isFeatured: false,
      isPublic: true
    },
    {
      title: 'South-Zone Inter-Collegiate Elocution Champion',
      description: 'Exemplary oratorical delivery on the socio-economic returns of financing higher education for rural girl students in Southern India.',
      achievementType: 'CULTURAL' as const,
      studentEmail: 'rithika.mo@college.edu',
      eventName: 'South-Zone Youth Empowerment Elocution Meet',
      achievementDate: '2025-11-12',
      level: 'STATE' as const,
      position: '1st Place',
      imageFilename: 'demo_ach_elocution.png',
      certFilename: 'demo_cert_elocution.pdf',
      isFeatured: false,
      isPublic: true
    },
    {
      title: 'Outstanding Singa Pen Leader Award 2024',
      description: 'Recognized for coordinating 15+ government scheme awareness campaigns and driving active student enrollment into tech skill certification tracks.',
      achievementType: 'LEADERSHIP' as const,
      studentEmail: 'nisha.sun@college.edu',
      eventName: 'Annual Club Recognition & Leadership Honors',
      achievementDate: '2024-05-10',
      level: 'COLLEGE' as const,
      position: 'Outstanding Volunteer Shield',
      imageFilename: 'demo_ach_leadership.png',
      certFilename: 'demo_cert_leadership.pdf',
      isFeatured: false,
      isPublic: true
    },
    {
      title: 'Excellence in Cottage Soap & Candle Enterprise',
      description: 'Pioneered a micro-enterprise model on campus formulating safe, vegan, cold-processed herbal cosmetics and distributing them during college events.',
      achievementType: 'ENTREPRENEURSHIP' as const,
      studentEmail: 'gayathri.k@college.edu',
      eventName: 'Vocal for Local Campus Startup Day',
      achievementDate: '2026-02-05',
      level: 'COLLEGE' as const,
      position: 'Startup Certificate of Merit',
      imageFilename: 'demo_ach_soap.png',
      certFilename: 'demo_cert_soap.pdf',
      isFeatured: false,
      isPublic: true
    }
  ];

  for (const achInfo of achievementsData) {
    const studentUser = await Users.findOne({ email: achInfo.studentEmail });
    const studentId = studentUser ? studentUser._id : undefined;

    let department = 'N/A';
    if (studentId) {
      const profile = await StudentProfiles.findOne({ userId: studentId });
      if (profile) department = profile.department;
    }

    const imgUrl = writePlaceholderPng(achInfo.imageFilename);
    const certUrl = writePlaceholderPdf(achInfo.certFilename);

    await Achievements.create({
      title: achInfo.title,
      description: achInfo.description,
      achievementType: achInfo.achievementType,
      studentId,
      memberName: studentUser ? studentUser.name : 'Unknown Achiever',
      department,
      eventName: achInfo.eventName,
      achievementDate: achInfo.achievementDate,
      level: achInfo.level,
      position: achInfo.position,
      image: imgUrl,
      certificate: certUrl,
      isFeatured: achInfo.isFeatured,
      isPublic: achInfo.isPublic,
      createdBy: adminUser._id!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  console.log(`✔ Seeded ${achievementsData.length} student achievement records.`);

  const seededStudents = await prisma.studentProfile.findMany({
    include: { user: true, skills: true },
    take: 12,
    orderBy: { createdAt: 'asc' },
  });
  const firstStudent = seededStudents[0];
  const secondStudent = seededStudents[1] || firstStudent;
  const thirdStudent = seededStudents[2] || firstStudent;
  const schemes = await prisma.governmentScheme.findMany({ take: 3, orderBy: { createdAt: 'asc' } });

  const skillRequests = await Promise.all([
    prisma.skillRequest.create({
      data: {
        title: 'Canva designer required for Women’s Day poster',
        description: 'Design a polished poster set for the Women’s Day awareness campaign.',
        requiredSkills: ['Canva', 'Graphic Design'],
        preferredSkillLevel: 'INTERMEDIATE',
        department: 'Computer Science',
        requestType: 'DESIGN',
        eventOrProjectName: 'Women’s Day Campaign',
        requiredStudentCount: 2,
        deadline: new Date('2026-03-01T18:00:00.000Z'),
        contactPerson: 'Prof. Meera Nair',
        contactInformation: 'women-cell@college.edu',
        status: 'OPEN',
        isPublished: true,
        createdById: adminUser._id!,
      },
    }),
    prisma.skillRequest.create({
      data: {
        title: 'Event host required for orientation programme',
        description: "Anchor the first-year orientation and introduce Women's Empowerment Cell resources.",
        requiredSkills: ['Public Speaking', 'Anchoring'],
        preferredSkillLevel: 'ADVANCED',
        requestType: 'EVENT',
        eventOrProjectName: 'First-Year Orientation',
        requiredStudentCount: 1,
        deadline: new Date('2026-08-05T18:00:00.000Z'),
        contactPerson: 'Dr. Aruna Sundar',
        contactInformation: 'admin office extension 204',
        status: 'OPEN',
        isPublished: true,
        createdById: adminUser._id!,
      },
    }),
    prisma.skillRequest.create({
      data: {
        title: 'Video editor required for an event recap',
        description: 'Prepare a two-minute recap reel for completed Singa Pen activities.',
        requiredSkills: ['Video Editing'],
        preferredSkillLevel: 'BEGINNER',
        requestType: 'MEDIA',
        eventOrProjectName: 'Monthly Recap',
        requiredStudentCount: 1,
        status: 'DRAFT',
        isPublished: false,
        createdById: adminUser._id!,
      },
    }),
  ]);

  for (const request of skillRequests.filter(req => req.isPublished)) {
    for (const student of seededStudents.slice(0, 3)) {
      const matchedSkills = student.skills.slice(0, 2).map(skill => skill.skillName);
      await prisma.skillRequestRecipient.upsert({
        where: { skillRequestId_studentId: { skillRequestId: request.id, studentId: student.id } },
        update: {},
        create: {
          skillRequestId: request.id,
          studentId: student.id,
          matchedSkills,
          matchReasons: ['Seeded sample recipient from existing skill profile'],
          matchScore: 50 + matchedSkills.length,
        },
      });
      await prisma.notification.upsert({
        where: { id: `seed-notif-${request.id}-${student.userId}` },
        update: {},
        create: {
          id: `seed-notif-${request.id}-${student.userId}`,
          userId: student.userId,
          type: 'SKILL_REQUEST',
          title: request.title,
          message: `You match this seeded skill opportunity for ${request.requiredSkills.join(', ')}.`,
          link: '/student/skill-requests',
        },
      });
    }
  }

  const workshopRows = await Promise.all([
    prisma.workshop.create({
      data: {
        title: 'AI Tools for Student Entrepreneurs',
        slug: 'ai-tools-student-entrepreneurs',
        shortDescription: 'Hands-on session on AI tools for posters, market research, and pitch decks.',
        fullDescription: 'Students learn practical AI workflows for planning women-led campus ventures and preparing launch collateral.',
        category: 'ENTREPRENEURSHIP',
        startDateTime: new Date('2026-08-20T10:00:00.000Z'),
        endDateTime: new Date('2026-08-20T13:00:00.000Z'),
        venue: 'Seminar Hall A',
        organizer: 'Singa Pen Club',
        targetAudience: 'All women students',
        registrationUrl: 'https://example.com/register-ai-workshop',
        maximumParticipants: 80,
        isFeatured: true,
        isPublished: true,
        createdById: adminUser._id!,
      },
    }),
    prisma.workshop.create({
      data: {
        title: 'Self Defence Awareness Workshop',
        slug: 'self-defence-awareness-workshop',
        shortDescription: 'Safety awareness and self-defence basics for first-year students.',
        fullDescription: 'A campus safety workshop covering situational awareness, reporting channels, and practical defence demonstrations.',
        category: 'SAFETY',
        startDateTime: new Date('2026-09-10T09:30:00.000Z'),
        endDateTime: new Date('2026-09-10T12:30:00.000Z'),
        venue: 'Indoor Auditorium',
        organizer: "Women's Empowerment Cell",
        isPublished: true,
        createdById: adminUser._id!,
      },
    }),
    prisma.workshop.create({
      data: {
        title: 'Leadership Circle 2025',
        slug: 'leadership-circle-2025',
        shortDescription: 'Completed leadership mentoring circle for Singa Pen volunteers.',
        fullDescription: 'A completed leadership workshop on communication, delegation, and student community outreach.',
        category: 'LEADERSHIP',
        startDateTime: new Date('2025-11-12T10:00:00.000Z'),
        endDateTime: new Date('2025-11-12T15:00:00.000Z'),
        venue: 'Conference Room',
        organizer: "Women's Empowerment Cell",
        isPublished: true,
        isCompleted: true,
        createdById: adminUser._id!,
      },
    }),
    prisma.workshop.create({
      data: {
        title: 'Cancelled Health Camp Orientation',
        slug: 'cancelled-health-camp-orientation',
        shortDescription: 'Health camp orientation cancelled due to venue maintenance.',
        fullDescription: 'This workshop remains visible to demonstrate cancelled calendar status handling.',
        category: 'HEALTH',
        startDateTime: new Date('2026-10-05T10:00:00.000Z'),
        endDateTime: new Date('2026-10-05T12:00:00.000Z'),
        venue: 'Medical Room',
        organizer: 'Health Club',
        isPublished: true,
        isCancelled: true,
        createdById: adminUser._id!,
      },
    }),
  ]);

  if (firstStudent) {
    await prisma.workshopParticipation.createMany({
      data: [
        { workshopId: workshopRows[0].id, studentId: firstStudent.id, status: 'REGISTERED' },
        { workshopId: workshopRows[2].id, studentId: firstStudent.id, status: 'ATTENDED' },
        { workshopId: workshopRows[0].id, studentId: secondStudent.id, status: 'INTERESTED' },
        { workshopId: workshopRows[2].id, studentId: thirdStudent.id, status: 'ATTENDED' },
      ],
      skipDuplicates: true,
    });
    await prisma.notification.createMany({
      data: workshopRows.slice(0, 2).map(workshop => ({
        id: `seed-workshop-notif-${workshop.id}-${firstStudent.userId}`,
        userId: firstStudent.userId,
        type: 'WORKSHOP' as const,
        title: workshop.title,
        message: `Workshop at ${workshop.venue} is open for interest.`,
        link: '/student/workshops',
      })),
      skipDuplicates: true,
    });
  }

  if (firstStudent && schemes.length > 0) {
    await prisma.savedScheme.createMany({
      data: schemes.map(scheme => ({ studentId: firstStudent.id, schemeId: scheme.id })),
      skipDuplicates: true,
    });
  }

  console.log(`✔ Seeded ${skillRequests.length} skill requests, ${workshopRows.length} workshops, participation, saved schemes, and notifications.`);
  console.log('');
  console.log('Seed login identifiers created. Use the configured SEED_DEFAULT_PASSWORD for local seed accounts.');
  console.log('--- Database Seeding Completed Successfully! ---');
}
