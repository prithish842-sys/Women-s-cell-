import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Users, StudentProfiles, FacultyProfiles, GovernmentSchemes, SiteContents, Skills, Skill, GalleryAlbums, GalleryImages, Achievements } from '../models/index.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails, getCurrentAcademicYear } from '../utils/academic.js';
import { enrichSchemeDetails } from '../utils/scheme.js';
import {
  FacultyAccountSchema,
  GovernmentSchemeSchema,
  JobOpportunitySchema,
  SafetySupportContactSchema,
  SkillRequestPreviewSchema,
  SkillRequestSchema,
  RoleUpdateStatusSchema,
  WorkshopCertificateSchema,
  WorkshopParticipationAdminSchema,
  WorkshopSchema,
} from '../schemas/validation.js';
import { uploadGallery, uploadAchievementFiles, uploadGallery as uploadWorkshopPoster, uploadReportDocument } from '../middleware/upload.js';
import { prisma } from '../config/prisma.js';
import { findMatchingStudents } from '../utils/skillRequests.js';
import { serializeWorkshop } from '../utils/workshops.js';
import { findRoleUpdateForReview, notifyStudent, serializeRoleUpdate } from '../utils/studentRoleUpdates.js';
import { classifyProgramLevel } from '../utils/programLevel.js';

const router = Router();
const complaintStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'CLOSED'] as const;

const serializeIccComplaint = (complaint: any) => ({
  ...complaint,
  _id: complaint.id,
});

router.get('/search', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) return res.json({ success: true, data: [] });
    const term = query.toLowerCase();

    const [users, students, faculty, schemes, workshops, albums] = await Promise.all([
      Users.find(),
      StudentProfiles.find(),
      FacultyProfiles.find(),
      GovernmentSchemes.find(),
      prisma.workshop.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { venue: { contains: query, mode: 'insensitive' } },
            { organizer: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.galleryAlbum.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { venue: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const userMap = new Map(users.map((user: any) => [user._id, user]));
    const studentResults = students
      .map((profile: any) => ({ profile, user: userMap.get(profile.userId) }))
      .filter(({ profile, user }: any) => [user?.name, user?.email, profile.registerNumber, profile.department, profile.course].filter(Boolean).some(value => String(value).toLowerCase().includes(term)))
      .slice(0, 5)
      .map(({ profile, user }: any) => ({
        id: profile._id,
        type: 'Students',
        title: user?.name || profile.registerNumber,
        subtitle: `${profile.registerNumber} · ${profile.department}`,
        path: `/admin/students?search=${encodeURIComponent(query)}`,
      }));

    const facultyResults = faculty
      .map((profile: any) => ({ profile, user: userMap.get(profile.userId) }))
      .filter(({ profile, user }: any) => [user?.name, user?.email, profile.staffId, profile.department, profile.designation].filter(Boolean).some(value => String(value).toLowerCase().includes(term)))
      .slice(0, 5)
      .map(({ profile, user }: any) => ({
        id: profile._id,
        type: 'Members',
        title: user?.name || profile.staffId,
        subtitle: `${profile.designation} · ${profile.department}`,
        path: `/admin/members?search=${encodeURIComponent(query)}`,
      }));

    const schemeResults = schemes
      .map(enrichSchemeDetails)
      .filter((scheme: any) => [scheme.title, scheme.provider, scheme.category, scheme.shortDescription].filter(Boolean).some(value => String(value).toLowerCase().includes(term)))
      .slice(0, 5)
      .map((scheme: any) => ({
        id: scheme._id || scheme.id,
        type: 'Schemes',
        title: scheme.title,
        subtitle: `${scheme.provider} · ${scheme.status}`,
        path: `/admin/schemes?search=${encodeURIComponent(query)}`,
      }));

    const workshopResults = workshops.map(workshop => ({
      id: workshop.id,
      type: 'Workshops',
      title: workshop.title,
      subtitle: `${workshop.venue} · ${workshop.category}`,
      path: `/admin/workshops?search=${encodeURIComponent(query)}`,
    }));

    const galleryResults = albums.map(album => ({
      id: album.id,
      type: 'Gallery',
      title: album.title,
      subtitle: `${album.category}${album.venue ? ` · ${album.venue}` : ''}`,
      path: `/admin/gallery?search=${encodeURIComponent(query)}`,
    }));

    return res.json({ success: true, data: [...studentResults, ...facultyResults, ...schemeResults, ...workshopResults, ...galleryResults].slice(0, 20) });
  } catch (error) {
    next(error);
  }
});

// 1. Admin Dashboard Statistics
router.get('/dashboard', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const now = new Date();
    const [
      students,
      facultyCount,
      schemes,
      skillsList,
      upcomingWorkshops,
      workshopRegistrationCount,
      attendedWorkshopCount,
      pendingSkillRequests,
      galleryAlbumCount,
      unreadNotifications,
      pendingIccCaseCount,
      pendingAchievementApprovals,
      recentRegistrations,
      recentNotifications,
      jobsAndInternships,
      activeSupportContacts,
      roleUpdateSummary,
      recentRoleUpdates,
    ] = await Promise.all([
      StudentProfiles.find(),
      Users.countDocuments({ role: 'FACULTY' }),
      GovernmentSchemes.find(),
      Skills.find(),
      prisma.workshop.count({ where: { isPublished: true, isCancelled: false, startDateTime: { gte: now } } }),
      prisma.workshopParticipation.count({ where: { status: { in: ['REGISTERED', 'ATTENDED'] } } }),
      prisma.workshopParticipation.count({ where: { status: 'ATTENDED' } }),
      prisma.skillRequest.count({ where: { status: 'DRAFT' } }),
      prisma.galleryAlbum.count(),
      prisma.notification.count({ where: { userId: req.user!._id!, isRead: false } }),
      prisma.iccComplaint.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'] } } }),
      prisma.achievement.count({ where: { isPublic: false } }),
      prisma.workshopParticipation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          workshop: { select: { id: true, title: true, startDateTime: true } },
          student: { include: { user: { select: { name: true, email: true } } } },
        },
      }),
      prisma.notification.findMany({
        where: { userId: req.user!._id! },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobOpportunity.count({ where: { status: 'PUBLISHED' } }),
      prisma.safetySupportContact.count({ where: { isActive: true } }),
      prisma.studentRoleUpdate.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.studentRoleUpdate.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true } }, reviewedBy: true },
      }),
    ]);

    const enriched = students.map(enrichStudentAcademicDetails).filter(Boolean) as any[];
    const active = enriched.filter(s => s.academicStatus === 'ACTIVE').length;
    const finalYear = enriched.filter(s => s.academicStatus === 'FINAL_YEAR').length;
    const passingSoon = enriched.filter(s => s.academicStatus === 'PASSING_OUT_SOON').length;
    const passedOut = enriched.filter(s => s.academicStatus === 'PASSED_OUT').length;
    const singaPenMembers = enriched.filter(s => s.isSingaPenMember).length;
    const statusDistribution = {
      ACTIVE: active,
      FINAL_YEAR: finalYear,
      PASSING_OUT_SOON: passingSoon,
      PASSED_OUT: passedOut,
    };
    const departmentLevelCounts = enriched.reduce<Record<string, { ug: number; pg: number; total: number }>>((counts, student) => {
      const rawDepartment = String(student.department || 'Unspecified').trim() || 'Unspecified';
      const existingKey = Object.keys(counts).find((key) => key.toLowerCase() === rawDepartment.toLowerCase());
      const department = existingKey || rawDepartment;
      const current = counts[department] || { ug: 0, pg: 0, total: 0 };
      const level = classifyProgramLevel(student.course, student.courseDurationYears);

      if (level === 'PG') current.pg += 1;
      else current.ug += 1;

      current.total += 1;
      counts[department] = current;
      return counts;
    }, {});

    const departmentCounts = Object.fromEntries(
      Object.entries(departmentLevelCounts).map(([name, counts]) => [name, counts.total]),
    );
    const topDepartments = Object.entries(departmentLevelCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([name, counts]) => ({ name, count: counts.total, ug: counts.ug, pg: counts.pg }));
    const topSkills = Object.entries(skillsList.reduce<Record<string, number>>((counts, skill) => {
      counts[skill.skillName] = (counts[skill.skillName] || 0) + 1;
      return counts;
    }, {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    const enrichedSchemes = schemes.map(enrichSchemeDetails).filter(Boolean) as any[];
    const activeSchemes = enrichedSchemes.filter(s => s.status === 'ACTIVE').length;
    const upcomingSchemes = enrichedSchemes.filter(s => s.status === 'UPCOMING').length;
    const expiredSchemes = enrichedSchemes.filter(s => s.status === 'EXPIRED').length;
    const participationTrend = [
      { label: 'Registered', count: workshopRegistrationCount },
      { label: 'Attended', count: attendedWorkshopCount },
      { label: 'Upcoming', count: upcomingWorkshops },
    ];
    const pendingActions = [
      { label: 'Draft skill requests', count: pendingSkillRequests, link: '/admin/skill-requests' },
      { label: 'Student in-charge updates to review', count: roleUpdateSummary.find(row => row.status === 'SUBMITTED')?._count._all || 0, link: '/admin/role-updates' },
      { label: 'Private achievements to review', count: pendingAchievementApprovals, link: '/admin/achievements' },
      { label: 'Unread notifications', count: unreadNotifications, link: '/admin/notifications' },
      { label: 'Confidential ICC cases requiring authorized review', count: pendingIccCaseCount, link: null },
    ];

    return res.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents: active,
        finalYearStudents: finalYear,
        passingSoonStudents: passingSoon,
        passedOutStudents: passedOut,
        singaPenMembers,
        facultyCount,
        upcomingWorkshops,
        workshopRegistrationCount,
        attendedWorkshopCount,
        pendingSkillRequests,
        pendingAchievementApprovals,
        publishedSchemes: activeSchemes,
        activeSchemesCount: activeSchemes,
        upcomingSchemesCount: upcomingSchemes,
        expiredSchemesCount: expiredSchemes,
        galleryAlbumCount,
        unreadNotifications,
        pendingIccCaseCount,
        jobsAndInternships,
        activeSupportContacts,
        roleUpdateActivity: {
          submitted: roleUpdateSummary.find(row => row.status === 'SUBMITTED')?._count._all || 0,
          reviewed: roleUpdateSummary.find(row => row.status === 'REVIEWED')?._count._all || 0,
          followUpRequired: roleUpdateSummary.find(row => row.status === 'FOLLOW_UP_REQUIRED')?._count._all || 0,
          completed: roleUpdateSummary.find(row => row.status === 'COMPLETED')?._count._all || 0,
          recent: recentRoleUpdates.map(serializeRoleUpdate),
        },
        statusDistribution,
        departmentCounts,
        topDepartments,
        topSkills,
        entrepreneurshipCount: enriched.filter(s => s.entrepreneurship?.interestedInEntrepreneurship).length,
        participationTrend,
        pendingActions,
        recentRegistrations: recentRegistrations.map(row => ({
          _id: row.id,
          status: row.status,
          createdAt: row.createdAt,
          workshop: { _id: row.workshop.id, title: row.workshop.title, startDateTime: row.workshop.startDateTime },
          student: { _id: row.student.id, name: row.student.user.name, email: row.student.user.email, registerNumber: row.student.registerNumber, department: row.student.department },
        })),
        recentNotifications: recentNotifications.map(notification => ({
          ...notification,
          _id: notification.id,
          message: notification.type === 'SYSTEM' && notification.title.toLowerCase().includes('icc')
            ? 'Confidential ICC case requires authorized review.'
            : notification.message,
        })),
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim();
    const status = String(req.query.status || '').trim();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10), 1), 50);

    const where: any = {
      ...(role && ['ADMIN', 'STUDENT', 'FACULTY', 'ICC_ADMIN'].includes(role) ? { role } : {}),
      ...(status === 'active' ? { isActive: true } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { identifier: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, rows, roleRows, activeCount, inactiveCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          identifier: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          studentProfile: { select: { id: true, phone: true, profileImage: true, department: true, course: true, isSingaPenMember: true, clubRole: true } },
          facultyProfile: { select: { id: true, phone: true, department: true, designation: true, staffId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    const roleDistribution = roleRows.map(row => ({ role: row.role, count: row._count._all }));
    return res.json({
      success: true,
      data: rows.map(row => ({
        _id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        identifier: row.identifier,
        isActive: row.isActive,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt,
        phone: row.studentProfile?.phone || row.facultyProfile?.phone || '',
        profileImage: row.studentProfile?.profileImage || '',
        department: row.studentProfile?.department || row.facultyProfile?.department || '',
        designation: row.facultyProfile?.designation || row.studentProfile?.clubRole || '',
        isSingaPenMember: row.studentProfile?.isSingaPenMember || false,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), roleDistribution, activeCount, inactiveCount },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:userId/status', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive boolean is required.' });
    }
    if (req.params.userId === req.user!._id && !isActive) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    }
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return res.json({ success: true, message: `${updated.name} is now ${updated.isActive ? 'active' : 'inactive'}.`, data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

// 2. Student Directory Management
router.get('/students', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const search = (req.query.search as string || '').toLowerCase();
    const department = req.query.department as string;
    const course = req.query.course as string;
    const academicStatus = req.query.academicStatus as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);

    const students = await StudentProfiles.find();
    let enriched = students.map(enrichStudentAcademicDetails).filter(Boolean) as any[];

    // Fetch account details
    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(u => [u._id, u]));

    let fullList = enriched.map(profile => {
      const user = userMap.get(profile.userId);
      return {
        ...profile,
        name: user ? user.name : 'Unknown Student',
        email: user ? user.email : '',
        isActive: user ? user.isActive : false,
        programLevel: classifyProgramLevel(profile.course, profile.courseDurationYears),
      };
    });

    const departmentOptions = Array.from(
      fullList.reduce<Map<string, string>>((map, student) => {
        const name = String(student.department || '').trim();
        if (name && !map.has(name.toLowerCase())) map.set(name.toLowerCase(), name);
        return map;
      }, new Map<string, string>()).values(),
    ).sort((a, b) => a.localeCompare(b));

    const programLevelCounts = fullList.reduce(
      (counts, student) => {
        if (student.programLevel === 'PG') counts.pg += 1;
        else counts.ug += 1;
        return counts;
      },
      { ug: 0, pg: 0 },
    );

    // Filters
    if (department) {
      fullList = fullList.filter(s => s.department.toLowerCase() === department.toLowerCase());
    }
    if (course) {
      fullList = fullList.filter(s => s.course.toLowerCase() === course.toLowerCase());
    }
    if (academicStatus) {
      fullList = fullList.filter(s => s.academicStatus === academicStatus);
    }
    if (search) {
      fullList = fullList.filter(s => 
        s.name.toLowerCase().includes(search) || 
        s.registerNumber.toLowerCase().includes(search) || 
        s.email.toLowerCase().includes(search)
      );
    }

    const total = fullList.length;
    const paginatedList = fullList.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: paginatedList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        departments: departmentOptions,
        programLevels: programLevelCounts,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get detailed individual student (includes achievements and skills)
router.get('/students/:studentId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const user = await Users.findById(profile.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student user account not found.' });
    }

    const enriched = enrichStudentAcademicDetails(profile) as any;
    const studentSkills = await Skills.find({ studentId: profile.userId });

    return res.json({
      success: true,
      data: {
        ...enriched,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        skills: studentSkills
      }
    });
  } catch (error) {
    next(error);
  }
});

// Edit student profile directly
router.put('/students/:studentId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { name, email, department, course, phone, isSingaPenMember, clubRole, achievements, academicStatus, currentStudyYear } = req.body;

    const userUpdates: Record<string, any> = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email.toLowerCase();
    if (Object.keys(userUpdates).length > 0) {
      await Users.findByIdAndUpdate(profile.userId, userUpdates);
    }

    const profileUpdates: Record<string, any> = {};
    if (department !== undefined) profileUpdates.department = department;
    if (course !== undefined) profileUpdates.course = course;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (academicStatus !== undefined) profileUpdates.academicStatus = academicStatus;
    if (currentStudyYear !== undefined) profileUpdates.currentStudyYear = Number(currentStudyYear);
    if (achievements !== undefined) profileUpdates.achievements = achievements || [];
    if (isSingaPenMember !== undefined) {
      profileUpdates.isSingaPenMember = !!isSingaPenMember;
      profileUpdates.clubRole = isSingaPenMember ? clubRole : null;
      profileUpdates.clubJoinedAt = isSingaPenMember && !profile.clubJoinedAt ? new Date().toISOString() : profile.clubJoinedAt;
    } else if (clubRole !== undefined) {
      profileUpdates.clubRole = clubRole || null;
    }

    const updated = Object.keys(profileUpdates).length > 0
      ? await StudentProfiles.findByIdAndUpdate(req.params.studentId, { $set: profileUpdates })
      : profile;

    return res.json({
      success: true,
      message: 'Student profile updated successfully by admin.',
      data: enrichStudentAcademicDetails(updated)
    });
  } catch (error) {
    next(error);
  }
});

// Delete student account entirely
router.delete('/students/:studentId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Delete User record
    await Users.deleteOne({ _id: profile.userId });
    // Delete profile
    await StudentProfiles.deleteOne({ _id: req.params.studentId });
    // Delete all skills
    await Skills.deleteMany({ studentId: profile.userId });

    return res.json({
      success: true,
      message: 'Student account and all associated profile and skill records have been deleted.'
    });
  } catch (error) {
    next(error);
  }
});

// Toggle student account active state
router.patch('/students/:studentId/account-status', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { isActive } = req.body;
    await Users.findByIdAndUpdate(profile.userId, { isActive: !!isActive });

    return res.json({
      success: true,
      message: `Student account has been ${isActive ? 'activated' : 'suspended'} successfully.`
    });
  } catch (error) {
    next(error);
  }
});

// Assign Singa Pen Club Membership details
router.patch('/students/:studentId/membership', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findById(req.params.studentId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { isSingaPenMember, clubRole, achievements } = req.body;

    const updated = await StudentProfiles.findByIdAndUpdate(req.params.studentId, {
      $set: {
        isSingaPenMember: !!isSingaPenMember,
        clubRole: isSingaPenMember ? clubRole : null,
        achievements: achievements || [],
        clubJoinedAt: isSingaPenMember && !profile.clubJoinedAt ? new Date().toISOString() : profile.clubJoinedAt
      }
    });

    return res.json({
      success: true,
      message: 'Singa Pen membership information updated successfully.',
      data: enrichStudentAcademicDetails(updated)
    });
  } catch (error) {
    next(error);
  }
});

// Refresh all academic statuses (triggers a cache calculation / updates the JSON files with new dynamic data)
router.post('/students/refresh-statuses', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const students = await StudentProfiles.find();
    let updatedCount = 0;
    for (const student of students) {
      const enriched = enrichStudentAcademicDetails(student) as any;
      await StudentProfiles.findByIdAndUpdate(student._id!, {
        currentStudyYear: enriched.currentStudyYear,
        academicStatus: enriched.academicStatus
      });
      updatedCount++;
    }
    return res.json({
      success: true,
      message: `Academic statuses successfully refreshed for ${updatedCount} students.`
    });
  } catch (error) {
    next(error);
  }
});

// 3. Faculty Management
router.get('/faculty', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profiles = await FacultyProfiles.find();
    const users = await Users.find({ role: 'FACULTY' });
    const userMap = new Map(users.map(u => [u._id, u]));

    const fullFaculty = profiles.map(p => {
      const u = userMap.get(p.userId);
      return {
        ...p,
        name: u ? u.name : 'Unknown Faculty',
        email: u ? u.email : '',
        isActive: u ? u.isActive : false
      };
    });

    return res.json({
      success: true,
      data: fullFaculty
    });
  } catch (error) {
    next(error);
  }
});

router.post('/faculty', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = FacultyAccountSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const { name, email, staffId, department, designation, phone, password } = parseResult.data;
    const emailLower = email.toLowerCase();
    const idUpper = staffId.toUpperCase().trim();

    // Check duplicate email
    const dupEmail = await Users.findOne({ email: emailLower });
    if (dupEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Check duplicate staff ID
    const dupStaff = await FacultyProfiles.findOne({ staffId: idUpper });
    if (dupStaff) {
      return res.status(400).json({ success: false, message: 'Faculty with this Staff ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Users.create({
      name,
      email: emailLower,
      passwordHash,
      role: 'FACULTY',
      identifier: idUpper,
      isActive: true,
      lastLoginAt: ''
    });

    const profile = await FacultyProfiles.create({
      userId: user._id!,
      staffId: idUpper,
      department,
      designation,
      phone
    });

    return res.status(201).json({
      success: true,
      message: `Faculty account for ${name} created successfully.`,
      data: {
        _id: profile._id,
        userId: user._id,
        name,
        email,
        staffId: idUpper,
        department,
        designation,
        phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/faculty/:facultyId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await FacultyProfiles.findById(req.params.facultyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const { name, email, department, designation, phone, isActive } = req.body;

    // Update User
    await Users.findByIdAndUpdate(profile.userId, { 
      name,
      email: email.toLowerCase(),
      isActive: isActive !== undefined ? !!isActive : true
    });

    // Update Profile
    const updated = await FacultyProfiles.findByIdAndUpdate(req.params.facultyId, {
      $set: {
        department,
        designation,
        phone
      }
    });

    return res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/faculty/:facultyId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await FacultyProfiles.findById(req.params.facultyId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    await Users.deleteOne({ _id: profile.userId });
    await FacultyProfiles.deleteOne({ _id: req.params.facultyId });

    return res.json({
      success: true,
      message: 'Faculty account deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// 4. Scheme Management (Government Schemes CRUD)
router.get('/schemes', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '12', 10), 1), 500);
    const [schemes, savedCounts] = await Promise.all([
      GovernmentSchemes.find(),
      prisma.savedScheme.groupBy({
        by: ['schemeId'],
        _count: { _all: true },
      }),
    ]);
    const savedCountMap = new Map(savedCounts.map(row => [row.schemeId, row._count._all]));
    const enrichedSchemes = schemes.map(scheme => {
      const enriched = enrichSchemeDetails(scheme) as any;
      const schemeId = enriched._id || enriched.id;
      return {
        ...enriched,
        studentEngagementCount: savedCountMap.get(schemeId) || 0,
      };
    });
    const total = enrichedSchemes.length;
    const pageData = enrichedSchemes.slice((page - 1) * limit, page * limit);
    return res.json({
      success: true,
      data: pageData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        featured: enrichedSchemes.filter(scheme => scheme.isFeatured).length,
        active: enrichedSchemes.filter(scheme => scheme.status === 'ACTIVE').length,
        upcoming: enrichedSchemes.filter(scheme => scheme.status === 'UPCOMING').length,
        studentEngagementTotal: enrichedSchemes.reduce((sum, scheme) => sum + Number(scheme.studentEngagementCount || 0), 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/schemes', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = GovernmentSchemeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const data = parseResult.data;
    
    // Auto-generate URL slug: "Naan Mudhalvan Scheme" -> "naan-mudhalvan-scheme"
    const slug = data.title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check duplicate slug
    const dupSlug = await GovernmentSchemes.findOne({ slug });
    let finalSlug = slug;
    if (dupSlug) {
      finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const scheme = await GovernmentSchemes.create({
      ...data,
      slug: finalSlug,
      createdBy: req.user!._id!,
      status: 'ACTIVE' // will be overwritten dynamically by enrichSchemeDetails anyway
    });

    return res.status(201).json({
      success: true,
      message: 'Government scheme created successfully.',
      data: enrichSchemeDetails(scheme)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/schemes/:schemeId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = GovernmentSchemeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const data = parseResult.data;
    const original = await GovernmentSchemes.findById(req.params.schemeId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    // Slug generation on title change
    let slug = original.slug;
    if (original.title !== data.title) {
      slug = data.title.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updated = await GovernmentSchemes.findByIdAndUpdate(req.params.schemeId, {
      $set: {
        ...data,
        slug
      }
    });

    return res.json({
      success: true,
      message: 'Government scheme updated successfully.',
      data: enrichSchemeDetails(updated)
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/schemes/:schemeId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const scheme = await GovernmentSchemes.findById(req.params.schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    await GovernmentSchemes.deleteOne({ _id: req.params.schemeId });

    return res.json({
      success: true,
      message: 'Government scheme deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// 5. Site Content Management
router.get('/site-content', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const contents = await SiteContents.find();
    return res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    next(error);
  }
});

router.put('/site-content/:sectionKey', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { title, content, metadata } = req.body;
    const existing = await SiteContents.findOne({ sectionKey: req.params.sectionKey });

    let updated;
    if (existing) {
      updated = await SiteContents.findByIdAndUpdate(existing._id!, {
        $set: {
          title,
          content,
          metadata: metadata || existing.metadata,
          updatedBy: req.user!._id!
        }
      });
    } else {
      updated = await SiteContents.create({
        sectionKey: req.params.sectionKey,
        title,
        content,
        metadata: metadata || {},
        updatedBy: req.user!._id!
      });
    }

    return res.json({
      success: true,
      message: `Site content for ${req.params.sectionKey} updated successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// --- GALLERY albumS MANAGEMENT ENDPOINTS ---

// Create Album
router.post('/gallery/albums', auth, authorize(['ADMIN']), uploadGallery.single('coverImage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, shortDescription, fullDescription, category, eventDate, venue, organizedBy, isFeatured, isPublished } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required.' });
    }

    const slug = title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const coverFile = req.file as Express.Multer.File | undefined;

    const newAlbum = await GalleryAlbums.create({
      title,
      slug,
      shortDescription: shortDescription || '',
      fullDescription: fullDescription || '',
      category,
      coverImage: coverFile ? `/uploads/gallery/covers/${coverFile.filename}` : '',
      eventDate: eventDate || '',
      venue: venue || '',
      organizedBy: organizedBy || '',
      isFeatured: isFeatured === true || isFeatured === 'true',
      isPublished: isPublished === true || isPublished === 'true',
      createdBy: req.user!._id!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Gallery album created successfully.',
      data: newAlbum
    });
  } catch (error) {
    next(error);
  }
});

// List Albums
router.get('/gallery/albums', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await GalleryAlbums.find();
    
    const populated = await Promise.all(list.map(async (album) => {
      const images = await GalleryImages.find({ albumId: album._id });
      return {
        ...album,
        photoCount: images.length,
        coverImage: album.coverImage || (images.length > 0 ? images[0].imageUrl : '')
      };
    }));

    populated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
});

// Get Album Details
router.get('/gallery/albums/:albumId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const album = await GalleryAlbums.findById(req.params.albumId);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found.' });
    }
    const images = await GalleryImages.find({ albumId: album._id });
    images.sort((a, b) => a.displayOrder - b.displayOrder);

    return res.json({
      success: true,
      data: {
        ...album,
        images
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update Album
router.put('/gallery/albums/:albumId', auth, authorize(['ADMIN']), uploadGallery.single('coverImage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, shortDescription, fullDescription, category, eventDate, venue, organizedBy, isFeatured, isPublished, coverImage } = req.body;
    const album = await GalleryAlbums.findById(req.params.albumId);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found.' });
    }

    const slug = title ? title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') : album.slug;

    const coverFile = req.file as Express.Multer.File | undefined;
    if (coverFile && album.coverImage) {
      const oldPath = path.join(process.cwd(), album.coverImage.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await GalleryAlbums.findByIdAndUpdate(req.params.albumId, {
      title: title || album.title,
      slug,
      shortDescription: shortDescription !== undefined ? shortDescription : album.shortDescription,
      fullDescription: fullDescription !== undefined ? fullDescription : album.fullDescription,
      category: category || album.category,
      eventDate: eventDate !== undefined ? eventDate : album.eventDate,
      venue: venue !== undefined ? venue : album.venue,
      organizedBy: organizedBy !== undefined ? organizedBy : album.organizedBy,
      isFeatured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : album.isFeatured,
      isPublished: isPublished !== undefined ? (isPublished === true || isPublished === 'true') : album.isPublished,
      coverImage: coverFile ? `/uploads/gallery/covers/${coverFile.filename}` : (coverImage !== undefined ? coverImage : album.coverImage),
      updatedAt: new Date().toISOString()
    });

    const updated = await GalleryAlbums.findById(req.params.albumId);

    return res.json({
      success: true,
      message: 'Album updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// Delete Album
router.delete('/gallery/albums/:albumId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const album = await GalleryAlbums.findById(req.params.albumId);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found.' });
    }

    // Delete all images in album
    const images = await GalleryImages.find({ albumId: album._id });
    for (const image of images) {
      const filePath = path.join(process.cwd(), image.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await GalleryImages.deleteOne({ _id: image._id });
    }

    await GalleryAlbums.deleteOne({ _id: req.params.albumId });

    return res.json({
      success: true,
      message: 'Album and all its associated photos deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// Upload Multiple Images to Album
const maxGalleryPerUpload = Number(process.env.MAX_GALLERY_IMAGES_PER_UPLOAD || 20);
router.post('/gallery/albums/:albumId/images', auth, authorize(['ADMIN']), uploadGallery.array('photos', maxGalleryPerUpload), async (req: AuthenticatedRequest, res, next) => {
  try {
    const album = await GalleryAlbums.findById(req.params.albumId);
    if (!album) {
      return res.status(404).json({ success: false, message: 'Album not found.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos uploaded.' });
    }

    // Get current max displayOrder
    const existingImages = await GalleryImages.find({ albumId: album._id });
    let maxOrder = existingImages.reduce((max, img) => Math.max(max, img.displayOrder || 0), 0);

    const createdImages = [];
    for (const file of files) {
      maxOrder += 1;
      const imageUrl = `/uploads/gallery/images/${file.filename}`;
      const img = await GalleryImages.create({
        albumId: album._id!,
        imageUrl,
        displayOrder: maxOrder,
        isFeatured: false,
        uploadedBy: req.user!._id!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      createdImages.push(img);
    }

    // Update album cover if it has none
    if (!album.coverImage && createdImages.length > 0) {
      await GalleryAlbums.findByIdAndUpdate(album._id!, { coverImage: createdImages[0].imageUrl });
    }

    return res.status(201).json({
      success: true,
      message: `${createdImages.length} photo(s) uploaded successfully to album.`,
      data: createdImages
    });
  } catch (error) {
    next(error);
  }
});

// Update Image Details (displayOrder, caption, or set cover)
router.put('/gallery/images/:imageId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { caption, altText, displayOrder, isFeatured, setAsCover } = req.body;
    const image = await GalleryImages.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    await GalleryImages.findByIdAndUpdate(req.params.imageId, {
      caption: caption !== undefined ? caption : image.caption,
      altText: altText !== undefined ? altText : image.altText,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : image.displayOrder,
      isFeatured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : image.isFeatured,
      updatedAt: new Date().toISOString()
    });

    if (setAsCover) {
      await GalleryAlbums.findByIdAndUpdate(image.albumId, { coverImage: image.imageUrl });
    }

    const updated = await GalleryImages.findById(req.params.imageId);

    return res.json({
      success: true,
      message: 'Photo details updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// Delete Single Image
router.delete('/gallery/images/:imageId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const image = await GalleryImages.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    const filePath = path.join(process.cwd(), image.imageUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await GalleryImages.deleteOne({ _id: req.params.imageId });

    // Check if it was the album cover image and clear or update if needed
    const album = await GalleryAlbums.findById(image.albumId);
    if (album && album.coverImage === image.imageUrl) {
      const remaining = await GalleryImages.find({ albumId: album._id });
      const nextCover = remaining.length > 0 ? remaining[0].imageUrl : '';
      await GalleryAlbums.findByIdAndUpdate(album._id!, { coverImage: nextCover });
    }

    return res.json({
      success: true,
      message: 'Photo deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// --- ACHIEVEMENTS MANAGEMENT ENDPOINTS ---

// Create Achievement
router.post('/achievements', auth, authorize(['ADMIN']), uploadAchievementFiles.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, achievementType, studentId, memberName, department, eventName, achievementDate, level, position, isFeatured, isPublic } = req.body;
    if (!title || !description || !achievementType || !level) {
      return res.status(400).json({ success: false, message: 'Title, description, type, and level are required.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let imagePath = '';
    let certPath = '';

    if (files && files['image'] && files['image'][0]) {
      imagePath = `/uploads/achievements/images/${files['image'][0].filename}`;
    }
    if (files && files['certificate'] && files['certificate'][0]) {
      certPath = `/uploads/achievements/certificates/${files['certificate'][0].filename}`;
    }

    const newAch = await Achievements.create({
      title,
      description,
      achievementType,
      studentId: studentId || undefined,
      memberName: memberName || '',
      department: department || '',
      eventName: eventName || '',
      achievementDate: achievementDate || '',
      level,
      position: position || '',
      image: imagePath,
      certificate: certPath,
      isFeatured: isFeatured === true || isFeatured === 'true',
      isPublic: isPublic === true || isPublic === 'true',
      createdBy: req.user!._id!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Achievement recorded successfully.',
      data: newAch
    });
  } catch (error) {
    next(error);
  }
});

// List All Achievements
router.get('/achievements', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await Achievements.find();

    // Populate student user details
    const students = await StudentProfiles.find();
    const studentMap = new Map(students.map(s => [s.userId, s]));

    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(u => [u._id, u]));

    const populated = list.map(ach => {
      let studentName = ach.memberName || 'Student Achiever';
      let dept = ach.department || 'N/A';

      if (ach.studentId) {
        const student = studentMap.get(ach.studentId);
        const user = userMap.get(ach.studentId);
        if (user) studentName = user.name;
        if (student) dept = student.department;
      }

      return {
        ...ach,
        studentName,
        department: dept
      };
    });

    populated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
});

// Get Single Achievement
router.get('/achievements/:achievementId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const ach = await Achievements.findById(req.params.achievementId);
    if (!ach) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }
    return res.json({ success: true, data: ach });
  } catch (error) {
    next(error);
  }
});

// Update Achievement
router.put('/achievements/:achievementId', auth, authorize(['ADMIN']), uploadAchievementFiles.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req: AuthenticatedRequest, res, next) => {
  try {
    const ach = await Achievements.findById(req.params.achievementId);
    if (!ach) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    const { title, description, achievementType, studentId, memberName, department, eventName, achievementDate, level, position, isFeatured, isPublic } = req.body;
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let imagePath = ach.image;
    let certPath = ach.certificate;

    if (files && files['image'] && files['image'][0]) {
      // Unlink old image if any
      if (ach.image) {
        const oldPath = path.join(process.cwd(), ach.image.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = `/uploads/achievements/images/${files['image'][0].filename}`;
    }

    if (files && files['certificate'] && files['certificate'][0]) {
      // Unlink old cert if any
      if (ach.certificate) {
        const oldPath = path.join(process.cwd(), ach.certificate.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      certPath = `/uploads/achievements/certificates/${files['certificate'][0].filename}`;
    }

    await Achievements.findByIdAndUpdate(req.params.achievementId, {
      title: title !== undefined ? title : ach.title,
      description: description !== undefined ? description : ach.description,
      achievementType: achievementType !== undefined ? achievementType : ach.achievementType,
      studentId: studentId !== undefined ? (studentId || undefined) : ach.studentId,
      memberName: memberName !== undefined ? memberName : ach.memberName,
      department: department !== undefined ? department : ach.department,
      eventName: eventName !== undefined ? eventName : ach.eventName,
      achievementDate: achievementDate !== undefined ? achievementDate : ach.achievementDate,
      level: level !== undefined ? level : ach.level,
      position: position !== undefined ? position : ach.position,
      image: imagePath,
      certificate: certPath,
      isFeatured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : ach.isFeatured,
      isPublic: isPublic !== undefined ? (isPublic === true || isPublic === 'true') : ach.isPublic,
      updatedAt: new Date().toISOString()
    });

    const updated = await Achievements.findById(req.params.achievementId);

    return res.json({
      success: true,
      message: 'Achievement updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// Delete Achievement
router.delete('/achievements/:achievementId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const ach = await Achievements.findById(req.params.achievementId);
    if (!ach) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    // Delete files
    if (ach.image) {
      const filePath = path.join(process.cwd(), ach.image.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (ach.certificate) {
      const filePath = path.join(process.cwd(), ach.certificate.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Achievements.deleteOne({ _id: req.params.achievementId });

    return res.json({
      success: true,
      message: 'Achievement deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// --- ICC COMPLAINT MANAGEMENT ENDPOINTS ---

router.get('/icc/complaints', auth, authorize(['ICC_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string;
    const urgency = req.query.urgency as string;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10', 10), 1), 50);

    const where: any = {};
    if (status && complaintStatuses.includes(status as any)) where.status = status;
    if (urgency && ['NORMAL', 'URGENT', 'EMERGENCY'].includes(urgency)) where.urgency = urgency;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, complaints] = await Promise.all([
      prisma.iccComplaint.count({ where }),
      prisma.iccComplaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          referenceNumber: true,
          category: true,
          urgency: true,
          status: true,
          subject: true,
          createdAt: true,
          updatedAt: true,
          assignedAdmin: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: complaints.map(serializeIccComplaint),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/icc/complaints/:complaintId', auth, authorize(['ICC_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const complaint = await prisma.iccComplaint.findUnique({
      where: { id: req.params.complaintId },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, identifier: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'ICC complaint not found.' });
    }
    return res.json({ success: true, data: serializeIccComplaint(complaint) });
  } catch (error) {
    next(error);
  }
});

router.patch('/icc/complaints/:complaintId/status', auth, authorize(['ICC_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const status = req.body.status as string;
    if (!complaintStatuses.includes(status as any)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint status.' });
    }
    const updated = await prisma.iccComplaint.update({
      where: { id: req.params.complaintId },
      data: {
        status: status as any,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : null,
      },
    });
    return res.json({ success: true, message: 'Complaint status updated.', data: serializeIccComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/icc/complaints/:complaintId/assign', auth, authorize(['ICC_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const assignedAdminId = req.body.assignedAdminId || req.user!._id;
    const admin = await prisma.user.findFirst({ where: { id: assignedAdminId, role: 'ICC_ADMIN', isActive: true } });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Active administrator not found.' });
    }
    const updated = await prisma.iccComplaint.update({
      where: { id: req.params.complaintId },
      data: { assignedAdminId, status: 'ASSIGNED' },
      include: { assignedAdmin: { select: { id: true, name: true, email: true } } },
    });
    return res.json({ success: true, message: 'Complaint assigned.', data: serializeIccComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

router.put('/icc/complaints/:complaintId/notes', auth, authorize(['ICC_ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const adminNotes = String(req.body.adminNotes || '').slice(0, 5000);
    const updated = await prisma.iccComplaint.update({
      where: { id: req.params.complaintId },
      data: { adminNotes },
    });
    return res.json({ success: true, message: 'Internal notes updated.', data: serializeIccComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

const parseDate = (value?: string | null) => value ? new Date(value.includes('T') ? value : `${value}T23:59:59.000Z`) : null;

const serializeSkillRequest = (request: any) => ({
  ...request,
  _id: request.id,
  matchingStudentCount: request.recipients?.length ?? request._count?.recipients ?? 0,
  interestedCount: request.recipients?.filter?.((recipient: any) => recipient.responseStatus === 'INTERESTED').length ?? 0,
  withdrawnCount: request.recipients?.filter?.((recipient: any) => recipient.responseStatus === 'WITHDRAWN').length ?? 0,
});

router.post('/skill-requests/preview-matches', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = SkillRequestPreviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    }
    const matches = await findMatchingStudents(parsed.data);
    return res.json({ success: true, data: matches.students, meta: matches.meta });
  } catch (error) {
    next(error);
  }
});

router.get('/skill-requests', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const search = String(req.query.search || '').trim();
    const status = req.query.status as string;
    const skill = String(req.query.skill || '').trim();
    const deadline = req.query.deadline as string;
    const where: any = {};
    if (status) where.status = status;
    if (skill) where.requiredSkills = { has: skill };
    if (deadline) where.deadline = { lte: parseDate(deadline) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { eventOrProjectName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, requests] = await Promise.all([
      prisma.skillRequest.count({ where }),
      prisma.skillRequest.findMany({
        where,
        include: { recipients: { select: { responseStatus: true } }, _count: { select: { recipients: true } } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({ success: true, data: requests.map(serializeSkillRequest), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.post('/skill-requests', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = SkillRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const created = await prisma.skillRequest.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        requiredSkills: data.requiredSkills.map(skill => skill.trim()).filter(Boolean),
        preferredSkillLevel: data.preferredSkillLevel || null,
        department: data.department || null,
        requestType: data.requestType,
        eventOrProjectName: data.eventOrProjectName || null,
        requiredStudentCount: data.requiredStudentCount || null,
        deadline: parseDate(data.deadline),
        contactPerson: data.contactPerson || null,
        contactInformation: data.contactInformation || null,
        status: 'DRAFT',
        isPublished: false,
        createdById: req.user!._id!,
      },
    });
    return res.status(201).json({ success: true, message: 'Skill request draft created.', data: serializeSkillRequest(created) });
  } catch (error) {
    next(error);
  }
});

router.get('/skill-requests/:requestId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const request = await prisma.skillRequest.findUnique({
      where: { id: req.params.requestId },
      include: { recipients: { include: { student: { include: { user: { select: { name: true, email: true } }, skills: true } } } } },
    });
    if (!request) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    return res.json({ success: true, data: serializeSkillRequest(request) });
  } catch (error) {
    next(error);
  }
});

router.put('/skill-requests/:requestId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.skillRequest.findUnique({ where: { id: req.params.requestId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    if (existing.status === 'OPEN') return res.status(400).json({ success: false, message: 'Open requests can be closed or cancelled, not edited.' });
    const parsed = SkillRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const updated = await prisma.skillRequest.update({
      where: { id: req.params.requestId },
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        requiredSkills: data.requiredSkills.map(skill => skill.trim()).filter(Boolean),
        preferredSkillLevel: data.preferredSkillLevel || null,
        department: data.department || null,
        requestType: data.requestType,
        eventOrProjectName: data.eventOrProjectName || null,
        requiredStudentCount: data.requiredStudentCount || null,
        deadline: parseDate(data.deadline),
        contactPerson: data.contactPerson || null,
        contactInformation: data.contactInformation || null,
      },
    });
    return res.json({ success: true, message: 'Skill request updated.', data: serializeSkillRequest(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/skill-requests/:requestId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.skillRequest.findUnique({ where: { id: req.params.requestId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    if (existing.status !== 'DRAFT') return res.status(400).json({ success: false, message: 'Only draft requests can be deleted.' });
    await prisma.skillRequest.delete({ where: { id: req.params.requestId } });
    return res.json({ success: true, message: 'Draft skill request deleted.' });
  } catch (error) {
    next(error);
  }
});

router.patch('/skill-requests/:requestId/publish', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const request = await prisma.skillRequest.findUnique({ where: { id: req.params.requestId } });
    if (!request) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    const { students } = await findMatchingStudents({
      requiredSkills: request.requiredSkills,
      preferredSkillLevel: request.preferredSkillLevel,
      department: request.department,
      limit: 50,
    });
    const published = await prisma.$transaction(async (tx) => {
      const updated = await tx.skillRequest.update({
        where: { id: request.id },
        data: { status: 'OPEN', isPublished: true },
      });
      for (const student of students) {
        await tx.skillRequestRecipient.upsert({
          where: { skillRequestId_studentId: { skillRequestId: request.id, studentId: student.id } },
          update: { matchedSkills: student.matchedSkills, matchReasons: student.matchReasons, matchScore: student.matchScore },
          create: {
            skillRequestId: request.id,
            studentId: student.id,
            matchedSkills: student.matchedSkills,
            matchReasons: student.matchReasons,
            matchScore: student.matchScore,
          },
        });
        await tx.notification.upsert({
          where: { id: `notif-${request.id}-${student.userId}` },
          update: {},
          create: {
            id: `notif-${request.id}-${student.userId}`,
            userId: student.userId,
            type: 'SKILL_REQUEST',
            title: request.title,
            message: `You match a new Singa Pen skill opportunity for ${request.requiredSkills.join(', ')}.`,
            link: '/student/skill-requests',
          },
        });
      }
      return updated;
    });
    return res.json({ success: true, message: 'Skill request published and students notified.', data: serializeSkillRequest(published), meta: { recipientsCreated: students.length } });
  } catch (error) {
    next(error);
  }
});

router.patch('/skill-requests/:requestId/close', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await prisma.skillRequest.update({ where: { id: req.params.requestId }, data: { status: 'CLOSED', isPublished: true } });
    return res.json({ success: true, message: 'Skill request closed.', data: serializeSkillRequest(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/skill-requests/:requestId/cancel', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await prisma.skillRequest.update({ where: { id: req.params.requestId }, data: { status: 'CANCELLED', isPublished: false } });
    return res.json({ success: true, message: 'Skill request cancelled.', data: serializeSkillRequest(updated) });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const where = { userId: req.user!._id! };
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      success: true,
      data: notifications.map(notification => ({ ...notification, _id: notification.id })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications/unread-count', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!._id!, isRead: false } });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:notificationId/read', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: req.params.notificationId, userId: req.user!._id! } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/read-all', auth, authorize(['ADMIN', 'ICC_ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!._id!, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

router.get('/skill-requests/:requestId/matches', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const request = await prisma.skillRequest.findUnique({ where: { id: req.params.requestId } });
    if (!request) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    const matches = await findMatchingStudents({
      requiredSkills: request.requiredSkills,
      preferredSkillLevel: request.preferredSkillLevel,
      department: request.department,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });
    return res.json({ success: true, data: matches.students, meta: matches.meta });
  } catch (error) {
    next(error);
  }
});

router.get('/workshops', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const [total, workshops] = await Promise.all([
      prisma.workshop.count(),
      prisma.workshop.findMany({
        include: { participations: true },
        orderBy: { startDateTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({ success: true, data: workshops.map(serializeWorkshop), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.post('/workshops', auth, authorize(['ADMIN']), uploadWorkshopPoster.single('poster'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = {
      ...req.body,
      maximumParticipants: req.body.maximumParticipants ? Number(req.body.maximumParticipants) : undefined,
      isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      isPublished: req.body.isPublished === true || req.body.isPublished === 'true',
    };
    const parsed = WorkshopSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
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
        createdById: req.user!._id!,
      },
      include: { participations: true },
    });
    return res.status(201).json({ success: true, message: 'Workshop created.', data: serializeWorkshop(created) });
  } catch (error) {
    next(error);
  }
});

router.put('/workshops/:workshopId', auth, authorize(['ADMIN']), uploadWorkshopPoster.single('poster'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.workshop.findUnique({ where: { id: req.params.workshopId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Workshop not found.' });
    const body = {
      ...req.body,
      maximumParticipants: req.body.maximumParticipants ? Number(req.body.maximumParticipants) : undefined,
      isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      isPublished: req.body.isPublished === true || req.body.isPublished === 'true',
    };
    const parsed = WorkshopSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const updated = await prisma.workshop.update({
      where: { id: req.params.workshopId },
      data: {
        ...data,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        posterImage: req.file ? `/uploads/gallery/images/${req.file.filename}` : data.posterImage || existing.posterImage,
        registrationUrl: data.registrationUrl || null,
        targetAudience: data.targetAudience || null,
        maximumParticipants: data.maximumParticipants || null,
        galleryAlbumId: data.galleryAlbumId || null,
      },
      include: { participations: true },
    });
    return res.json({ success: true, message: 'Workshop updated.', data: serializeWorkshop(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/workshops/:workshopId/publish', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const workshop = await prisma.workshop.update({ where: { id: req.params.workshopId }, data: { isPublished: true }, include: { participations: true } });
    const students = await prisma.studentProfile.findMany({ where: { user: { role: 'STUDENT', isActive: true } }, include: { user: true } });
    await prisma.$transaction(students.map(student => prisma.notification.upsert({
      where: { id: `notif-workshop-${workshop.id}-${student.userId}` },
      update: {},
      create: {
        id: `notif-workshop-${workshop.id}-${student.userId}`,
        userId: student.userId,
        type: 'WORKSHOP',
        title: workshop.title,
        message: `Workshop at ${workshop.venue} on ${workshop.startDateTime.toLocaleDateString()} is open.`,
        link: `/student/workshops`,
      },
    })));
    return res.json({ success: true, message: 'Workshop published and students notified.', data: serializeWorkshop(workshop) });
  } catch (error) {
    next(error);
  }
});

router.patch('/workshops/:workshopId/cancel', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await prisma.workshop.update({ where: { id: req.params.workshopId }, data: { isCancelled: true }, include: { participations: true } });
    return res.json({ success: true, message: 'Workshop cancelled.', data: serializeWorkshop(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch('/workshops/:workshopId/complete', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await prisma.workshop.update({ where: { id: req.params.workshopId }, data: { isCompleted: true }, include: { participations: true } });
    return res.json({ success: true, message: 'Workshop completed.', data: serializeWorkshop(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/workshops/:workshopId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await prisma.workshop.findUnique({ where: { id: req.params.workshopId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Workshop not found.' });
    await prisma.workshop.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Workshop and its registrations deleted.' });
  } catch (error) {
    next(error);
  }
});

router.get('/workshops/:workshopId/registrations', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const status = String(req.query.status || '');
    const department = String(req.query.department || '');
    const search = String(req.query.search || '').trim();

    const workshop = await prisma.workshop.findUnique({ where: { id: req.params.workshopId } });
    if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not found.' });

    const where: any = {
      workshopId: workshop.id,
      ...(status ? { status } : {}),
      ...(department ? { student: { department } } : {}),
      ...(search
        ? {
            OR: [
              { student: { registerNumber: { contains: search, mode: 'insensitive' } } },
              { student: { department: { contains: search, mode: 'insensitive' } } },
              { student: { course: { contains: search, mode: 'insensitive' } } },
              { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
              { student: { user: { email: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [total, rows, departments] = await Promise.all([
      prisma.workshopParticipation.count({ where }),
      prisma.workshopParticipation.findMany({
        where,
        include: { student: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workshopParticipation.findMany({
        where: { workshopId: workshop.id },
        select: { student: { select: { department: true } } },
        distinct: ['studentId'],
      }),
    ]);

    return res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        _id: row.id,
        student: {
          ...row.student,
          _id: row.student.id,
          name: row.student.user.name,
          email: row.student.user.email,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        workshop: { ...workshop, _id: workshop.id, status: serializeWorkshop({ ...workshop, participations: [] }).status },
        departments: Array.from(new Set(departments.map(row => row.student.department))).filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/workshop-registrations', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const status = String(req.query.status || '');
    const search = String(req.query.search || '').trim();
    const where: any = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { workshop: { title: { contains: search, mode: 'insensitive' } } },
          { student: { registerNumber: { contains: search, mode: 'insensitive' } } },
          { student: { department: { contains: search, mode: 'insensitive' } } },
          { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.workshopParticipation.count({ where }),
      prisma.workshopParticipation.findMany({
        where,
        include: {
          workshop: { select: { id: true, title: true, startDateTime: true, venue: true } },
          student: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        _id: row.id,
        workshop: { ...row.workshop, _id: row.workshop.id },
        student: { ...row.student, _id: row.student.id, name: row.student.user.name, email: row.student.user.email },
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/workshop-certificates', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res, next) => {
  try {
    const rows = await prisma.workshopParticipation.findMany({
      where: { status: 'ATTENDED' },
      include: {
        workshop: { select: { id: true, title: true, startDateTime: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: [{ certificateIssuedAt: 'asc' }, { updatedAt: 'desc' }],
      take: 100,
    });
    return res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        _id: row.id,
        workshop: { ...row.workshop, _id: row.workshop.id },
        student: { ...row.student, _id: row.student.id, name: row.student.user.name, email: row.student.user.email },
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alumni', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const students = (await StudentProfiles.find()).map(enrichStudentAcademicDetails).filter(Boolean) as any[];
    const alumniProfiles = students.filter(student => student.academicStatus === 'PASSED_OUT');
    const users = await Users.find({ role: 'STUDENT' });
    const userMap = new Map(users.map(user => [user._id, user]));
    const rows = alumniProfiles.map(profile => {
      const account = userMap.get(profile.userId);
      return { ...profile, name: account?.name || 'Unknown Student', email: account?.email || '', isActive: account?.isActive || false };
    }).filter(row => !search || row.name.toLowerCase().includes(search) || row.registerNumber.toLowerCase().includes(search) || row.department.toLowerCase().includes(search));
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/opportunities', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const status = String(req.query.status || '');
    const search = String(req.query.search || '').trim();
    const where: any = {
      ...(status ? { status } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { requiredSkills: { has: search } },
      ] } : {}),
    };
    const rows = await prisma.jobOpportunity.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return res.json({ success: true, data: rows.map(row => ({ ...row, _id: row.id })) });
  } catch (error) {
    next(error);
  }
});

router.post('/opportunities', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = JobOpportunitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const created = await prisma.jobOpportunity.create({
      data: {
        ...data,
        location: data.location || null,
        applicationDeadline: parseDate(data.applicationDeadline),
        createdById: req.user!._id!,
      },
    });
    return res.status(201).json({ success: true, message: 'Opportunity saved.', data: { ...created, _id: created.id } });
  } catch (error) {
    next(error);
  }
});

router.put('/opportunities/:opportunityId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = JobOpportunitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const updated = await prisma.jobOpportunity.update({
      where: { id: req.params.opportunityId },
      data: { ...data, location: data.location || null, applicationDeadline: parseDate(data.applicationDeadline) },
    });
    return res.json({ success: true, message: 'Opportunity updated.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.delete('/opportunities/:opportunityId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.jobOpportunity.delete({ where: { id: req.params.opportunityId } });
    return res.json({ success: true, message: 'Opportunity deleted.' });
  } catch (error) {
    next(error);
  }
});

router.get('/safety-directory', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const active = req.query.active === undefined ? undefined : req.query.active === 'true';
    const where = active === undefined ? {} : { isActive: active };
    const rows = await prisma.safetySupportContact.findMany({ where, orderBy: [{ isActive: 'desc' }, { category: 'asc' }, { name: 'asc' }] });
    return res.json({ success: true, data: rows.map(row => ({ ...row, _id: row.id })) });
  } catch (error) {
    next(error);
  }
});

router.post('/safety-directory', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = SafetySupportContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const created = await prisma.safetySupportContact.create({
      data: { ...data, email: data.email || null, verifiedDate: parseDate(data.verifiedDate), createdById: req.user!._id! },
    });
    return res.status(201).json({ success: true, message: 'Support contact saved.', data: { ...created, _id: created.id } });
  } catch (error) {
    next(error);
  }
});

router.put('/safety-directory/:contactId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = SafetySupportContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const data = parsed.data;
    const updated = await prisma.safetySupportContact.update({
      where: { id: req.params.contactId },
      data: { ...data, email: data.email || null, verifiedDate: parseDate(data.verifiedDate) },
    });
    return res.json({ success: true, message: 'Support contact updated.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.delete('/safety-directory/:contactId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.safetySupportContact.delete({ where: { id: req.params.contactId } });
    return res.json({ success: true, message: 'Support contact deleted.' });
  } catch (error) {
    next(error);
  }
});


router.get('/report-documents', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res, next) => {
  try {
    const record = await prisma.siteContent.findUnique({ where: { sectionKey: 'admin-report-documents' } });
    const documents = Array.isArray((record?.metadata as any)?.documents) ? (record?.metadata as any).documents : [];
    return res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
});

router.post('/report-documents', auth, authorize(['ADMIN']), uploadReportDocument.single('report'), async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Select a PDF report to upload.' });
    const title = String(req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).trim().slice(0, 120);
    if (!title) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(400).json({ success: false, message: 'Report title is required.' });
    }

    const current = await prisma.siteContent.findUnique({ where: { sectionKey: 'admin-report-documents' } });
    const previous = Array.isArray((current?.metadata as any)?.documents) ? (current?.metadata as any).documents : [];
    const document = {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      fileName: req.file.originalname,
      fileNameOnDisk: req.file.filename,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user!._id!,
    };
    const documents = [document, ...previous].slice(0, 100);

    await prisma.siteContent.upsert({
      where: { sectionKey: 'admin-report-documents' },
      update: {
        content: 'Admin report document registry',
        metadata: { documents },
        updatedById: req.user!._id!,
      },
      create: {
        sectionKey: 'admin-report-documents',
        title: 'Admin Report Documents',
        content: 'Admin report document registry',
        metadata: { documents },
        updatedById: req.user!._id!,
      },
    });

    return res.status(201).json({ success: true, message: 'Report uploaded.', data: document });
  } catch (error) {
    next(error);
  }
});


router.get('/report-documents/:documentId/download', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const current = await prisma.siteContent.findUnique({ where: { sectionKey: 'admin-report-documents' } });
    const documents = Array.isArray((current?.metadata as any)?.documents) ? (current?.metadata as any).documents : [];
    const document = documents.find((item: any) => item.id === req.params.documentId);
    if (!document?.fileNameOnDisk) return res.status(404).json({ success: false, message: 'Report document not found.' });

    const filePath = path.join(process.cwd(), 'uploads', 'private', 'reports', path.basename(String(document.fileNameOnDisk)));
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Report file is unavailable.' });

    return res.download(filePath, String(document.fileName || 'report.pdf'));
  } catch (error) {
    next(error);
  }
});

router.delete('/report-documents/:documentId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const current = await prisma.siteContent.findUnique({ where: { sectionKey: 'admin-report-documents' } });
    const previous = Array.isArray((current?.metadata as any)?.documents) ? (current?.metadata as any).documents : [];
    const document = previous.find((item: any) => item.id === req.params.documentId);
    if (!document) return res.status(404).json({ success: false, message: 'Report document not found.' });

    const documents = previous.filter((item: any) => item.id !== req.params.documentId);
    await prisma.siteContent.update({
      where: { sectionKey: 'admin-report-documents' },
      data: { metadata: { documents }, updatedById: req.user!._id! },
    });

    if (document.fileNameOnDisk) {
      const fileName = path.basename(String(document.fileNameOnDisk));
      fs.rmSync(path.join(process.cwd(), 'uploads', 'private', 'reports', fileName), { force: true });
    }

    return res.json({ success: true, message: 'Report document removed.' });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', auth, authorize(['ADMIN']), async (_req: AuthenticatedRequest, res, next) => {
  try {
    const [
      departments,
      workshops,
      skillRequests,
      schemes,
      achievements,
      galleryAlbums,
      registrations,
      attendance,
      savedSchemes,
      pendingIccCases,
    ] = await Promise.all([
      prisma.studentProfile.findMany({ select: { department: true, course: true, courseDurationYears: true } }),
      prisma.workshop.count(),
      prisma.skillRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.governmentScheme.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.achievement.count(),
      prisma.galleryAlbum.count(),
      prisma.workshopParticipation.count({ where: { status: { in: ['REGISTERED', 'ATTENDED'] } } }),
      prisma.workshopParticipation.count({ where: { status: 'ATTENDED' } }),
      prisma.savedScheme.count(),
      prisma.iccComplaint.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'] } } }),
    ]);
    return res.json({
      success: true,
      data: {
        departments: Object.values(
          departments.reduce<Record<string, { label: string; count: number; ug: number; pg: number }>>((map, row) => {
            const rawDepartment = String(row.department || 'Unspecified').trim() || 'Unspecified';
            const existingKey = Object.keys(map).find((key) => key.toLowerCase() === rawDepartment.toLowerCase());
            const key = existingKey || rawDepartment;
            const current = map[key] || { label: key, count: 0, ug: 0, pg: 0 };
            const level = classifyProgramLevel(row.course, row.courseDurationYears);

            current.count += 1;
            if (level === 'PG') current.pg += 1;
            else current.ug += 1;

            map[key] = current;
            return map;
          }, {}),
        ).sort((a, b) => b.count - a.count),
        workshops,
        registrations,
        attendance,
        skillRequests: skillRequests.map(row => ({ label: row.status, count: row._count._all })),
        schemes: schemes.map(row => ({ label: row.status, count: row._count._all })),
        achievements,
        galleryAlbums,
        savedSchemes,
        pendingIccCases,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/role-updates', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
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
      take: 150,
    });
    const summaryRows = await prisma.studentRoleUpdate.groupBy({ by: ['status'], _count: { _all: true } });
    const summary = {
      submitted: summaryRows.find(row => row.status === 'SUBMITTED')?._count._all || 0,
      reviewed: summaryRows.find(row => row.status === 'REVIEWED')?._count._all || 0,
      followUpRequired: summaryRows.find(row => row.status === 'FOLLOW_UP_REQUIRED')?._count._all || 0,
      completed: summaryRows.find(row => row.status === 'COMPLETED')?._count._all || 0,
    };

    return res.json({ success: true, data: { updates: updates.map(serializeRoleUpdate), summary } });
  } catch (error) {
    next(error);
  }
});

router.patch('/role-updates/:updateId/status', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response, next) => {
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

router.patch('/workshops/:workshopId/registrations/:registrationId', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = WorkshopParticipationAdminSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid registration status.', errors: parsed.error.issues });
    const status = parsed.data.status;
    const existing = await prisma.workshopParticipation.findFirst({
      where: { id: req.params.registrationId, workshopId: req.params.workshopId },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Registration not found.' });
    const updated = await prisma.workshopParticipation.update({
      where: { id: existing.id },
      data: { status, attendanceMarkedAt: status === 'ATTENDED' ? new Date() : existing.attendanceMarkedAt },
    });
    return res.json({ success: true, message: 'Registration status updated.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.patch('/workshops/:workshopId/registrations/:registrationId/certificate', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = WorkshopCertificateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues });
    const existing = await prisma.workshopParticipation.findFirst({
      where: { id: req.params.registrationId, workshopId: req.params.workshopId },
      include: { student: { include: { user: { select: { id: true } } } }, workshop: { select: { title: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Registration not found.' });
    if (parsed.data.action === 'ISSUE' && existing.status !== 'ATTENDED') {
      return res.status(400).json({ success: false, message: 'Only attended students are eligible for certificates.' });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.workshopParticipation.update({
        where: { id: existing.id },
        data: parsed.data.action === 'REVOKE'
          ? { certificateRevokedAt: new Date(), certificateIssuedAt: null, certificateUrl: null }
          : { certificateIssuedAt: new Date(), certificateRevokedAt: null, certificateUrl: parsed.data.certificateUrl || null },
      });
      if (parsed.data.action === 'ISSUE') {
        await tx.notification.create({
          data: {
            userId: existing.student.user.id,
            type: 'WORKSHOP',
            title: 'Workshop certificate issued',
            message: `Your certificate for ${existing.workshop.title} has been marked as issued.`,
            link: '/student/workshops',
          },
        });
      }
      return row;
    });
    return res.json({ success: true, message: parsed.data.action === 'REVOKE' ? 'Certificate revoked.' : 'Certificate issued.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.get('/workshops/:workshopId/students', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const rows = await prisma.workshopParticipation.findMany({
      where: { workshopId: req.params.workshopId },
      include: { student: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ success: true, data: rows.map(row => ({ ...row, _id: row.id, student: { ...row.student, name: row.student.user.name, email: row.student.user.email } })) });
  } catch (error) {
    next(error);
  }
});

router.patch('/workshops/:workshopId/students/:studentId/attendance', auth, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const status = req.body.status === 'ATTENDED' ? 'ATTENDED' : 'REGISTERED';
    const updated = await prisma.workshopParticipation.upsert({
      where: { workshopId_studentId: { workshopId: req.params.workshopId, studentId: req.params.studentId } },
      update: { status, attendanceMarkedAt: status === 'ATTENDED' ? new Date() : null },
      create: { workshopId: req.params.workshopId, studentId: req.params.studentId, status, attendanceMarkedAt: status === 'ATTENDED' ? new Date() : null },
    });
    return res.json({ success: true, message: 'Workshop attendance updated.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

export default router;
