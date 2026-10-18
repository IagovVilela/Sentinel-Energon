import { prisma } from "@/lib/db";

export async function ensurePersonalProfile(userId: string, fallback: {
  fullName: string;
  email: string;
}) {
  return prisma.personalProfile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: fallback.fullName,
      email: fallback.email,
    },
    update: {},
  });
}

export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const PHOTO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const RESUME_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
