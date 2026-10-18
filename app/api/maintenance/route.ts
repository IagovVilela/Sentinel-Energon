import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { maintenanceSchema } from "@/lib/validators";
import { handleApiError, jsonOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    await requireApiUser(["owner", "admin"]);
    const body = maintenanceSchema.parse(await req.json());
    const window = await prisma.maintenanceWindow.create({
      data: {
        projectId: body.projectId,
        title: body.title,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      },
    });
    return jsonOk({ window }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
