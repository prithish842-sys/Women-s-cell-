import { Router } from 'express';
import { StudentProfiles, Users, GovernmentSchemes, SiteContents, Skills, GalleryAlbums, GalleryImages, Achievements, FacultyProfiles } from '../models/index.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails } from '../utils/academic.js';
import { normalizeWomensCellName, womensCellMemberByName } from '../data/womensCellMembers.js';
import { enrichSchemeDetails } from '../utils/scheme.js';
import { prisma } from '../config/prisma.js';
import { serializeWorkshop } from '../utils/workshops.js';

const router = Router();


const REQUESTED_PUBLIC_MEMBER_IDS = {
  tharani: 'directory-tharani-p',
  sathyPriya: 'directory-sathypriya-s',
} as const;

const normalizeDirectoryName = (value = '') =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const isAnamikaDirectoryMember = (name = '') => {
  const normalized = normalizeDirectoryName(name);
  return normalized === 'sanamika' || normalized === 'anamikaa' || normalized === 'anamika';
};

const isTharaniDirectoryMember = (name = '') =>
  normalizeDirectoryName(name).includes('tharani');

const isSathyPriyaDirectoryMember = (name = '') => {
  const normalized = normalizeDirectoryName(name);
  return normalized.includes('sathypriya') || normalized.includes('sathyapriya');
};

const requestedDirectoryMembers = {
  tharani: {
    _id: REQUESTED_PUBLIC_MEMBER_IDS.tharani,
    name: 'Tharani.P',
    memberType: 'STUDENT',
    department: 'Dept. of Commerce (CA)',
    course: 'Commerce (CA)',
    joiningAcademicYear: '',
    currentStudyYear: null,
    academicStatus: 'ACTIVE',
    clubRole: 'Vice Chairman',
    designation: '',
    clubJoinedAt: null,
    achievements: [],
    bio: 'Tharani.P serves the Singa Pen Club as Vice Chairman in the Dept. of Commerce (CA).',
    profileImage: '',
    skills: [],
    entrepreneurship: { interestedInEntrepreneurship: false },
  },
  sathyPriya: {
    _id: REQUESTED_PUBLIC_MEMBER_IDS.sathyPriya,
    name: 'SathyPriya.S',
    memberType: 'FACULTY',
    department: 'Bachelor of Computer Science',
    course: 'Bachelor of Computer Science',
    joiningAcademicYear: '',
    currentStudyYear: null,
    academicStatus: 'FACULTY',
    clubRole: 'Faculty',
    designation: 'Faculty',
    clubJoinedAt: null,
    achievements: [],
    bio: "SathyPriya.S serves the Women's Empowerment Cell as Faculty in Bachelor of Computer Science.",
    profileImage: '',
    skills: [],
    entrepreneurship: { interestedInEntrepreneurship: false },
  },
} as const;

const applyRequestedDirectoryMembers = (members: any[]) => {
  const source = Array.isArray(members) ? members : [];
  const anamikaIndex = source.findIndex(member => isAnamikaDirectoryMember(member?.name || ''));

  const cleaned = source.filter(member => {
    const name = member?.name || '';
    return !isAnamikaDirectoryMember(name)
      && !isTharaniDirectoryMember(name)
      && !isSathyPriyaDirectoryMember(name);
  });

  const tharaniInsertIndex = anamikaIndex >= 0
    ? Math.min(anamikaIndex, cleaned.length)
    : cleaned.length;

  cleaned.splice(tharaniInsertIndex, 0, { ...requestedDirectoryMembers.tharani });
  cleaned.push({ ...requestedDirectoryMembers.sathyPriya });

  return cleaned;
};

const getRequestedDirectoryMemberById = (id: string) => {
  if (id === REQUESTED_PUBLIC_MEMBER_IDS.tharani) {
    return { ...requestedDirectoryMembers.tharani };
  }
  if (id === REQUESTED_PUBLIC_MEMBER_IDS.sathyPriya) {
    return { ...requestedDirectoryMembers.sathyPriya };
  }
  return null;
};

// Get Public Site Content
router.get('/site-content', async (req, res, next) => {
  try {
    const sections = await SiteContents.find();
    const contentMap: Record<string, any> = {};
    sections.forEach(sec => {
      contentMap[sec.sectionKey] = {
        title: sec.title,
        content: sec.content,
        metadata: sec.metadata
      };
    });
    return res.json({
      success: true,
      data: contentMap
    });
  } catch (error) {
    next(error);
  }
});

// Get Public Homepage statistics
router.get('/statistics', async (req, res, next) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [
      totalStudents,
      alumniCount,
      singaPenMembers,
      activeSchemes,
      skillCount,
      departmentGroups,
    ] = await Promise.all([
      prisma.studentProfile.count({ where: { deletedAt: null } }),
      prisma.studentProfile.count({
        where: { deletedAt: null, expectedCompletionDate: { lt: todayStart } },
      }),
      prisma.studentProfile.count({ where: { deletedAt: null, isSingaPenMember: true } }),
      prisma.governmentScheme.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.skill.count(),
      prisma.studentProfile.groupBy({ by: ['department'], where: { deletedAt: null } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents: totalStudents - alumniCount,
        alumniCount,
        singaPenMembers,
        activeSchemes,
        totalSkills: skillCount,
        departmentCount: departmentGroups.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/in-charges', async (req, res, next) => {
  try {
    const profiles = await FacultyProfiles.find();
    const users = await Users.find({ role: 'FACULTY', isActive: true });
    const userMap = new Map(users.map(u => [u._id, u]));

    const inCharges = profiles
      .map(profile => {
        const user = userMap.get(profile.userId);
        if (!user) return null;
        return {
          _id: profile._id,
          name: user.name,
          department: profile.department,
          designation: profile.designation,
          email: user.email,
          responsibility: profile.designation?.toLowerCase().includes('coordinator')
            ? "Women's Empowerment Cell coordination, student mentoring, and programme review."
            : 'Faculty guidance, safe-campus support, and Singa Pen programme mentoring.',
          biography: `${user.name} supports student welfare, empowerment activities, and academic collaboration through the Women's Empowerment Cell.`,
          serviceYear: profile.createdAt ? new Date(profile.createdAt).getFullYear().toString() : undefined,
          achievements: []
        };
      })
      .filter(Boolean);

    return res.json({ success: true, data: inCharges });
  } catch (error) {
    next(error);
  }
});

// Get Public Singa Pen Members
router.get('/members', async (req, res, next) => {
  try {
    const search = (req.query.search as string || '').toLowerCase();
    const department = req.query.department as string;
    const course = req.query.course as string;
    const clubRole = req.query.clubRole as string;
    const academicStatus = req.query.academicStatus as string;
    const alumniOnly = req.query.alumniOnly === 'true';

    // Existing student Singa Pen records remain the primary live source.
    const members = await StudentProfiles.find({ isSingaPenMember: true });
    let enriched = members.map(enrichStudentAcademicDetails).filter(Boolean) as any[];

    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(user => [user._id, user.name]));

    enriched = enriched
      .map(member => {
        const name = userMap.get(member.userId) || 'Anonymous Member';
        const womensCellRecord = womensCellMemberByName.get(normalizeWomensCellName(name));

        return {
          ...member,
          name,
          memberType: 'STUDENT',
          ...(womensCellRecord ? {
            department: womensCellRecord.department,
            course: womensCellRecord.course || member.course,
            currentStudyYear: womensCellRecord.displayStudyYear,
            clubRole: womensCellRecord.role || member.clubRole,
            profileImage: womensCellRecord.profileImage,
          } : {}),
        };
      })
      .filter(member => womensCellMemberByName.has(normalizeWomensCellName(member.name)));

    // Existing faculty records remain unchanged.
    const facultyProfiles = await FacultyProfiles.find();
    const facultyUsers = await Users.find({ role: 'FACULTY' });
    const facultyUserMap = new Map(facultyUsers.map(user => [user._id, user.name]));

    const womensCellFaculty = facultyProfiles
      .map(profile => {
        const name = facultyUserMap.get(profile.userId) || '';
        const womensCellRecord = womensCellMemberByName.get(normalizeWomensCellName(name));
        if (!womensCellRecord || womensCellRecord.type !== 'FACULTY') return null;

        return {
          _id: profile._id,
          userId: profile.userId,
          name,
          memberType: 'FACULTY',
          department: womensCellRecord.department,
          designation: womensCellRecord.designation || profile.designation,
          course: womensCellRecord.designation || profile.designation,
          currentStudyYear: null,
          academicStatus: 'FACULTY',
          clubRole: womensCellRecord.role || '',
          clubJoinedAt: profile.createdAt,
          achievements: [],
          bio: `${name} serves the Women Empowerment Cell as ${womensCellRecord.role ? `${womensCellRecord.role} and ` : ''}${womensCellRecord.designation || profile.designation} in the Department of ${womensCellRecord.department}.`,
          profileImage: womensCellRecord.profileImage,
        };
      })
      .filter(Boolean) as any[];

    // Requested committee correction:
    // - remove Anamika from the public committee
    // - put Tharani.P in the same position as Vice Chairman
    // - add SathyPriya.S as Faculty at the end
    enriched = applyRequestedDirectoryMembers([...enriched, ...womensCellFaculty]);

    if (search) {
      enriched = enriched.filter(member => String(member.name || '').toLowerCase().includes(search));
    }

    if (department) {
      enriched = enriched.filter(member => String(member.department || '').toLowerCase() === department.toLowerCase());
    }

    if (course) {
      enriched = enriched.filter(member => String(member.course || '').toLowerCase() === course.toLowerCase());
    }

    if (clubRole) {
      enriched = enriched.filter(member => String(member.clubRole || '') === clubRole);
    }

    if (academicStatus) {
      enriched = enriched.filter(member => String(member.academicStatus || '') === academicStatus);
    }

    if (alumniOnly) {
      enriched = enriched.filter(member => member.academicStatus === 'PASSED_OUT');
    }

    const sanitizedMembers = enriched.map(member => ({
      _id: member._id,
      name: member.name,
      department: member.department,
      course: member.course,
      joiningAcademicYear: member.joiningAcademicYear,
      currentStudyYear: member.currentStudyYear,
      academicStatus: member.academicStatus,
      clubRole: member.clubRole,
      memberType: member.memberType || 'STUDENT',
      designation: member.designation || '',
      clubJoinedAt: member.clubJoinedAt,
      achievements: member.achievements || [],
      bio: member.bio || '',
      profileImage: member.profileImage || '',
    }));

    return res.json({
      success: true,
      data: sanitizedMembers,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/skills', async (req, res, next) => {
  try {
    const keyword = (req.query.keyword as string || req.query.search as string || '').trim();
    const department = req.query.department as string;
    const category = req.query.category as string;
    const skillLevel = req.query.skillLevel as string;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '12', 10), 1), 40);

    const where: any = {
      user: { is: { role: 'STUDENT', isActive: true } },
    };
    if (department && department !== 'ALL') where.department = { equals: department, mode: 'insensitive' };
    if (keyword) {
      where.OR = [
        { department: { contains: keyword, mode: 'insensitive' } },
        { course: { contains: keyword, mode: 'insensitive' } },
        { bio: { contains: keyword, mode: 'insensitive' } },
        { user: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { skillName: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { category: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { description: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { tools: { has: keyword } } } },
      ];
    }
    if (category && category !== 'ALL') {
      where.skills = { some: { category: { equals: category, mode: 'insensitive' } } };
    }
    if (skillLevel && skillLevel !== 'ALL') {
      where.skills = {
        some: {
          ...(where.skills?.some || {}),
          skillLevel,
        },
      };
    }

    const [total, profiles] = await Promise.all([
      prisma.studentProfile.count({ where }),
      prisma.studentProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          skills: { orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }] },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const results = profiles.map((profile) => ({
      _id: profile.id,
      name: profile.user.name,
      department: profile.department,
      course: profile.course,
      profileImage: profile.profileImage || '',
      bio: profile.bio || '',
      academicStatus: profile.academicStatus,
      currentStudyYear: profile.currentStudyYear,
      entrepreneurship: {
        interestedInEntrepreneurship: profile.interestedInEntrepreneurship,
        preferredIndustry: profile.preferredIndustry || '',
        futurePlan: profile.futurePlan || '',
      },
      skills: profile.skills.map(skill => ({
        _id: skill.id,
        skillName: skill.skillName,
        category: skill.category,
        skillLevel: skill.skillLevel,
        description: skill.description || '',
        tools: skill.tools || [],
        isPrimary: skill.isPrimary,
      })),
    }));

    return res.json({
      success: true,
      data: results,
      meta: { total, page, limit },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/skills/search', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const keyword = (req.query.keyword as string || req.query.search as string || '').trim();
    const department = req.query.department as string;
    const category = req.query.category as string;
    const skillLevel = req.query.skillLevel as string;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '12', 10), 1), 40);

    const where: any = {
      user: { is: { role: 'STUDENT', isActive: true } },
    };
    if (department && department !== 'ALL') where.department = { equals: department, mode: 'insensitive' };
    if (keyword) {
      where.OR = [
        { department: { contains: keyword, mode: 'insensitive' } },
        { course: { contains: keyword, mode: 'insensitive' } },
        { bio: { contains: keyword, mode: 'insensitive' } },
        { businessIdea: { contains: keyword, mode: 'insensitive' } },
        { futurePlan: { contains: keyword, mode: 'insensitive' } },
        { preferredIndustry: { contains: keyword, mode: 'insensitive' } },
        { user: { is: { name: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { skillName: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { category: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { normalizedSkillName: { contains: keyword.toLowerCase() } } } },
        { skills: { some: { description: { contains: keyword, mode: 'insensitive' } } } },
        { skills: { some: { tools: { has: keyword } } } },
      ];
    }
    if (category && category !== 'ALL') {
      where.skills = { some: { category: { equals: category, mode: 'insensitive' } } };
    }
    if (skillLevel && skillLevel !== 'ALL') {
      where.skills = {
        some: {
          ...(where.skills?.some || {}),
          skillLevel,
        },
      };
    }

    const [total, profiles] = await Promise.all([
      prisma.studentProfile.count({ where }),
      prisma.studentProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          skills: { orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }] },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const lower = keyword.toLowerCase();
    const results = profiles.map((profile) => {
      const enriched = enrichStudentAcademicDetails({
        ...profile,
        _id: profile.id,
        userId: profile.userId,
        expectedCompletionDate: profile.expectedCompletionDate?.toISOString(),
        createdAt: profile.createdAt?.toISOString(),
        updatedAt: profile.updatedAt?.toISOString(),
      } as any) as any;
      const skills = profile.skills.map(skill => ({
        _id: skill.id,
        skillName: skill.skillName,
        category: skill.category,
        skillLevel: skill.skillLevel,
        description: skill.description || '',
        tools: skill.tools || [],
        portfolioUrl: skill.portfolioUrl || '',
        certificateUrl: skill.certificateUrl || '',
        isPrimary: skill.isPrimary,
      }));
      const score = skills.reduce((sum, skill) => {
        const name = skill.skillName.toLowerCase();
        const toolHit = skill.tools.some(tool => tool.toLowerCase().includes(lower));
        if (!lower) return sum + (skill.isPrimary ? 6 : 2);
        if (name === lower) return sum + 100;
        if (skill.isPrimary && name.includes(lower)) return sum + 80;
        if (name.includes(lower)) return sum + 60;
        if (toolHit) return sum + 45;
        if (skill.category.toLowerCase().includes(lower)) return sum + 35;
        if (skill.description.toLowerCase().includes(lower)) return sum + 20;
        return sum;
      }, 0);

      return {
        _id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        department: profile.department,
        course: profile.course,
        profileImage: profile.profileImage || '',
        bio: profile.bio || '',
        currentStudyYear: enriched.currentStudyYear,
        academicStatus: enriched.academicStatus,
        isSingaPenMember: profile.isSingaPenMember,
        entrepreneurship: {
          interestedInEntrepreneurship: profile.interestedInEntrepreneurship,
          preferredIndustry: profile.preferredIndustry || '',
          futurePlan: profile.futurePlan || '',
        },
        skills,
        matchScore: score,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      data: results,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// Get Individual Public Member Profile
router.get('/members/:id', async (req, res, next) => {
  try {
    // Requested committee-only records do not need fabricated login credentials.
    // They are still served by the backend so list/detail routing stays consistent.
    const requestedMember = getRequestedDirectoryMemberById(req.params.id);
    if (requestedMember) {
      return res.json({
        success: true,
        data: requestedMember,
      });
    }

    const profile = await StudentProfiles.findById(req.params.id);

    if (!profile || !profile.isSingaPenMember) {
      const facultyProfile = await FacultyProfiles.findById(req.params.id);
      if (!facultyProfile) {
        return res.status(404).json({
          success: false,
          message: 'Singa Pen member not found.',
        });
      }

      const facultyUser = await Users.findById(facultyProfile.userId);
      const womensCellRecord = facultyUser
        ? womensCellMemberByName.get(normalizeWomensCellName(facultyUser.name))
        : null;

      if (!facultyUser || !womensCellRecord || womensCellRecord.type !== 'FACULTY') {
        return res.status(404).json({
          success: false,
          message: 'Singa Pen member not found.',
        });
      }

      return res.json({
        success: true,
        data: {
          _id: facultyProfile._id,
          name: facultyUser.name,
          memberType: 'FACULTY',
          department: womensCellRecord.department,
          designation: womensCellRecord.designation || facultyProfile.designation,
          course: womensCellRecord.designation || facultyProfile.designation,
          joiningAcademicYear: '',
          currentStudyYear: null,
          academicStatus: 'FACULTY',
          clubRole: womensCellRecord.role || '',
          clubJoinedAt: facultyProfile.createdAt,
          achievements: [],
          bio: `${facultyUser.name} serves the Women Empowerment Cell as ${womensCellRecord.role ? `${womensCellRecord.role} and ` : ''}${womensCellRecord.designation || facultyProfile.designation} in the Department of ${womensCellRecord.department}.`,
          profileImage: womensCellRecord.profileImage,
          skills: [],
          entrepreneurship: { interestedInEntrepreneurship: false },
        },
      });
    }

    const user = await Users.findById(profile.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member account details not found.',
      });
    }

    const enriched = enrichStudentAcademicDetails(profile) as any;
    const womensCellRecord = womensCellMemberByName.get(normalizeWomensCellName(user.name));

    if (!womensCellRecord || womensCellRecord.type !== 'STUDENT') {
      return res.status(404).json({
        success: false,
        message: 'Singa Pen member not found.',
      });
    }

    const studentSkills = await Skills.find({ studentId: profile.userId });

    const sanitizedMember = {
      _id: enriched._id,
      name: user.name,
      memberType: 'STUDENT',
      department: womensCellRecord.department || enriched.department,
      course: womensCellRecord.course || enriched.course,
      joiningAcademicYear: enriched.joiningAcademicYear,
      currentStudyYear: womensCellRecord.displayStudyYear ?? enriched.currentStudyYear,
      academicStatus: enriched.academicStatus,
      clubRole: womensCellRecord.role || enriched.clubRole,
      clubJoinedAt: enriched.clubJoinedAt,
      achievements: enriched.achievements || [],
      bio: enriched.bio || '',
      profileImage: womensCellRecord.profileImage || enriched.profileImage || '',
      skills: studentSkills.map(skill => ({
        skillName: skill.skillName,
        category: skill.category,
        skillLevel: skill.skillLevel,
        isPrimary: skill.isPrimary,
        tools: skill.tools || [],
        description: skill.description || '',
      })),
      entrepreneurship: enriched.entrepreneurship?.interestedInEntrepreneurship
        ? {
            interestedInEntrepreneurship: true,
            businessIdea: enriched.entrepreneurship.businessIdea,
            preferredIndustry: enriched.entrepreneurship.preferredIndustry,
          }
        : { interestedInEntrepreneurship: false },
    };

    return res.json({
      success: true,
      data: sanitizedMember,
    });
  } catch (error) {
    next(error);
  }
});

// Get Public Government Schemes
router.get('/schemes', async (req, res, next) => {
  try {
    const search = (req.query.search as string || '').toLowerCase();
    const category = req.query.category as string;
    const statusFilter = req.query.status as string;

    const schemes = await GovernmentSchemes.find();
    let enriched = schemes.map(enrichSchemeDetails).filter(Boolean).filter((s: any) => s.status === 'ACTIVE') as any[];

    if (search) {
      enriched = enriched.filter(s => 
        s.title.toLowerCase().includes(search) || 
        s.shortDescription.toLowerCase().includes(search) ||
        s.provider.toLowerCase().includes(search)
      );
    }

    if (category) {
      enriched = enriched.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (statusFilter) {
      enriched = enriched.filter(s => s.status === statusFilter);
    }

    // Sort: Featured first, then active, then latest
    enriched.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      const statusWeight = { ACTIVE: 3, UPCOMING: 2, EXPIRED: 1 };
      const weightA = statusWeight[a.status as keyof typeof statusWeight] || 0;
      const weightB = statusWeight[b.status as keyof typeof statusWeight] || 0;
      if (weightA !== weightB) return weightB - weightA;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
});

// Get Individual Government Scheme Details
router.get('/schemes/:slug', async (req, res, next) => {
  try {
    const scheme = await GovernmentSchemes.findOne({ slug: req.params.slug });
    if (!scheme || scheme.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        message: 'Government scheme not found.'
      });
    }

    return res.json({
      success: true,
      data: enrichSchemeDetails(scheme)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/workshops', async (req, res, next) => {
  try {
    return res.status(404).json({ success: false, message: 'Public workshops are no longer available. Students receive workshop announcements through portal notifications.' });
  } catch (error) {
    next(error);
  }
});

router.get('/workshops/:slug', async (req, res, next) => {
  try {
    return res.status(404).json({ success: false, message: 'Public workshops are no longer available. Students receive workshop announcements through portal notifications.' });
  } catch (error) {
    next(error);
  }
});

// 1. GET /api/v1/public/gallery
router.get('/gallery', async (req, res, next) => {
  try {
    const category = req.query.category as string;
    const search = (req.query.search as string || '').toLowerCase();
    const isFeatured = req.query.isFeatured === 'true';
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 100));

    // Only fetch published albums
    const where: any = { isPublished: true, deletedAt: null };
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (isFeatured) {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { fullDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, albums] = await Promise.all([
      prisma.galleryAlbum.count({ where }),
      prisma.galleryAlbum.findMany({
        where,
        orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
        include: { images: { orderBy: { displayOrder: 'asc' } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Photo counts and fallback cover images, without per-album queries
    const data = albums.map((album) => {
      const images = album.images;
      const photoCount = images.length;
      let coverImage = album.coverImage;
      if (!coverImage && photoCount > 0) {
        coverImage = images[0].imageUrl;
      }
      return {
        _id: album.id,
        id: album.id,
        title: album.title,
        slug: album.slug,
        shortDescription: album.shortDescription,
        fullDescription: album.fullDescription,
        category: album.category,
        eventDate: album.eventDate,
        venue: album.venue,
        organizedBy: album.organizedBy,
        coverImage: coverImage || '/uploads/placeholder_gallery.jpg',
        isFeatured: album.isFeatured,
        isPublished: album.isPublished,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        photoCount,
        previewImages: images.slice(0, 5).map((image) => ({
          _id: image.id,
          imageUrl: image.imageUrl,
          thumbnailUrl: image.thumbnailUrl,
          caption: image.caption,
          altText: image.altText
        }))
      };
    });

    return res.json({
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/v1/public/gallery/:slug
router.get('/gallery/:slug', async (req, res, next) => {
  try {
    const album = await GalleryAlbums.findOne({ slug: req.params.slug, isPublished: true });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Published gallery album not found.'
      });
    }

    let images = await GalleryImages.find({ albumId: album._id });
    images.sort((a, b) => a.displayOrder - b.displayOrder);

    let coverImage = album.coverImage;
    if (!coverImage && images.length > 0) {
      coverImage = images[0].imageUrl;
    }

    return res.json({
      success: true,
      data: {
        ...album,
        coverImage: coverImage || '/uploads/placeholder_gallery.jpg',
        images
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. GET /api/v1/public/achievements
router.get('/achievements', async (req, res, next) => {
  try {
    const achievementType = req.query.achievementType as string;
    const level = req.query.level as string;
    const search = (req.query.search as string || '').toLowerCase();
    const isFeatured = req.query.isFeatured === 'true';

    // Only public achievements
    let query: any = { isPublic: true };
    if (achievementType && achievementType !== 'ALL') {
      query.achievementType = achievementType;
    }
    if (level && level !== 'ALL') {
      query.level = level;
    }
    if (isFeatured) {
      query.isFeatured = true;
    }

    let list = await Achievements.find(query);

    // Filter by studentId's department or memberName/department if specified
    const deptFilter = req.query.department as string;
    const yearFilter = req.query.year as string; // achievementDate year

    // Fetch student profile mapping
    const students = await StudentProfiles.find();
    const studentMap = new Map(students.map(s => [s.userId, s]));

    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(u => [u._id, u]));

    let populated = list.map(ach => {
      let studentName = ach.memberName || 'Student Achiever';
      let department = ach.department || 'N/A';
      let studentAcademicStatus = 'ACTIVE';

      if (ach.studentId) {
        const student = studentMap.get(ach.studentId);
        const user = userMap.get(ach.studentId);
        if (user) studentName = user.name;
        if (student) {
          department = student.department;
          studentAcademicStatus = student.academicStatus || 'ACTIVE';
        }
      }

      return {
        ...ach,
        studentName,
        department,
        studentAcademicStatus
      };
    });

    if (deptFilter && deptFilter !== 'ALL') {
      populated = populated.filter(p => p.department.toLowerCase() === deptFilter.toLowerCase());
    }

    if (yearFilter) {
      populated = populated.filter(p => p.achievementDate && p.achievementDate.startsWith(yearFilter));
    }

    if (search) {
      populated = populated.filter(p => 
        p.title.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search) ||
        p.studentName.toLowerCase().includes(search) ||
        p.eventName?.toLowerCase().includes(search)
      );
    }

    // Sort by achievementDate descending
    populated.sort((a, b) => {
      const dateA = a.achievementDate ? new Date(a.achievementDate).getTime() : new Date(a.createdAt || 0).getTime();
      const dateB = b.achievementDate ? new Date(b.achievementDate).getTime() : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return res.json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
});

// 4. GET /api/v1/public/achievements/:achievementId
router.get('/achievements/:achievementId', async (req, res, next) => {
  try {
    const ach = await Achievements.findOne({ _id: req.params.achievementId, isPublic: true });
    if (!ach) {
      return res.status(404).json({
        success: false,
        message: 'Public achievement not found.'
      });
    }

    let studentName = ach.memberName || 'Student Achiever';
    let department = ach.department || 'N/A';

    if (ach.studentId) {
      const user = await Users.findById(ach.studentId);
      if (user) studentName = user.name;
      const profile = await StudentProfiles.findOne({ userId: ach.studentId });
      if (profile) department = profile.department;
    }

    return res.json({
      success: true,
      data: {
        ...ach,
        studentName,
        department
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
