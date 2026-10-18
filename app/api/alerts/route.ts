import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { alertRuleSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireApiUser();
    const [rules, logs] = await Promise.all([
      prisma.alertRule.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.notificationLog.findMany({
        orderBy: { sentAt: "desc" },
        take: 50,
      }),
    ]);
    return jsonOk({ rules, logs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser(["owner", "admin"]);
    const body = alertRuleSchema.parse(await req.json());
    const rule = await prisma.alertRule.create({
      data: {
        userId: user.id,
        email: body.email,
        notifyDown: body.notifyDown,
        notifyRecovery: body.notifyRecovery,
        notifyExpiry: body.notifyExpiry,
        reminderHours: body.reminderHours,
        enabled: body.enabled,
      },
    });
    return jsonOk({ rule }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
