import { Router, Response } from 'express';
import { StudentProfiles, Users, Skills, Skill, StudentProfile } from '../models/index.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails } from '../utils/academic.js';
import { prisma } from '../config/prisma.js';
import { RoleUpdateStatusSchema } from '../schemas/validation.js';
import { findRoleUpdateForReview, notifyStudent, serializeRoleUpdate } from '../utils/studentRoleUpdates.js';

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
    const isSingaPenMember = req.query.isSingaPenMember === 'true' ? true : req.query.isSingaPenMember === 'false' ? false : undefined;
    const entrepreneurshipInterest = req.query.entrepreneurshipInterest === 'true' ? true : req.query.entrepreneurshipInterest === 'false' ? false : undefined;
    const availabilityQuery = req.query.availability ?? req.query.availableForProjects;
    const availableForProjects = availabilityQuery === 'true' ? true : availabilityQuery === 'false' ? false : undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);

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
        skills: studentSkills
      };
    });

    // Apply strict account active check
    filteredList = filteredList.filter(s => s.isActive);

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
        totalPages
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
