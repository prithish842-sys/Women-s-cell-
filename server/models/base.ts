import { prisma } from '../config/prisma.js';

type ModelName =
  | 'user'
  | 'studentProfile'
  | 'facultyProfile'
  | 'skill'
  | 'governmentScheme'
  | 'siteContent'
  | 'galleryAlbum'
  | 'galleryImage'
  | 'achievement';

const delegates: Record<ModelName, any> = {
  user: prisma.user,
  studentProfile: prisma.studentProfile,
  facultyProfile: prisma.facultyProfile,
  skill: prisma.skill,
  governmentScheme: prisma.governmentScheme,
  siteContent: prisma.siteContent,
  galleryAlbum: prisma.galleryAlbum,
  galleryImage: prisma.galleryImage,
  achievement: prisma.achievement,
};

const dateOnlyFields = new Set(['expectedCompletionDate', 'startDate', 'endDate', 'eventDate', 'achievementDate']);

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function serialize(model: ModelName, record: any): any {
  if (!record) return record;
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'id') {
      out._id = value;
      continue;
    }
    if (key === 'createdById') {
      out.createdBy = value;
      continue;
    }
    if (key === 'uploadedById') {
      out.uploadedBy = value;
      continue;
    }
    if (key === 'updatedById') {
      out.updatedBy = value;
      continue;
    }
    if (key === 'requiredDocuments' && typeof value === 'string') {
      try {
        out.requiredDocuments = JSON.parse(value);
      } catch {
        out.requiredDocuments = value ? value.split('\n').filter(Boolean) : [];
      }
      continue;
    }
    if (value instanceof Date) {
      out[key] = dateOnlyFields.has(key) ? formatDateOnly(value) : value.toISOString();
      continue;
    }
    out[key] = value;
  }

  if (model === 'studentProfile') {
    out.achievements = out.achievementsSummary ? out.achievementsSummary.split('\n').filter(Boolean) : [];
    out.entrepreneurship = {
      interestedInEntrepreneurship: out.interestedInEntrepreneurship || false,
      businessIdea: out.businessIdea || '',
      existingBusinessOrProject: out.existingBusiness || '',
      futurePlan: out.futurePlan || '',
      supportRequired: out.supportRequired || '',
      preferredIndustry: out.preferredIndustry || '',
      incubationSupportRequired: out.incubationSupportRequired || false,
      mentorshipSought: out.mentorshipSought || false,
    };
    out.availability = {
      availableForProjects: out.availableForProjects || false,
      availableDays: out.availableDays || [],
      preferredCollaboration: out.preferredCollaborationType || '',
      availabilityNote: out.availabilityNote || '',
    };
    out.activities = Array.isArray(out.activities) ? out.activities : [];
  }

  return out;
}

function slugDate(value: any) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  return new Date(text.includes('T') ? text : `${text}T00:00:00.000Z`);
}

function directWhere(query: any = {}) {
  const where: Record<string, any> = {};
  for (const [key, value] of Object.entries(query || {})) {
    if (key === '_id') where.id = value;
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      where[key] = translateOperators(value);
    } else where[key] = value;
  }
  return where;
}

function translateOperators(value: any) {
  if ('$in' in value) return { in: value.$in };
  if ('$ne' in value) return { not: value.$ne };
  if ('$gte' in value || '$lte' in value || '$gt' in value || '$lt' in value) {
    return {
      ...(value.$gte !== undefined ? { gte: value.$gte } : {}),
      ...(value.$lte !== undefined ? { lte: value.$lte } : {}),
      ...(value.$gt !== undefined ? { gt: value.$gt } : {}),
      ...(value.$lt !== undefined ? { lt: value.$lt } : {}),
    };
  }
  if ('$regex' in value) return { contains: String(value.$regex), mode: 'insensitive' };
  return value;
}

function setPayload(update: any) {
  return update?.$set ? update.$set : update;
}

function studentProfileData(data: any) {
  const ent = data.entrepreneurship || {};
  const availability = data.availability || {};
  return {
    ...(data.userId !== undefined ? { userId: data.userId } : {}),
    ...(data.registerNumber !== undefined ? { registerNumber: data.registerNumber } : {}),
    ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
    ...(data.profileImage !== undefined ? { profileImage: data.profileImage || null } : {}),
    ...(data.dashboardHeroImage !== undefined ? { dashboardHeroImage: data.dashboardHeroImage || null } : {}),
    ...(data.department !== undefined ? { department: data.department } : {}),
    ...(data.course !== undefined ? { course: data.course } : {}),
    ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
    ...(data.joiningAcademicYear !== undefined ? { joiningAcademicYear: data.joiningAcademicYear } : {}),
    ...(data.joiningYear !== undefined ? { joiningYear: Number(data.joiningYear) } : {}),
    ...(data.expectedPassingYear !== undefined ? { expectedPassingYear: Number(data.expectedPassingYear) } : {}),
    ...(data.expectedCompletionDate !== undefined ? { expectedCompletionDate: slugDate(data.expectedCompletionDate) } : {}),
    ...(data.courseDurationYears !== undefined ? { courseDurationYears: Number(data.courseDurationYears) } : {}),
    ...(data.currentStudyYear !== undefined && typeof data.currentStudyYear === 'number' ? { currentStudyYear: data.currentStudyYear } : {}),
    ...(data.academicStatus !== undefined ? { academicStatus: data.academicStatus } : {}),
    ...(data.isSingaPenMember !== undefined ? { isSingaPenMember: !!data.isSingaPenMember } : {}),
    ...(data.clubRole !== undefined ? { clubRole: data.clubRole || null } : {}),
    ...(data.clubJoinedAt !== undefined ? { clubJoinedAt: slugDate(data.clubJoinedAt) } : {}),
    ...(data.achievements !== undefined ? { achievementsSummary: (data.achievements || []).join('\n') } : {}),
    ...(data.activities !== undefined ? { activities: data.activities } : {}),
    ...(data.entrepreneurship !== undefined ? {
      interestedInEntrepreneurship: !!ent.interestedInEntrepreneurship,
      businessIdea: ent.businessIdea || null,
      existingBusiness: ent.existingBusinessOrProject || null,
      futurePlan: ent.futurePlan || null,
      supportRequired: ent.supportRequired || null,
      preferredIndustry: ent.preferredIndustry || null,
      incubationSupportRequired: !!ent.incubationSupportRequired,
      mentorshipSought: !!ent.mentorshipSought,
    } : {}),
    ...(data.availability !== undefined ? {
      availableForProjects: !!availability.availableForProjects,
      availableDays: availability.availableDays || [],
      preferredCollaborationType: availability.preferredCollaboration || null,
      availabilityNote: availability.availabilityNote || null,
    } : {}),
  };
}

function modelData(model: ModelName, data: any) {
  if (model === 'studentProfile') return studentProfileData(data);
  if (model === 'governmentScheme') {
    return {
      ...data,
      requiredDocuments: Array.isArray(data.requiredDocuments) ? JSON.stringify(data.requiredDocuments) : data.requiredDocuments,
      startDate: slugDate(data.startDate),
      endDate: slugDate(data.endDate),
      status: data.status || 'ACTIVE',
      createdById: data.createdBy,
      createdBy: undefined,
    };
  }
  if (model === 'galleryAlbum') {
    return { ...data, eventDate: slugDate(data.eventDate), createdById: data.createdBy, createdBy: undefined };
  }
  if (model === 'galleryImage') {
    return { ...data, uploadedById: data.uploadedBy, uploadedBy: undefined };
  }
  if (model === 'achievement') {
    return { ...data, achievementDate: slugDate(data.achievementDate), createdById: data.createdBy, createdBy: undefined };
  }
  if (model === 'siteContent') {
    return { ...data, updatedById: data.updatedBy, updatedBy: undefined };
  }
  if (model === 'user') {
    return {
      ...data,
      ...(Object.prototype.hasOwnProperty.call(data, 'lastLoginAt') ? { lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null } : {}),
    };
  }
  return data;
}

async function userIdToStudentProfileId(userId?: string) {
  if (!userId) return undefined;
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  return profile?.id;
}

export class PrismaRepository<T extends { _id?: string }> {
  constructor(private model: ModelName) {}

  private get delegate() {
    return delegates[this.model];
  }

  private async where(query: any = {}) {
    if (this.model === 'skill' && query.studentId) {
      return { ...directWhere({ ...query, studentId: undefined }), student: { userId: query.studentId } };
    }
    if (this.model === 'achievement' && query.studentId) {
      return { ...directWhere({ ...query, studentId: undefined }), student: { userId: query.studentId } };
    }
    return directWhere(query);
  }

  async find(query: any = {}): Promise<T[]> {
    const records = await this.delegate.findMany({ where: await this.where(query) });
    return Promise.all(records.map((record: any) => this.serializeRecord(record)));
  }

  async findOne(query: any = {}): Promise<T | null> {
    const record = await this.delegate.findFirst({ where: await this.where(query) });
    return record ? this.serializeRecord(record) : null;
  }

  async findById(id: string): Promise<T | null> {
    const record = await this.delegate.findUnique({ where: { id } });
    return record ? this.serializeRecord(record) : null;
  }

  async create(doc: Partial<T>): Promise<T> {
    const data = modelData(this.model, doc);
    if (this.model === 'skill') {
      data.studentId = await userIdToStudentProfileId((doc as any).studentId);
    }
    if (this.model === 'achievement' && (doc as any).studentId) {
      data.studentId = await userIdToStudentProfileId((doc as any).studentId);
    }
    const record = await this.delegate.create({ data });
    return this.serializeRecord(record);
  }

  async findByIdAndUpdate(id: string, update: any): Promise<T | null> {
    const data = modelData(this.model, setPayload(update));
    if (this.model === 'skill' && data.studentId) data.studentId = await userIdToStudentProfileId(data.studentId);
    if (this.model === 'achievement' && data.studentId) data.studentId = await userIdToStudentProfileId(data.studentId);
    const record = await this.delegate.update({ where: { id }, data });
    return this.serializeRecord(record);
  }

  async updateOne(query: any, update: any): Promise<boolean> {
    const found = await this.findOne(query);
    if (!found?._id) return false;
    await this.findByIdAndUpdate(found._id, update);
    return true;
  }

  async deleteOne(query: any): Promise<boolean> {
    const found = await this.findOne(query);
    if (!found?._id) return false;
    await this.delegate.delete({ where: { id: found._id } });
    return true;
  }

  async deleteMany(query: any = {}): Promise<number> {
    const result = await this.delegate.deleteMany({ where: await this.where(query) });
    return result.count;
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.delegate.count({ where: await this.where(query) });
  }

  private async serializeRecord(record: any): Promise<T> {
    const serialized = serialize(this.model, record);
    if (this.model === 'skill') {
      const profile = await prisma.studentProfile.findUnique({ where: { id: record.studentId } });
      serialized.studentId = profile?.userId || record.studentId;
    }
    if (this.model === 'achievement' && record.studentId) {
      const profile = await prisma.studentProfile.findUnique({ where: { id: record.studentId } });
      serialized.studentId = profile?.userId || record.studentId;
    }
    return serialized as T;
  }
}
