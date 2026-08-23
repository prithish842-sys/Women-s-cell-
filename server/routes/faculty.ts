import { Router, Response } from 'express';
import { StudentProfiles, Users, Skills, Skill, StudentProfile } from '../models/index.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails } from '../utils/academic.js';
import { prisma } from '../config/prisma.js';
import { RoleUpdateStatusSchema, WorkshopSchema } from '../schemas/validation.js';
import { findRoleUpdateForReview, notifyStudent, serializeRoleUpdate } from '../utils/studentRoleUpdates.js';
import { classifyProgramLevel } from '../utils/programLevel.js';
import { uploadGallery as uploadWorkshopPoster } from '../middleware/upload.js';
import { serializeWorkshop } from '../utils/workshops.js';

const router = Router();

// Faculty dashboard metrics
router.get('/dashboard', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const students = await StudentProfiles.find();
    const enriched = students.map(enrichStudentAcademicDetails).filter(Boolean) as any[];

    const activeCount = enriched.filter(s => s.academicStatus !== 'PASSED_OUT').length;
    const passedOutCount = enriched.filter(s => s.academicStatus === 'PASSED_OUT').length;
    const singaPenCount = enriched.filter(s => s.isSingaPenMember).length;
    const collabAvailableCount = enriched.filter(s => s.availability?.availableForProjects).length;

    const departmentBreakdown = Object.values(
      enriched.reduce<Record<string, { department: string; total: number; ug: number; pg: number }>>((acc, student) => {
        const rawDepartment = String(student.department || 'Unspecified').trim() || 'Unspecified';
        const key = rawDepartment.toLowerCase();
        const current = acc[key] || { department: rawDepartment, total: 0, ug: 0, pg: 0 };
        const programLevel = classifyProgramLevel(student.course, student.courseDurationYears);

        current.total += 1;
        if (programLevel === 'PG') current.pg += 1;
        else current.ug += 1;

        acc[key] = current;
        return acc;
      }, {}),
    ).sort((a, b) => b.total - a.total || a.department.localeCompare(b.department));

    const programLevelSummary = departmentBreakdown.reduce(
      (summary, item) => {
        summary.UG += item.ug;
        summary.PG += item.pg;
        return summary;
      },
      { UG: 0, PG: 0 },
    );

    // Get recently updated profiles (sort by updatedAt latest)
    const sorted = [...enriched].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    const recentlyUpdated = sorted.slice(0, 5);

    // Fetch user names for recently updated
    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(u => [u._id, u.name]));

    const recentWithNames = recentlyUpdated.map(r => ({
      _id: r._id,
      userId: r.userId,
      name: userMap.get(r.userId) || 'Anonymous Student',
      department: r.department,
      course: r.course,
      academicStatus: r.academicStatus,
      updatedAt: r.updatedAt
    }));

    // Categorized skills
    const skillsList = await Skills.find();
    const categoriesSet = new Set(skillsList.map(s => s.category));

    return res.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents: activeCount,
        passedOutStudents: passedOutCount,
        singaPenMembers: singaPenCount,
        availableForCollaboration: collabAvailableCount,
        skillCategoriesCount: categoriesSet.size,
        departmentBreakdown,
        programLevelSummary,
        recentlyUpdated: recentWithNames
      }
    });
  } catch (error) {
    next(error);
  }
});

// Faculty Student Keyword Search
router.get('/students/search', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const keyword = (req.query.keyword as string || '').toLowerCase().trim();
    const category = req.query.category as string;
    const skillLevel = req.query.skillLevel as string;
    const department = req.query.department as string;
    const course = req.query.course as string;
    const academicStatus = req.query.academicStatus as string;
    const programLevel = String(req.query.programLevel || '').toUpperCase();
    const currentStudyYear = req.query.studyYear ? Number(req.query.studyYear) : undefined;
    const isSingaPenMember = req.query.isSingaPenMember === 'true' ? true : req.query.isSingaPenMember === 'false' ? false : undefined;
    const entrepreneurshipInterest = req.query.entrepreneurshipInterest === 'true' ? true : req.query.entrepreneurshipInterest === 'false' ? false : undefined;
    const availabilityQuery = req.query.availability ?? req.query.availableForProjects;
    const availableForProjects = availabilityQuery === 'true' ? true : availabilityQuery === 'false' ? false : undefined;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10', 10), 1), 50);

    // 1. Fetch all student profiles and enrich with academic details
    const profiles = await StudentProfiles.find();
    let enriched = profiles.map(enrichStudentAcademicDetails).filter(Boolean) as any[];

    // 2. Fetch all student user accounts
    const studentUsers = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(studentUsers.map(u => [u._id, u]));

    // 3. Fetch all skills
    const allSkills = await Skills.find();
    // Group skills by student user id
    const skillsByStudentMap = new Map<string, Skill[]>();
    allSkills.forEach(s => {
      const list = skillsByStudentMap.get(s.studentId) || [];
      list.push(s);
      skillsByStudentMap.set(s.studentId, list);
    });

    // 4. Filter list
    let filteredList = enriched.map(profile => {
      const user = userMap.get(profile.userId);
      const studentSkills = skillsByStudentMap.get(profile.userId) || [];
      return {
        ...profile,
        name: user ? user.name : 'Unknown Student',
        email: user ? user.email : '',
        isActive: user ? user.isActive : false,
        programLevel: classifyProgramLevel(profile.course, profile.courseDurationYears),
        skills: studentSkills
      };
    });

    // Apply strict account active check
    filteredList = filteredList.filter(s => s.isActive);
    const availableDepartments = Array.from(new Set(filteredList.map(s => String(s.department || '').trim()).filter(Boolean))).sort();
    const availableCourses = Array.from(new Set(filteredList.map(s => String(s.course || '').trim()).filter(Boolean))).sort();
    const availableProgramLevels = {
      UG: filteredList.filter((student) => student.programLevel === 'UG').length,
      PG: filteredList.filter((student) => student.programLevel === 'PG').length,
    };

    // Apply filters
    if (department) {
      filteredList = filteredList.filter(s => s.department.toLowerCase() === department.toLowerCase());
    }
    if (course) {
      filteredList = filteredList.filter(s => s.course.toLowerCase() === course.toLowerCase());
    }
    if (academicStatus) {
      filteredList = filteredList.filter(s => s.academicStatus === academicStatus);
    }
    if (['UG', 'PG'].includes(programLevel)) {
      filteredList = filteredList.filter(s => s.programLevel === programLevel);
    }
    if (currentStudyYear) {
      filteredList = filteredList.filter(s => Number(s.currentStudyYear) === currentStudyYear);
    }
    if (isSingaPenMember !== undefined) {
      filteredList = filteredList.filter(s => s.isSingaPenMember === isSingaPenMember);
    }
    if (entrepreneurshipInterest !== undefined) {
      filteredList = filteredList.filter(s => s.entrepreneurship?.interestedInEntrepreneurship === entrepreneurshipInterest);
    }
    if (availableForProjects !== undefined) {
      filteredList = filteredList.filter(s => s.availability?.availableForProjects === availableForProjects);
    }

    // Filter by skill categories or skill levels
    if (category) {
      filteredList = filteredList.filter(s => s.skills.some((sk: Skill) => sk.category.toLowerCase() === category.toLowerCase()));
    }
    if (skillLevel) {
      filteredList = filteredList.filter(s => s.skills.some((sk: Skill) => sk.skillLevel === skillLevel));
    }

    // Apply main Keyword search across multiple fields
    if (keyword) {
      filteredList = filteredList.filter(s => {
        const matchesName = s.name.toLowerCase().includes(keyword);
        const matchesDepartment = s.department.toLowerCase().includes(keyword);
        const matchesCourse = s.course.toLowerCase().includes(keyword);
        const matchesBio = (s.bio || '').toLowerCase().includes(keyword);
        const matchesIdea = (s.entrepreneurship?.businessIdea || '').toLowerCase().includes(keyword);
        const matchesPlan = (s.entrepreneurship?.futurePlan || '').toLowerCase().includes(keyword);
        const matchesIndustry = (s.entrepreneurship?.preferredIndustry || '').toLowerCase().includes(keyword);
        const matchesRole = (s.clubRole || '').toLowerCase().includes(keyword);

        const matchesSkills = s.skills.some((sk: Skill) => 
          sk.skillName.toLowerCase().includes(keyword) || 
          sk.description?.toLowerCase().includes(keyword) || 
          (sk.tools || []).some(t => t.toLowerCase().includes(keyword))
        );

        return matchesName || matchesDepartment || matchesCourse || matchesBio || matchesIdea || matchesPlan || matchesIndustry || matchesRole || matchesSkills;
      });
    }

    // Pagination
    const total = filteredList.length;
    const startIndex = (page - 1) * limit;
    const paginatedList = filteredList.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: paginatedList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(totalPages, 1),
        departments: availableDepartments,
        courses: availableCourses,
        programLevels: availableProgramLevels
      }
    });
  } catch (error) {
    next(error);
  }
});

// View student details with private contact info
router.get('/students/:studentId', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const user = await Users.findById(profile.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student user account not found.'
      });
    }

    const enriched = enrichStudentAcademicDetails(profile) as any;
    const studentSkills = await Skills.find({ studentId: profile.userId });

    return res.json({
      success: true,
      data: {
        _id: enriched._id,
        name: user.name,
        email: user.email, // Visible to faculty/admin
        phone: enriched.phone, // Visible to faculty/admin
        registerNumber: enriched.registerNumber, // Visible to faculty/admin
        department: enriched.department,
        course: enriched.course,
        bio: enriched.bio,
        profileImage: enriched.profileImage,
        joiningAcademicYear: enriched.joiningAcademicYear,
        expectedPassingYear: enriched.expectedPassingYear,
        expectedCompletionDate: enriched.expectedCompletionDate,
        courseDurationYears: enriched.courseDurationYears,
        programLevel: classifyProgramLevel(enriched.course, enriched.courseDurationYears),
        currentStudyYear: enriched.currentStudyYear,
        academicStatus: enriched.academicStatus,
        isSingaPenMember: enriched.isSingaPenMember,
        clubRole: enriched.clubRole,
        clubJoinedAt: enriched.clubJoinedAt,
        achievements: enriched.achievements || [],
        entrepreneurship: enriched.entrepreneurship,
        availability: enriched.availability,
        skills: studentSkills,
        createdAt: enriched.createdAt,
        updatedAt: enriched.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/role-updates', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const status = String(req.query.status || '');
    const studentId = String(req.query.studentId || '');
    const functionalRole = String(req.query.functionalRole || '');
    const where: any = {};
    if (['SUBMITTED', 'REVIEWED', 'FOLLOW_UP_REQUIRED', 'COMPLETED'].includes(status)) where.status = status;
    if (studentId) where.studentId = studentId;
    if (functionalRole) where.functionalRole = functionalRole;

    const updates = await prisma.studentRoleUpdate.findMany({
      where,
      include: { student: { include: { user: true } }, reviewedBy: true },
      orderBy: [{ status: 'asc' }, { activityDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const summary = {
      submitted: await prisma.studentRoleUpdate.count({ where: { status: 'SUBMITTED' } }),
      reviewed: await prisma.studentRoleUpdate.count({ where: { status: 'REVIEWED' } }),
      followUpRequired: await prisma.studentRoleUpdate.count({ where: { status: 'FOLLOW_UP_REQUIRED' } }),
      completed: await prisma.studentRoleUpdate.count({ where: { status: 'COMPLETED' } }),
    };

    return res.json({ success: true, data: { updates: updates.map(serializeRoleUpdate), summary } });
  } catch (error) {
    next(error);
  }
});

router.patch('/role-updates/:updateId/status', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = RoleUpdateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
      });
    }

    const existing = await findRoleUpdateForReview(req.params.updateId);
    if (!existing) return res.status(404).json({ success: false, message: 'Role update not found.' });

    const updated = await prisma.studentRoleUpdate.update({
      where: { id: existing.id },
      data: {
        status: parseResult.data.status,
        reviewedById: req.user!._id!,
        reviewedAt: new Date(),
      },
      include: { student: { include: { user: true } }, reviewedBy: true },
    });

    const statusLabel = parseResult.data.status === 'FOLLOW_UP_REQUIRED' ? 'Follow-up Required' : parseResult.data.status === 'COMPLETED' ? 'Completed' : 'Reviewed';
    await notifyStudent(
      updated.student.userId,
      parseResult.data.status === 'FOLLOW_UP_REQUIRED' ? 'Follow-up Required' : 'Your Role Update was reviewed',
      `${updated.title} status: ${statusLabel}.`,
      '/student/role-updates',
    );

    return res.json({ success: true, message: 'Role update status updated.', data: serializeRoleUpdate(updated) });
  } catch (error) {
    next(error);
  }
});


// Faculty workshop calendar. Uses the same Workshop model as Admin/Student flows.
router.get('/workshops', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10), 1), 100);
    const search = String(req.query.search || '').trim();

    const where: any = {
      OR: [
        { isPublished: true },
        { createdById: req.user!._id! },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { venue: { contains: search, mode: 'insensitive' } },
            { organizer: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [total, workshops] = await Promise.all([
      prisma.workshop.count({ where }),
      prisma.workshop.findMany({
        where,
        include: {
          participations: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: [{ startDateTime: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      success: true,
      data: workshops.map(serializeWorkshop),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Faculty can create an event/workshop using the shared Workshop model.
// Faculty-created records are published immediately so they appear in the
// student workshop calendar and the faculty calendar without a second route.
router.post(
  '/workshops',
  auth,
  authorize(['FACULTY']),
  uploadWorkshopPoster.single('poster'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const body = {
        ...req.body,
        maximumParticipants: req.body.maximumParticipants ? Number(req.body.maximumParticipants) : undefined,
        isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
        isPublished: true,
      };

      const parsed = WorkshopSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const data = parsed.data;
      const slug = `${data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

      const created = await prisma.workshop.create({
        data: {
          ...data,
          slug,
          startDateTime: new Date(data.startDateTime),
          endDateTime: new Date(data.endDateTime),
          posterImage: req.file ? `/uploads/gallery/images/${req.file.filename}` : data.posterImage || null,
          registrationUrl: data.registrationUrl || null,
          targetAudience: data.targetAudience || null,
          maximumParticipants: data.maximumParticipants || null,
          galleryAlbumId: data.galleryAlbumId || null,
          isPublished: true,
          createdById: req.user!._id!,
        },
        include: {
          participations: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      try {
        const students = await prisma.user.findMany({
          where: { role: 'STUDENT', isActive: true },
          select: { id: true },
        });

        if (students.length) {
          await prisma.notification.createMany({
            data: students.map((student) => ({
              userId: student.id,
              type: 'WORKSHOP',
              title: created.title,
              message: `${created.organizer} added a workshop at ${created.venue} on ${created.startDateTime.toLocaleDateString()}.`,
              link: '/student/workshops',
            })),
          });
        }
      } catch (notificationError) {
        console.error('Workshop created, but student notifications could not be queued:', notificationError);
      }

      return res.status(201).json({
        success: true,
        message: 'Workshop created and published.',
        data: serializeWorkshop(created),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/workshops/:workshopId/registrations', auth, authorize(['FACULTY', 'ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: req.params.workshopId },
      select: { id: true, title: true },
    });

    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }

    const rows = await prisma.workshopParticipation.findMany({
      where: { workshopId: workshop.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return res.json({
      success: true,
      data: rows.map((row) => ({
        _id: row.id,
        status: row.status,
        registeredAt: row.createdAt,
        attendanceMarkedAt: row.attendanceMarkedAt,
        student: {
          _id: row.student.id,
          name: row.student.user.name,
          email: row.student.user.email,
          registerNumber: row.student.registerNumber,
          department: row.student.department,
          course: row.student.course,
          phone: row.student.phone,
          programLevel: classifyProgramLevel(row.student.course, row.student.courseDurationYears),
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', auth, authorize(['FACULTY']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!._id! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: notifications.map(notification => ({ ...notification, _id: notification.id })) });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications/unread-count', auth, authorize(['FACULTY']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!._id!, isRead: false } });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:notificationId/read', auth, authorize(['FACULTY']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: req.params.notificationId, userId: req.user!._id! } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true, readAt: new Date() } });
    return res.json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/read-all', auth, authorize(['FACULTY']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!._id!, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

export default router;
