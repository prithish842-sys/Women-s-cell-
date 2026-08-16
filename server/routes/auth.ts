import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Users, StudentProfiles, FacultyProfiles, User } from '../models/index.js';
import { StudentRegisterSchema, LoginSchema, ChangePasswordSchema } from '../schemas/validation.js';
import { auth, AuthenticatedRequest, getJwtSecret, sanitizeUser } from '../middleware/auth.js';

const router = Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Student Registration
router.post('/student/register', async (req, res, next) => {
  try {
    const parseResult = StudentRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
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
      password
    } = parseResult.data;

    const emailLower = email.toLowerCase();
    const regUpper = registerNumber.toUpperCase().trim();

    // Check for existing user with same email
    const existingEmail = await Users.findOne({ email: emailLower });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Check for existing profile with same register number
    const existingReg = await StudentProfiles.findOne({ registerNumber: regUpper });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: 'A student with this register number already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User entry
    const user = await Users.create({
      name,
      email: emailLower,
      passwordHash,
      role: 'STUDENT',
      identifier: regUpper,
      isActive: true,
      lastLoginAt: new Date().toISOString()
    });

    // Extract numeric joining year from "2024-2025" -> 2024
    const joiningYear = parseInt(joiningAcademicYear.split('-')[0], 10);

    // Create Student Profile
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
        interestedInEntrepreneurship: false
      },
      availability: {
        availableForProjects: false,
        availableDays: []
      }
    });

    // Generate JWT
    const token = jwt.sign({ _id: user._id, role: user.role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN as any });
    const safeUser = sanitizeUser(user);

    return res.status(201).json({
      success: true,
      message: 'Student registered and logged in successfully.',
      data: {
        token,
        user: safeUser,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login (Students, Faculty, and Admins)
router.post('/login', async (req, res, next) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const { identifier, password } = parseResult.data;
    const identifierTrimmed = identifier.trim();

    // Find user by email OR register number (identifier)
    let user = await Users.findOne({ email: identifierTrimmed.toLowerCase() });
    if (!user) {
      user = await Users.findOne({ identifier: identifierTrimmed.toUpperCase() });
    }
    if (!user) {
      // Allow lowercase admin login or case-insensitive search
      user = await Users.findOne({ identifier: identifierTrimmed });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact administration.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const safeUser = sanitizeUser(user);
    const profilePromise = user.role === 'STUDENT'
      ? StudentProfiles.findOne({ userId: user._id })
      : user.role === 'FACULTY'
        ? FacultyProfiles.findOne({ userId: user._id })
        : Promise.resolve(null);

    const [profile] = await Promise.all([
      profilePromise,
      Users.findByIdAndUpdate(user._id!, { lastLoginAt: new Date().toISOString() }),
    ]);

    if (user.role === 'FACULTY' && profile) {
      (safeUser as any).staffId = (profile as any).staffId;
    }

    // Sign Token
    const token = jwt.sign({ _id: user._id, role: user.role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN as any });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: safeUser,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Me (Get current logged in user details)
router.get('/me', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const safeUser = sanitizeUser(user);

    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfiles.findOne({ userId: user._id });
    } else if (user.role === 'FACULTY') {
      profile = await FacultyProfiles.findOne({ userId: user._id });
      if (profile) {
        (safeUser as any).staffId = profile.staffId;
      }
    }

    return res.json({
      success: true,
      data: {
        user: safeUser,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// Change Password
router.put('/change-password', auth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.issues.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }

    const { oldPassword, newPassword } = parseResult.data;
    const user = await Users.findById(req.user!._id!);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await Users.findByIdAndUpdate(user._id!, { passwordHash: newHash });

    return res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
