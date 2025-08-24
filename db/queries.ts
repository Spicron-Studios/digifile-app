import { eq, and } from 'drizzle-orm';
import db from '@/app/lib/drizzle';
import { users, userRoles, patient, fileInfo, fileinfoPatient } from './schema';

// Common query patterns for better type safety and reusability

export const userQueries = {
  // Get user by email
  async getByEmail(email: string) {
    return await db.select().from(users).where(eq(users.email, email)).limit(1);
  },

  // Get user by UID
  async getByUid(uid: string) {
    return await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  },

  // Get user with roles
  async getWithRoles(uid: string) {
    return await db
      .select()
      .from(users)
      .leftJoin(userRoles, eq(users.uid, userRoles.userid))
      .where(eq(users.uid, uid));
  },

  // Get users by organization
  async getByOrganization(orgid: string) {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.orgid, orgid), eq(users.active, true)));
  },
};

export const patientQueries = {
  // Get patient by UID
  async getByUid(uid: string) {
    return await db.select().from(patient).where(eq(patient.uid, uid)).limit(1);
  },

  // Get patients by organization
  async getByOrganization(orgid: string) {
    return await db
      .select()
      .from(patient)
      .where(and(eq(patient.orgid, orgid), eq(patient.active, true)));
  },
};

export const fileQueries = {
  // Get file with patient information
  async getFileWithPatient(fileUid: string) {
    return await db
      .select()
      .from(fileInfo)
      .leftJoin(fileinfoPatient, eq(fileInfo.uid, fileinfoPatient.fileid))
      .leftJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
      .where(eq(fileInfo.uid, fileUid))
      .limit(1);
  },

  // Get files by organization
  async getByOrganization(orgid: string) {
    return await db
      .select()
      .from(fileInfo)
      .where(and(eq(fileInfo.orgid, orgid), eq(fileInfo.active, true)));
  },
};

// Helper function to format timestamps
export const formatTimestamp = () => new Date().toISOString();

// Helper for generating UUIDs (you might want to use the crypto.randomUUID() or uuid package)
export const generateUUID = () => crypto.randomUUID();
