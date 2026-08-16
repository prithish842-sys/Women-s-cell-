import { prisma } from '../config/prisma.js';
import {
  StudentInChargeRole,
  studentInChargeByIdentifier,
  studentInChargeByRegisterNumber,
} from '../data/womensCellMembers.js';

export function getStudentInChargeRole(user: { identifier?: string | null }, profile?: { registerNumber?: string | null } | null): StudentInChargeRole | null {
  if (user.identifier) {
    const byIdentifier = studentInChargeByIdentifier.get(user.identifier);
    if (byIdentifier) return byIdentifier;
  }
  if (profile?.registerNumber) {
    const byRegister = studentInChargeByRegisterNumber.get(profile.registerNumber);
    if (byRegister) return byRegister;
  }
  return null;
}

export function serializeRoleUpdate(update: any) {
  const student = update.student;
  const user = student?.user;
  return {
    ...update,
    _id: update.id,
    student: student
      ? {
        _id: student.id,
        userId: student.userId,
        name: user?.name || 'Student In-Charge',
        email: user?.email || '',
        identifier: user?.identifier || '',
        registerNumber: student.registerNumber,
        department: student.department,
        course: student.course,
        profileImage: student.profileImage,
      }
      : undefined,
    reviewedBy: update.reviewedBy
      ? {
        _id: update.reviewedBy.id,
        name: update.reviewedBy.name,
        email: update.reviewedBy.email,
        role: update.reviewedBy.role,
      }
      : null,
  };
}

export async function findRoleUpdateForReview(id: string) {
  return prisma.studentRoleUpdate.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      reviewedBy: true,
    },
  });
}

export async function notifyInternalReviewers(title: string, message: string, links: { faculty: string; admin: string }) {
  const recipients = await prisma.user.findMany({
    where: { role: { in: ['FACULTY', 'ADMIN'] }, isActive: true },
    select: { id: true, role: true },
  });
  if (recipients.length === 0) return;
  await prisma.notification.createMany({
    data: recipients.map(user => ({
      userId: user.id,
      type: 'SYSTEM',
      title,
      message,
      link: user.role === 'ADMIN' ? links.admin : links.faculty,
    })),
  });
}

export async function notifyStudent(userId: string, title: string, message: string, link: string) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title,
      message,
      link,
    },
  });
}
