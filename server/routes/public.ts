import { Router } from 'express';
import { StudentProfiles, Users, GovernmentSchemes, SiteContents, Skills, GalleryAlbums, GalleryImages, Achievements, FacultyProfiles } from '../models/index.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails } from '../utils/academic.js';
import { normalizeWomensCellName, womensCellMemberByName } from '../data/womensCellMembers.js';
import { enrichSchemeDetails } from '../utils/scheme.js';
import { prisma } from '../config/prisma.js';
import { serializeWorkshop } from '../utils/workshops.js';

const router = Router();

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
    const students = await StudentProfiles.find();
    const schemes = await GovernmentSchemes.find();
    
    // Dynamic calculations
    const enriched = students.map(enrichStudentAcademicDetails);
    const activeStudents = enriched.filter(s => s && s.academicStatus !== 'PASSED_OUT').length;
    const alumniCount = enriched.filter(s => s && s.academicStatus === 'PASSED_OUT').length;
    
    const singaPenMembers = students.filter(s => s.isSingaPenMember).length;
    
    // Active schemes (calculate status dynamically)
    const schemeDetails = schemes.map(enrichSchemeDetails);
    const activeSchemes = schemeDetails.filter(s => s && s.status === 'ACTIVE').length;

    // Categorized skills
    const skillsList = await Skills.find();
    const skillCount = skillsList.length;

    return res.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents,
        alumniCount,
        singaPenMembers,
        activeSchemes,
        totalSkills: skillCount,
        departmentCount: Array.from(new Set(students.map(s => s.department))).length
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

    // Only actual Singa Pen members are visible publicly
    let members = await StudentProfiles.find({ isSingaPenMember: true });

    // Enriched details
    let enriched = members.map(enrichStudentAcademicDetails).filter(Boolean) as any[];

    // Fetch user details for names
    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(u => [u._id, u.name]));

    enriched = enriched.map(m => {
      const name = userMap.get(m.userId) || 'Anonymous Member';
      const womensCellRecord = womensCellMemberByName.get(normalizeWomensCellName(name));
      return {
        ...m,
        name,
        memberType: 'STUDENT',
        ...(womensCellRecord ? {
          department: womensCellRecord.department,
          course: womensCellRecord.course || m.course,
          currentStudyYear: womensCellRecord.displayStudyYear,
          clubRole: womensCellRecord.role || m.clubRole,
          profileImage: womensCellRecord.profileImage,
        } : {}),
      };
    }).filter(m => womensCellMemberByName.has(normalizeWomensCellName(m.name)));

    const facultyProfiles = await FacultyProfiles.find();
    const facultyUsers = await Users.find({ role: 'FACULTY' });
    const facultyUserMap = new Map(facultyUsers.map(u => [u._id, u.name]));
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

    enriched = [...enriched, ...womensCellFaculty];

    // Filter by name (search)
    if (search) {
      enriched = enriched.filter(m => m.name.toLowerCase().includes(search));
    }

    // Filter by department
    if (department) {
      enriched = enriched.filter(m => m.department.toLowerCase() === department.toLowerCase());
    }

    // Filter by course
    if (course) {
      enriched = enriched.filter(m => m.course.toLowerCase() === course.toLowerCase());
    }

    // Filter by clubRole
    if (clubRole) {
      enriched = enriched.filter(m => m.clubRole === clubRole);
    }

    // Filter by academicStatus
    if (academicStatus) {
      enriched = enriched.filter(m => m.academicStatus === academicStatus);
    }

    // Filter by Alumni/Current
    if (alumniOnly) {
      enriched = enriched.filter(m => m.academicStatus === 'PASSED_OUT');
    }

    // Sanitize member details for privacy reasons before returning
    const sanitizedMembers = enriched.map(m => {
      return {
        _id: m._id,
        name: m.name,
        department: m.department,
        course: m.course,
        joiningAcademicYear: m.joiningAcademicYear,
        currentStudyYear: m.currentStudyYear,
        academicStatus: m.academicStatus,
        clubRole: m.clubRole,
        memberType: m.memberType || 'STUDENT',
        designation: m.designation || '',
        clubJoinedAt: m.clubJoinedAt,
        achievements: m.achievements || [],
        bio: m.bio || '',
        profileImage: m.profileImage || ''
      };
    });

    return res.json({
      success: true,
      data: sanitizedMembers
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
    const profile = await StudentProfiles.findById(req.params.id);
    if (!profile || !profile.isSingaPenMember) {
      const facultyProfile = await FacultyProfiles.findById(req.params.id);
      if (!facultyProfile) {
        return res.status(404).json({
          success: false,
          message: 'Singa Pen member not found.'
        });
      }

      const facultyUser = await Users.findById(facultyProfile.userId);
      const womensCellRecord = facultyUser
        ? womensCellMemberByName.get(normalizeWomensCellName(facultyUser.name))
        : null;

      if (!facultyUser || !womensCellRecord || womensCellRecord.type !== 'FACULTY') {
        return res.status(404).json({
          success: false,
          message: 'Singa Pen member not found.'
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
        }
      });
    }

    const user = await Users.findById(profile.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member account details not found.'
      });
    }

    const enriched = enrichStudentAcademicDetails(profile) as any;
    const womensCellRecord = womensCellMemberByName.get(normalizeWomensCellName(user.name));
    if (!womensCellRecord || womensCellRecord.type !== 'STUDENT') {
      return res.status(404).json({
        success: false,
        message: 'Singa Pen member not found.'
      });
    }
    
    // Fetch student's skills
    const studentSkills = await Skills.find({ studentId: profile.userId });

    const sanitizedMember = {
      _id: enriched._id,
      name: user.name,
      memberType: 'STUDENT',
      department: womensCellRecord?.department || enriched.department,
      course: womensCellRecord?.course || enriched.course,
      joiningAcademicYear: enriched.joiningAcademicYear,
      currentStudyYear: womensCellRecord ? womensCellRecord.displayStudyYear : enriched.currentStudyYear,
      academicStatus: enriched.academicStatus,
      clubRole: womensCellRecord?.role || enriched.clubRole,
      clubJoinedAt: enriched.clubJoinedAt,
      achievements: enriched.achievements || [],
      bio: enriched.bio || '',
      profileImage: womensCellRecord?.profileImage || enriched.profileImage || '',
      skills: studentSkills.map(s => ({
        skillName: s.skillName,
        category: s.category,
        skillLevel: s.skillLevel,
        isPrimary: s.isPrimary,
        tools: s.tools || [],
        description: s.description || ''
      })),
      entrepreneurship: enriched.entrepreneurship?.interestedInEntrepreneurship ? {
        interestedInEntrepreneurship: true,
        businessIdea: enriched.entrepreneurship.businessIdea,
        preferredIndustry: enriched.entrepreneurship.preferredIndustry
      } : { interestedInEntrepreneurship: false }
    };

    return res.json({
      success: true,
      data: sanitizedMember
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

    // Only fetch published albums
    let query: any = { isPublished: true };
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (isFeatured) {
      query.isFeatured = true;
    }

    let albums = await GalleryAlbums.find(query);

    // Apply search filter on title or description
    if (search) {
      albums = albums.filter(a => 
        a.title.toLowerCase().includes(search) || 
        a.shortDescription.toLowerCase().includes(search) ||
        a.fullDescription.toLowerCase().includes(search)
      );
    }

    // Sort by eventDate or createdAt descending
    albums.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : new Date(a.createdAt || 0).getTime();
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Populate photo counts and fallback cover image
    const populated = await Promise.all(albums.map(async (album) => {
      const images = await GalleryImages.find({ albumId: album._id });
      images.sort((a, b) => a.displayOrder - b.displayOrder);
      const photoCount = images.length;
      let coverImage = album.coverImage;
      if (!coverImage && photoCount > 0) {
        coverImage = images[0].imageUrl;
      }
      return {
        ...album,
        photoCount,
        coverImage: coverImage || '/uploads/placeholder_gallery.jpg',
        previewImages: images.slice(0, 5).map(image => ({
          _id: image._id,
          imageUrl: image.imageUrl,
          thumbnailUrl: image.thumbnailUrl,
          caption: image.caption,
          altText: image.altText
        }))
      };
    }));

    return res.json({
      success: true,
      data: populated
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
