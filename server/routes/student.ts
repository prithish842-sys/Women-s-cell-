import { Router, Response } from 'express';
import { Users, StudentProfiles, Skills, GovernmentSchemes, Skill } from '../models/index.js';
import { StudentProfileUpdateSchema, SkillSchema, StudentRoleUpdateSchema, WorkshopRegistrationSchema } from '../schemas/validation.js';
import { auth, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { enrichStudentAcademicDetails, getCurrentAcademicYear } from '../utils/academic.js';
import { enrichSchemeDetails } from '../utils/scheme.js';
import { storedFileReference, uploadProfile, uploadSkillCertificate } from '../middleware/upload.js';
import { prisma } from '../config/prisma.js';
import { getStudentProgress } from '../utils/progress.js';
import { serializeWorkshop } from '../utils/workshops.js';
import { getStudentInChargeRole, notifyInternalReviewers, serializeRoleUpdate } from '../utils/studentRoleUpdates.js';

const router = Router();

const normalizeSkillBody = (body: any) => ({
  ...body,
  yearsOfExperience: body.yearsOfExperience === undefined || body.yearsOfExperience === ''
    ? 0
    : Number(body.yearsOfExperience),
  isPrimary: body.isPrimary === true || body.isPrimary === 'true',
  tools: Array.isArray(body.tools)
    ? body.tools
    : String(body.tools || '')
        .split(',')
        .map(tool => tool.trim())
        .filter(Boolean),
});

const logStudentActivity = async (studentUserId: string, type: string, title: string, description: string) => {
  try {
    const profile = await StudentProfiles.findOne({ userId: studentUserId });
    if (!profile) return;
    
    const activities = (profile as any).activities || [];
    const newActivity = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      type,
      title,
      description,
      timestamp: new Date().toISOString()
    };
    
    const updatedActivities = [newActivity, ...activities].slice(0, 20);
    
    await StudentProfiles.findByIdAndUpdate(profile._id!, {
      $set: { activities: updatedActivities }
    });
  } catch (error) {
    console.error('Error logging student activity:', error);
  }
};

// Retrieve own profile
router.get('/me', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findOne({ userId: req.user!._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enriched = enrichStudentAcademicDetails(profile);

    return res.json({
      success: true,
      data: {
        user: {
          _id: req.user!._id,
          name: req.user!.name,
          email: req.user!.email,
          role: req.user!.role,
          isActive: req.user!.isActive
        },
        profile: enriched
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update own profile
router.put('/me', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = StudentProfileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const { 
      name, 
      phone, 
      bio, 
      department, 
      course, 
      entrepreneurship, 
      availability,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone
    } = parseResult.data;

    // Update name on User collection
    await Users.findByIdAndUpdate(req.user!._id!, { name });

    // Update StudentProfile collection
    const profile = await StudentProfiles.findOne({ userId: req.user!._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const updatedProfile = await StudentProfiles.findByIdAndUpdate(profile._id!, {
      $set: {
        phone,
        bio: bio || '',
        department,
        course,
        entrepreneurship: entrepreneurship || profile.entrepreneurship,
        availability: availability || profile.availability,
        emergencyContactName: emergencyContactName || '',
        emergencyContactRelationship: emergencyContactRelationship || '',
        emergencyContactPhone: emergencyContactPhone || ''
      }
    });

    await logStudentActivity(
      req.user!._id!,
      'profile_update',
      'Profile Details Updated',
      `Modified student contact details, core department fields, or professional bio statement.`
    );

    const enriched = enrichStudentAcademicDetails(updatedProfile);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: enriched
    });
  } catch (error) {
    next(error);
  }
});

// Update the authenticated student's dashboard/profile hero background.
// Uses the existing secure profile upload pipeline:
// MIME + extension checks, size limits, random filenames and file-signature validation.
router.put(
  '/me/dashboard-hero',
  auth,
  authorize(['STUDENT']),
  uploadProfile.single('heroImage'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const file = req.file as Express.Multer.File | undefined;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a JPG, PNG, or WEBP image.',
        });
      }

      const profile = await StudentProfiles.findOne({
        userId: req.user!._id,
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found.',
        });
      }

      const dashboardHeroImage = storedFileReference(file, `/uploads/profiles/${file.filename}`);

      const updatedProfile = await StudentProfiles.findByIdAndUpdate(
        profile._id!,
        {
          $set: {
            dashboardHeroImage,
          },
        },
      );

      await logStudentActivity(
        req.user!._id!,
        'profile_update',
        'Dashboard Hero Updated',
        'Updated the personal dashboard/profile hero background image.',
      );

      return res.json({
        success: true,
        message: 'Dashboard background updated successfully.',
        data: enrichStudentAcademicDetails(updatedProfile),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/me/dashboard-hero',
  auth,
  authorize(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const profile = await StudentProfiles.findOne({
        userId: req.user!._id,
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found.',
        });
      }

      const updatedProfile = await StudentProfiles.findByIdAndUpdate(
        profile._id!,
        {
          $set: {
            dashboardHeroImage: null,
          },
        },
      );

      return res.json({
        success: true,
        message: 'Dashboard background reset to the default image.',
        data: enrichStudentAcademicDetails(updatedProfile),
      });
    } catch (error) {
      next(error);
    }
  },
);

// Student dashboard metrics
router.get('/me/dashboard', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findOne({ userId: req.user!._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enriched = enrichStudentAcademicDetails(profile) as any;
    const skillsList = await Skills.find({ studentId: req.user!._id });
    
    // Calculate profile completion percentage with detailed sub-metrics
    const hasSkills = skillsList.length > 0;
    const hasPrimarySkill = skillsList.some(s => s.isPrimary);
    const hasSkillDescription = skillsList.some(s => !!s.description);
    
    const ent = (profile.entrepreneurship || {}) as any;
    const interested = !!ent.interestedInEntrepreneurship;
    const hasBusinessIdea = !!ent.businessIdea;
    const hasPreferredIndustry = !!ent.preferredIndustry;
    const hasSupportOrMentorship = !!(ent.incubationSupportRequired || ent.mentorshipSought);

    const hasPhone = !!profile.phone;
    const hasBio = !!profile.bio;
    const hasDept = !!profile.department;
    const hasCourse = !!profile.course;
    const hasAvailability = !!(profile.availability?.availableDays && profile.availability.availableDays.length > 0);

    const coreScore = [hasPhone, hasBio, hasDept, hasCourse, hasAvailability].filter(Boolean).length;
    const corePercentage = Math.round((coreScore / 5) * 100);

    const skillsScore = [hasSkills, hasPrimarySkill, hasSkillDescription].filter(Boolean).length;
    const skillsPercentage = Math.round((skillsScore / 3) * 100);

    const futureScore = [interested, hasBusinessIdea, hasPreferredIndustry, hasSupportOrMentorship].filter(Boolean).length;
    const futurePercentage = Math.round((futureScore / 4) * 100);

    const completionPercentage = Math.round((corePercentage + skillsPercentage + futurePercentage) / 3);

    // Get current academic year
    const academicYear = getCurrentAcademicYear();

    // Get available government schemes count
    const schemes = await GovernmentSchemes.find();
    const activeSchemes = schemes.map(enrichSchemeDetails).filter(s => s && s.status === 'ACTIVE').length;

    // Get chronological activity list, pre-populating with real state history if empty
    let activities = (profile as any).activities;
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      activities = [
        {
          id: 'act-init-1',
          type: 'registration',
          title: 'Portal Profile Registered',
          description: 'Successfully established verified student credentials and mapped academic timeline in the Sankara College of Science and Commerce system.',
          timestamp: profile.createdAt || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      if (profile.isSingaPenMember) {
        activities.unshift({
          id: 'act-init-2',
          type: 'club_join',
          title: 'Singa Pen Club Membership Active',
          description: `Activated active student volunteer status under the '${profile.clubRole || 'Member'}' role for peer mentorship and technical outreach.`,
          timestamp: profile.clubJoinedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (skillsList.length > 0) {
        skillsList.forEach((sk, i) => {
          activities.unshift({
            id: `act-init-sk-${i}`,
            type: 'skill_add',
            title: `Skill Registered: ${sk.skillName}`,
            description: `Declared expertise level '${sk.skillLevel}' under the '${sk.category}' domain.`,
            timestamp: sk.createdAt || new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000 + (i * 30 * 60 * 1000)).toISOString()
          });
        });
      }

      if (interested) {
        activities.unshift({
          id: 'act-init-future',
          type: 'future_plan_update',
          title: 'Entrepreneurship Launch Goals Set',
          description: hasBusinessIdea
            ? `Submitted business proposal idea: "${ent.businessIdea}" in the ${ent.preferredIndustry || 'women empowerment'} industry.`
            : `Updated future plan to focus on active entrepreneurship launch support and mentorship assistance.`,
          timestamp: profile.updatedAt || new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        });
      }

      // Store initial items
      await StudentProfiles.findByIdAndUpdate(profile._id!, {
        $set: { activities }
      });
    }

    // Sort activities by timestamp descending (newest first)
    activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const roleInfo = getStudentInChargeRole(req.user!, profile);
    const recentRoleUpdates = roleInfo
      ? await prisma.studentRoleUpdate.findMany({
        where: { studentId: profile._id! },
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      })
      : [];

    return res.json({
      success: true,
      data: {
        completionPercentage,
        completionBreakdown: {
          core: {
            percentage: corePercentage,
            items: { hasPhone, hasBio, hasDept, hasCourse, hasAvailability }
          },
          skills: {
            percentage: skillsPercentage,
            items: { hasSkills, hasPrimarySkill, hasSkillDescription }
          },
          future: {
            percentage: futurePercentage,
            items: { interested, hasBusinessIdea, hasPreferredIndustry, hasSupportOrMentorship }
          }
        },
        academicYear: academicYear.label,
        currentStudyYear: enriched.currentStudyYear,
        academicStatus: enriched.academicStatus,
        isSingaPenMember: enriched.isSingaPenMember,
        clubRole: enriched.clubRole || null,
        skillCount: skillsList.length,
        primarySkills: skillsList.filter(s => s.isPrimary).map(s => s.skillName),
        activeSchemesCount: activeSchemes,
        entrepreneurshipInterested: ent.interestedInEntrepreneurship || false,
        availableForProjects: enriched.availability?.availableForProjects || false,
        recentActivities: activities,
        roleActivity: roleInfo
          ? {
            role: roleInfo,
            recentUpdates: recentRoleUpdates.map(update => ({ ...update, _id: update.id })),
          }
          : null,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET future plan details
router.get('/me/future-plan', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findOne({ userId: req.user!._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    const ent = (profile.entrepreneurship || {}) as any;
    return res.json({
      success: true,
      data: {
        interestedInEntrepreneurship: ent.interestedInEntrepreneurship || false,
        businessIdea: ent.businessIdea || '',
        preferredIndustry: ent.preferredIndustry || '',
        incubationSupportRequired: ent.incubationSupportRequired || false,
        mentorshipSought: ent.mentorshipSought || false
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT future plan details
router.put('/me/future-plan', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await StudentProfiles.findOne({ userId: req.user!._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    
    const {
      interestedInEntrepreneurship,
      businessIdea,
      preferredIndustry,
      incubationSupportRequired,
      mentorshipSought
    } = req.body;

    const entrepreneurship = {
      interestedInEntrepreneurship: !!interestedInEntrepreneurship,
      businessIdea: businessIdea || '',
      preferredIndustry: preferredIndustry || '',
      incubationSupportRequired: !!incubationSupportRequired,
      mentorshipSought: !!mentorshipSought,
      futurePlan: profile.entrepreneurship?.futurePlan || ''
    };

    const updatedProfile = await StudentProfiles.findByIdAndUpdate(profile._id!, {
      $set: { entrepreneurship }
    });

    const focusText = interestedInEntrepreneurship 
      ? `Updated startup plan with business idea: "${businessIdea || 'No idea specified yet'}" under target industry "${preferredIndustry || 'General'}"` 
      : 'Updated academic & future employment preferences.';
    await logStudentActivity(
      req.user!._id!,
      'future_plan_update',
      'Future Plan & Startup Goals Configured',
      focusText
    );

    return res.json({
      success: true,
      message: 'Future plan and launch parameters updated successfully.',
      data: entrepreneurship
    });
  } catch (error) {
    next(error);
  }
});

// GET skills
router.get('/me/skills', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentSkills = await Skills.find({ studentId: req.user!._id });
    return res.json({
      success: true,
      data: studentSkills
    });
  } catch (error) {
    next(error);
  }
});

// POST skill
router.post('/me/skills', auth, uploadSkillCertificate.single('certificate'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = SkillSchema.safeParse(normalizeSkillBody(req.body));
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const skillData = parseResult.data;
    
    // If setting as primary, optional behavior to manage existing primary skills
    if (skillData.isPrimary) {
      const existingPrimary = await Skills.find({ studentId: req.user!._id, isPrimary: true });
      // Limit to 3 primary skills if wanted, or just allow it
    }

    const newSkill = await Skills.create({
      studentId: req.user!._id!,
      skillName: skillData.skillName,
      normalizedSkillName: skillData.skillName.toLowerCase().trim(),
      category: skillData.category,
      skillLevel: skillData.skillLevel,
      yearsOfExperience: skillData.yearsOfExperience,
      description: skillData.description || '',
      tools: skillData.tools || [],
      portfolioUrl: skillData.portfolioUrl || '',
      certificateUrl: req.file ? storedFileReference(req.file, `/uploads/skills/${req.file.filename}`) : (skillData.certificateUrl || ''),
      isPrimary: skillData.isPrimary
    });

    await logStudentActivity(
      req.user!._id!,
      'skill_add',
      `Skill Registered: ${skillData.skillName}`,
      `Added skill expertise level '${skillData.skillLevel}' under the '${skillData.category}' category.`
    );

    return res.status(201).json({
      success: true,
      message: 'Skill added successfully.',
      data: newSkill
    });
  } catch (error) {
    next(error);
  }
});

// PUT skill
router.put('/me/skills/:skillId', auth, uploadSkillCertificate.single('certificate'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = SkillSchema.safeParse(normalizeSkillBody(req.body));
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const skill = await Skills.findById(req.params.skillId);
    if (!skill || skill.studentId !== req.user!._id) {
      return res.status(404).json({ success: false, message: 'Skill not found or access denied.' });
    }

    const skillData = parseResult.data;
    const updated = await Skills.findByIdAndUpdate(req.params.skillId, {
      $set: {
        skillName: skillData.skillName,
        normalizedSkillName: skillData.skillName.toLowerCase().trim(),
        category: skillData.category,
        skillLevel: skillData.skillLevel,
        yearsOfExperience: skillData.yearsOfExperience,
        description: skillData.description || '',
        tools: skillData.tools || [],
        portfolioUrl: skillData.portfolioUrl || '',
        certificateUrl: req.file ? storedFileReference(req.file, `/uploads/skills/${req.file.filename}`) : (skillData.certificateUrl || ''),
        isPrimary: skillData.isPrimary
      }
    });

    await logStudentActivity(
      req.user!._id!,
      'skill_update',
      `Skill Refined: ${skillData.skillName}`,
      `Updated parameters and competency descriptors for '${skillData.skillName}' skill portfolio.`
    );

    return res.json({
      success: true,
      message: 'Skill updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// DELETE skill
router.delete('/me/skills/:skillId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const skill = await Skills.findById(req.params.skillId);
    if (!skill || skill.studentId !== req.user!._id) {
      return res.status(404).json({ success: false, message: 'Skill not found or access denied.' });
    }

    const deletedSkillName = skill.skillName;
    await Skills.deleteOne({ _id: req.params.skillId });

    await logStudentActivity(
      req.user!._id!,
      'skill_delete',
      `Skill Removed`,
      `Deleted registered skill tag '${deletedSkillName}' from active profile.`
    );

    return res.json({
      success: true,
      message: 'Skill deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// POST log activity from client side
router.post('/me/activities/log', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { type, title, description } = req.body;
    if (!type || !title || !description) {
      return res.status(400).json({ success: false, message: 'Missing required logging fields.' });
    }
    
    await logStudentActivity(req.user!._id!, type, title, description);
    
    return res.json({
      success: true,
      message: 'Client activity logged successfully.'
    });
  } catch (error) {
    next(error);
  }
});

async function requireOwnStudentProfile(userId: string, res: Response) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) {
    res.status(404).json({ success: false, message: 'Student profile not found.' });
    return null;
  }
  return profile;
}

router.get('/me/role-updates', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only student accounts can access role updates.' });
    }
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const roleInfo = getStudentInChargeRole(req.user!, profile);
    if (!roleInfo) {
      return res.status(403).json({ success: false, message: 'Student in-charge access required.' });
    }

    const updates = await prisma.studentRoleUpdate.findMany({
      where: { studentId: profile.id },
      include: { student: { include: { user: true } }, reviewedBy: true },
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({
      success: true,
      data: {
        role: roleInfo,
        updates: updates.map(serializeRoleUpdate),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/role-updates', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only student accounts can submit role updates.' });
    }
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const roleInfo = getStudentInChargeRole(req.user!, profile);
    if (!roleInfo) {
      return res.status(403).json({ success: false, message: 'Student in-charge access required.' });
    }

    const parseResult = StudentRoleUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
      });
    }

    const data = parseResult.data;
    const created = await prisma.studentRoleUpdate.create({
      data: {
        studentId: profile.id,
        officialPosition: roleInfo.officialPosition,
        functionalRole: roleInfo.functionalRole,
        title: data.title.trim(),
        activityDate: new Date(`${data.activityDate}T00:00:00.000Z`),
        activitySummary: data.activitySummary.trim(),
        studentsReached: data.studentsReached ?? null,
        topics: data.topics?.trim() || null,
        feedback: data.feedback?.trim() || null,
        followUp: data.followUp?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: { student: { include: { user: true } }, reviewedBy: true },
    });

    await Promise.all([
      notifyInternalReviewers(
        'Student In-Charge Update Submitted',
        `${req.user!.name} submitted "${created.title}" for ${roleInfo.functionalRole}.`,
        { faculty: '/faculty/role-updates', admin: '/admin/role-updates' },
      ),
      logStudentActivity(
        req.user!._id!,
        'role_update_submit',
        'Role Activity Update Submitted',
        `${roleInfo.functionalRole}: ${created.title}`,
      ),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Role update submitted successfully.',
      data: serializeRoleUpdate(created),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/progress', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const progress = await getStudentProgress(req.user!._id!);
    if (!progress) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    return res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
});

router.get('/me/skill-requests', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const filter = String(req.query.filter || 'all');
    const status = String(req.query.status || '');
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const where: any = { studentId: profile.id, skillRequest: { isPublished: true } };
    if (filter === 'unread') where.isRead = false;
    if (status) where.skillRequest.status = status;
    const [total, rows] = await Promise.all([
      prisma.skillRequestRecipient.count({ where }),
      prisma.skillRequestRecipient.findMany({
        where,
        include: { skillRequest: true },
        orderBy: { notifiedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({ success: true, data: rows.map(row => ({ ...row, _id: row.id, skillRequest: { ...row.skillRequest, _id: row.skillRequest.id } })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/skill-requests/:recipientId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const row = await prisma.skillRequestRecipient.findFirst({
      where: { id: req.params.recipientId, studentId: profile.id },
      include: { skillRequest: true },
    });
    if (!row) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    if (!row.isRead) {
      await prisma.skillRequestRecipient.update({ where: { id: row.id }, data: { isRead: true, readAt: new Date() } });
    }
    return res.json({ success: true, data: { ...row, _id: row.id, isRead: true, skillRequest: { ...row.skillRequest, _id: row.skillRequest.id } } });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/skill-requests/:recipientId/read', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const row = await prisma.skillRequestRecipient.findFirst({ where: { id: req.params.recipientId, studentId: profile.id } });
    if (!row) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    const updated = await prisma.skillRequestRecipient.update({ where: { id: row.id }, data: { isRead: true, readAt: new Date() } });
    return res.json({ success: true, message: 'Skill request marked as read.', data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/skill-requests/:recipientId/respond', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Response message cannot exceed 500 characters.' });
    }
    const row = await prisma.skillRequestRecipient.findFirst({
      where: { id: req.params.recipientId, studentId: profile.id },
      include: { skillRequest: true },
    });
    if (!row) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    if (row.skillRequest.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Only open skill requests can be responded to.' });
    }
    const updated = await prisma.skillRequestRecipient.update({
      where: { id: row.id },
      data: {
        responseStatus: 'INTERESTED',
        responseMessage: message || null,
        respondedAt: new Date(),
        isRead: true,
        readAt: row.readAt || new Date(),
      },
      include: { skillRequest: true },
    });
    return res.json({
      success: true,
      message: 'Skill request response saved.',
      data: { ...updated, _id: updated.id, skillRequest: { ...updated.skillRequest, _id: updated.skillRequest.id } },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/skill-requests/:recipientId/withdraw-response', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const row = await prisma.skillRequestRecipient.findFirst({ where: { id: req.params.recipientId, studentId: profile.id } });
    if (!row) return res.status(404).json({ success: false, message: 'Skill request not found.' });
    const updated = await prisma.skillRequestRecipient.update({
      where: { id: row.id },
      data: {
        responseStatus: 'WITHDRAWN',
        responseMessage: null,
        respondedAt: new Date(),
      },
      include: { skillRequest: true },
    });
    return res.json({
      success: true,
      message: 'Skill request response withdrawn.',
      data: { ...updated, _id: updated.id, skillRequest: { ...updated.skillRequest, _id: updated.skillRequest.id } },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/notifications', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20', 10), 1), 50);
    const where = { userId: req.user!._id! };
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    return res.json({ success: true, data: notifications.map(n => ({ ...n, _id: n.id })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/notifications/unread-count', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!._id!, isRead: false } });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/notifications/:notificationId/read', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: req.params.notificationId, userId: req.user!._id! } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true, readAt: new Date() } });
    return res.json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/notifications/read-all', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!._id!, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me/saved-schemes', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10', 10), 1), 25);
    const where = { studentId: profile.id };
    const [total, saved] = await Promise.all([
      prisma.savedScheme.count({ where }),
      prisma.savedScheme.findMany({
        where,
        include: { scheme: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      success: true,
      data: saved.map(row => ({ ...row, _id: row.id, scheme: enrichSchemeDetails({ ...row.scheme, _id: row.scheme.id } as any) })),
      meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/saved-schemes/:schemeId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const saved = await prisma.savedScheme.upsert({
      where: { studentId_schemeId: { studentId: profile.id, schemeId: req.params.schemeId } },
      update: {},
      create: { studentId: profile.id, schemeId: req.params.schemeId },
    });
    return res.status(201).json({ success: true, message: 'Scheme saved.', data: { ...saved, _id: saved.id } });
  } catch (error) {
    next(error);
  }
});

router.delete('/me/saved-schemes/:schemeId', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    await prisma.savedScheme.deleteMany({ where: { studentId: profile.id, schemeId: req.params.schemeId } });
    return res.json({ success: true, message: 'Scheme removed from saved list.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me/workshops', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const workshops = await prisma.workshop.findMany({
      where: { isPublished: true },
      include: { participations: { where: { studentId: profile.id } } },
      orderBy: { startDateTime: 'asc' },
    });
    return res.json({ success: true, data: workshops.map(serializeWorkshop) });
  } catch (error) {
    next(error);
  }
});

router.post('/me/workshops/:workshopId/interest', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;
    const workshop = await prisma.workshop.findFirst({ where: { id: req.params.workshopId, isPublished: true, isCancelled: false } });
    if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not available.' });
    const status = req.body.status === 'REGISTERED' ? 'REGISTERED' : 'INTERESTED';
    const row = await prisma.workshopParticipation.upsert({
      where: { workshopId_studentId: { workshopId: workshop.id, studentId: profile.id } },
      update: { status },
      create: { workshopId: workshop.id, studentId: profile.id, status },
    });
    return res.json({ success: true, message: 'Workshop preference saved.', data: { ...row, _id: row.id } });
  } catch (error) {
    next(error);
  }
});

router.post('/me/workshops/:workshopId/register', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only student accounts can register for workshops.' });
    }

    const profile = await requireOwnStudentProfile(req.user!._id!, res);
    if (!profile) return;

    const parsed = WorkshopRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
      });
    }

    const registrationDetails = parsed.data;
    if (
      registrationDetails.registerNumber !== profile.registerNumber ||
      registrationDetails.email !== req.user!.email
    ) {
      return res.status(400).json({
        success: false,
        message: 'Registration identity does not match the signed-in student account.',
      });
    }

    const workshop = await prisma.workshop.findFirst({
      where: { id: req.params.workshopId, isPublished: true },
      include: { participations: true },
    });
    if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not available.' });
    if (workshop.isCancelled) return res.status(400).json({ success: false, message: 'Registration is closed because this workshop is cancelled.' });
    if (workshop.isCompleted || new Date() >= workshop.endDateTime) return res.status(400).json({ success: false, message: 'Registration is closed because this workshop is completed.' });
    if (new Date() >= workshop.startDateTime) return res.status(400).json({ success: false, message: 'Registration deadline has passed for this workshop.' });

    const activeRegisteredCount = workshop.participations.filter(row => ['REGISTERED', 'ATTENDED'].includes(row.status)).length;
    if (workshop.maximumParticipants && activeRegisteredCount >= workshop.maximumParticipants) {
      return res.status(400).json({ success: false, message: 'Workshop capacity is full.' });
    }

    const existing = workshop.participations.find(row => row.studentId === profile.id);
    if (existing && ['REGISTERED', 'ATTENDED'].includes(existing.status)) {
      return res.status(409).json({ success: false, message: 'You are already registered for this workshop.' });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    const registered = await prisma.$transaction(async (tx) => {
      const participation = existing
        ? await tx.workshopParticipation.update({
            where: { id: existing.id },
            data: {
              status: 'REGISTERED',
              learningExpectation: registrationDetails.learningExpectation || null,
              supportRequirement: registrationDetails.supportRequirement || null,
            },
          })
        : await tx.workshopParticipation.create({
            data: {
              workshopId: workshop.id,
              studentId: profile.id,
              status: 'REGISTERED',
              learningExpectation: registrationDetails.learningExpectation || null,
              supportRequirement: registrationDetails.supportRequirement || null,
            },
          });

      for (const admin of admins) {
        await tx.notification.upsert({
          where: { id: `notif-workshop-registration-${workshop.id}-${profile.id}-${admin.id}` },
          update: {},
          create: {
            id: `notif-workshop-registration-${workshop.id}-${profile.id}-${admin.id}`,
            userId: admin.id,
            type: 'WORKSHOP_REGISTRATION',
            title: 'New Workshop Registration',
            message: `${req.user!.name} registered for ${workshop.title}.`,
            link: `/admin/workshops/${workshop.id}/registrations`,
          },
        });
      }

      return participation;
    });

    return res.status(201).json({
      success: true,
      message: 'Workshop registration completed.',
      data: { ...registered, _id: registered.id },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'You are already registered for this workshop.' });
    }
    next(error);
  }
});

export default router;
