"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { notifyUser } from "@/lib/notifications/notify";

export type LifeCoachStatusType = "PENDING" | "CONTACTED" | "MESSAGED" | "CALLED" | "RESOLVED" | "JUNK" | "DNP";

/**
 * Assign Life Coach Request to a Sales Manager (Admin only)
 */
export async function assignLifeCoachToSalesManager(id: string, salesManagerId: string | null) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can assign Life Coach requests to Sales Managers." };
    }

    const request = await prisma.lifeCoachRequest.findUnique({
      where: { id },
      select: { id: true, fullName: true, phone: true },
    });

    if (!request) return { success: false, error: "Request not found." };

    await prisma.lifeCoachRequest.update({
      where: { id },
      data: {
        assignedSalesManagerId: salesManagerId || null,
        lastUpdatedByRole: "ADMIN",
        lastUpdatedByName: session.user.name || "Admin",
      },
    });

    // Notify the Sales Manager if assigned
    if (salesManagerId) {
      const salesManager = await prisma.user.findUnique({
        where: { id: salesManagerId },
        select: { id: true, name: true },
      });

      if (salesManager) {
        await notifyUser(
          salesManagerId,
          "SYSTEM" as any,
          "🎯 New Life Coach Request Assigned",
          `Admin assigned you a Life Coach counseling request from ${request.fullName}.`,
          id
        );
      }
    }

    revalidatePath("/af-ass-manage/life-coach");
    revalidatePath(`/af-ass-manage/life-coach/${id}`);
    if (salesManagerId) {
      revalidatePath(`/sales_manager/${salesManagerId}`);
      revalidatePath(`/sales_manager/${salesManagerId}/life-coach`);
      revalidatePath(`/sales_manager/${salesManagerId}/life-coach/${id}`);
    }

    return { success: true, message: salesManagerId ? "Assigned to Sales Manager!" : "Request unassigned." };
  } catch (error) {
    console.error("Error assigning sales manager to life coach request:", error);
    return { success: false, error: "Failed to assign Sales Manager." };
  }
}

/**
 * Update Status & Notes (Admin or Assigned Sales Manager)
 */
export async function updateLifeCoachStatus(
  id: string,
  newStatus: LifeCoachStatusType,
  notes?: string,
  salesManagerNote?: string
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    const userRole = session.user.role;
    const isSalesManager = userRole === "SALES_MANAGER";
    const isAdmin = userRole === "ADMIN";

    if (!isAdmin && !isSalesManager) {
      return { success: false, error: "Unauthorized." };
    }

    const existing = await prisma.lifeCoachRequest.findUnique({
      where: { id },
      select: { id: true, assignedSalesManagerId: true },
    });

    if (!existing) {
      return { success: false, error: "Request not found." };
    }

    if (isSalesManager && existing.assignedSalesManagerId !== session.user.id) {
      return { success: false, error: "You can only update Life Coach requests assigned to you." };
    }

    const updaterRole = isAdmin ? "ADMIN" : "SALES_MANAGER";
    const updaterName = session.user.name || (isAdmin ? "Admin" : "Sales Manager");

    const updateData: any = {
      status: newStatus,
      lastUpdatedByRole: updaterRole,
      lastUpdatedByName: updaterName,
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (salesManagerNote !== undefined) {
      updateData.salesManagerNote = salesManagerNote;
    }

    await prisma.lifeCoachRequest.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/af-ass-manage/life-coach");
    revalidatePath(`/af-ass-manage/life-coach/${id}`);
    if (existing.assignedSalesManagerId) {
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}`);
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/life-coach`);
      revalidatePath(`/sales_manager/${existing.assignedSalesManagerId}/life-coach/${id}`);
    }

    return { success: true, message: "Updated successfully!" };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Failed to update." };
  }
}