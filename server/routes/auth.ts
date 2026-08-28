import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  Users,
  StudentProfiles,
  FacultyProfiles,
} from '../models/index.js';

import {
  StudentRegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  FacultyAccountSchema,
} from '../schemas/validation.js';

import {
  auth,
  AuthenticatedRequest,
  getJwtSecret,
  sanitizeUser,
} from '../middleware/auth.js';

const router = Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const INVALID_LOGIN_MESSAGE = 'Invalid identifier or password.';

const REGISTRATION_CONFLICT_MESSAGE =
  'Registration could not be completed with the provided details.';

// ============================================================
// Student Registration
// ============================================================

router.post('/student/register', async (req, res, next) => {
  try {
    const parseResult = StudentRegisterSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const {
      name,
      email,
      registerNumber,
      phone,
      department,
      course,
      joiningAcademicYear,
      expectedPassingYear,
      expectedCompletionDate,
      courseDurationYears,
      password,
    } = parseResult.data;

    const emailLower = email.toLowerCase().trim();
    const regUpper = registerNumber.toUpperCase().trim();

    // ----------------------------------------------------------
    // Check existing email
    // ----------------------------------------------------------

    const existingEmail = await Users.findOne({
      email: emailLower,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: REGISTRATION_CONFLICT_MESSAGE,
      });
    }

    // ----------------------------------------------------------
    // Check existing register number
    // ----------------------------------------------------------

    const existingReg = await StudentProfiles.findOne({
      registerNumber: regUpper,
    });

    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: REGISTRATION_CONFLICT_MESSAGE,
      });
    }

    // ----------------------------------------------------------
    // Hash password
    // ----------------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 10);

    // ----------------------------------------------------------
    // Create user
    // ----------------------------------------------------------

    const user = await Users.create({
      name,
      email: emailLower,
      passwordHash,
      role: 'STUDENT',
      identifier: regUpper,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    });

    // Example:
    // "2024-2025" -> 2024
    const joiningYear = parseInt(
      joiningAcademicYear.split('-')[0],
      10
    );

    // ----------------------------------------------------------
    // Create student profile
    // ----------------------------------------------------------

    const profile = await StudentProfiles.create({
      userId: user._id!,
      registerNumber: regUpper,
      phone,
      department,
      course,
      joiningAcademicYear,
      joiningYear,
      expectedPassingYear,
      expectedCompletionDate,
      courseDurationYears,

      isSingaPenMember: false,

      achievements: [],

      entrepreneurship: {
        interestedInEntrepreneurship: false,
      },

      availability: {
        availableForProjects: false,
        availableDays: [],
      },
    });

    // ----------------------------------------------------------
    // Generate JWT
    // ----------------------------------------------------------

    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: JWT_EXPIRES_IN as any,
      }
    );

    const safeUser = sanitizeUser(user);

    return res.status(201).json({
      success: true,
      message: 'Student registered and logged in successfully.',
      data: {
        token,
        user: safeUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Staff Registration
// ============================================================

router.post('/staff-register', async (req, res, next) => {
  try {
    const parseResult = FacultyAccountSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const {
      name,
      email,
      staffId,
      department,
      designation,
      phone,
      password,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
    } = parseResult.data;

    const emailLower = email.toLowerCase().trim();
    const staffIdUpper = staffId.toUpperCase().trim();

    // Check existing email
    const existingEmail = await Users.findOne({
      email: emailLower,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: REGISTRATION_CONFLICT_MESSAGE,
      });
    }

    // Check existing staff ID
    const existingStaff = await FacultyProfiles.findOne({
      staffId: staffIdUpper,
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: REGISTRATION_CONFLICT_MESSAGE,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (inactive pending admin approval)
    const user = await Users.create({
      name,
      email: emailLower,
      passwordHash,
      role: 'FACULTY',
      identifier: staffIdUpper,
      isActive: false, // Critical for security workflow
    });

    // Create faculty profile
    await FacultyProfiles.create({
      userId: user._id!,
      staffId: staffIdUpper,
      department,
      designation: designation || 'Faculty',
      phone: phone || '',
      emergencyContactName: emergencyContactName || '',
      emergencyContactRelationship: emergencyContactRelationship || '',
      emergencyContactPhone: emergencyContactPhone || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Staff registered successfully and is pending admin approval.',
      // No token returned as they are inactive
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Login - Students, Faculty and Admins
// ============================================================

router.post('/login', async (req, res, next) => {
  try {
    // ----------------------------------------------------------
    // Validate request
    // ----------------------------------------------------------

    const parseResult = LoginSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { identifier, password } = parseResult.data;

    const identifierTrimmed = identifier.trim();

    // ----------------------------------------------------------
    // Find user
    // Login can be:
    // - Email
    // - Register number
    // - Staff/Admin identifier
    // ----------------------------------------------------------

    let user = await Users.findOne({
      email: identifierTrimmed.toLowerCase(),
    });

    if (!user) {
      user = await Users.findOne({
        identifier: identifierTrimmed.toUpperCase(),
      });
    }

    if (!user) {
      user = await Users.findOne({
        identifier: identifierTrimmed,
      });
    }

    // ----------------------------------------------------------
    // User not found
    // ----------------------------------------------------------

    if (!user) {
      console.log(
        '[LOGIN DEBUG] USER_NOT_FOUND:',
        identifierTrimmed
      );

      return res.status(401).json({
        success: false,
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    // ----------------------------------------------------------
    // Account status
    // ----------------------------------------------------------

    if (!user.isActive) {
      console.log('[LOGIN DEBUG] ACCOUNT_INACTIVE:', {
        userId: user._id,
        email: user.email,
        identifier: user.identifier,
      });

      return res.status(403).json({
        success: false,
        message:
          'This account has been deactivated. Please contact administration.',
      });
    }

    // ----------------------------------------------------------
    // Password verification
    // ----------------------------------------------------------

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      console.log('[LOGIN DEBUG] PASSWORD_MISMATCH:', {
        userId: user._id,
        email: user.email,
        identifier: user.identifier,
      });

      return res.status(401).json({
        success: false,
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    // ----------------------------------------------------------
    // Login successful
    // ----------------------------------------------------------

    console.log('[LOGIN DEBUG] LOGIN_SUCCESS:', {
      userId: user._id,
      email: user.email,
      identifier: user.identifier,
      role: user.role,
    });

    const safeUser = sanitizeUser(user);

    // ----------------------------------------------------------
    // Load profile based on role
    // ----------------------------------------------------------

    const profilePromise =
      user.role === 'STUDENT'
        ? StudentProfiles.findOne({
            userId: user._id,
          })
        : user.role === 'FACULTY'
          ? FacultyProfiles.findOne({
              userId: user._id,
            })
          : Promise.resolve(null);

    const [profile] = await Promise.all([
      profilePromise,

      Users.findByIdAndUpdate(user._id!, {
        lastLoginAt: new Date().toISOString(),
      }),
    ]);

    // Add staffId to faculty response
    if (user.role === 'FACULTY' && profile) {
      (safeUser as any).staffId = (profile as any).staffId;
    }

    // ----------------------------------------------------------
    // Generate JWT
    // ----------------------------------------------------------

    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: JWT_EXPIRES_IN as any,
      }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: safeUser,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Get Me
// ============================================================

router.get(
  '/me',
  auth,
  async (
    req: AuthenticatedRequest,
    res: Response,
    next
  ) => {
    try {
      const user = req.user!;

      const safeUser = sanitizeUser(user);

      let profile = null;

      // --------------------------------------------------------
      // Student profile
      // --------------------------------------------------------

      if (user.role === 'STUDENT') {
        profile = await StudentProfiles.findOne({
          userId: user._id,
        });
      }

      // --------------------------------------------------------
      // Faculty profile
      // --------------------------------------------------------

      else if (user.role === 'FACULTY') {
        profile = await FacultyProfiles.findOne({
          userId: user._id,
        });

        if (profile) {
          (safeUser as any).staffId = profile.staffId;
        }
      }

      return res.json({
        success: true,
        data: {
          user: safeUser,
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// Logout
// ============================================================

router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// ============================================================
// Change Password
// ============================================================

router.put(
  '/change-password',
  auth,
  async (
    req: AuthenticatedRequest,
    res: Response,
    next
  ) => {
    try {
      // --------------------------------------------------------
      // Validate request
      // --------------------------------------------------------

      const parseResult =
        ChangePasswordSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parseResult.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const { oldPassword, newPassword } =
        parseResult.data;

      // --------------------------------------------------------
      // Find logged-in user
      // --------------------------------------------------------

      const user = await Users.findById(req.user!._id!);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      // --------------------------------------------------------
      // Verify current password
      // --------------------------------------------------------

      const isMatch = await bcrypt.compare(
        oldPassword,
        user.passwordHash
      );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect old password.',
        });
      }

      // --------------------------------------------------------
      // Hash new password
      // --------------------------------------------------------

      const newHash = await bcrypt.hash(
        newPassword,
        10
      );

      await Users.findByIdAndUpdate(user._id!, {
        passwordHash: newHash,
      });

      return res.json({
        success: true,
        message: 'Password updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;