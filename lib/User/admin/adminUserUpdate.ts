"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateAdminUser(userId: string, formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const role = formData.get("role") as any;
        const isActive = formData.get("isActive") === "true";
        const canAddInstitute = formData.get("canAddInstitute") === "true";
        const instituteIdsRaw = formData.get("instituteIds") as string;

        let instituteIds: string[] = [];
        if (instituteIdsRaw) {
            try {
                instituteIds = JSON.parse(instituteIdsRaw);
            } catch {
                instituteIds = [];
            }
        }

        // Validate: If role is INSTITUTE_MANAGER, minimum 1 institute is required
        if (role === "INSTITUTE_MANAGER" && (!instituteIds || instituteIds.length === 0)) {
            return {
                success: false,
                error: "At least one institute must be selected for Institute Manager role."
            };
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { managedInstitutes: true }
        });

        if (!currentUser) {
            return { success: false, error: "User not found." };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update basic user fields
            await tx.user.update({
                where: { id: userId },
                data: {
                    name,
                    phone,
                    role,
                    isActive,
                    canAddInstitute
                }
            });

            // 2. Role handling: If role is NOT INSTITUTE_MANAGER, remove from all institutes automatically
            if (role !== "INSTITUTE_MANAGER") {
                await tx.instituteManager.deleteMany({
                    where: { userId }
                });
                await tx.instituteMembership.deleteMany({
                    where: { userId, role: "ADMIN" }
                });
            } else {
                // Role is INSTITUTE_MANAGER: sync selected institutes
                // Remove unselected institutes
                await tx.instituteManager.deleteMany({
                    where: {
                        userId,
                        instituteId: { notIn: instituteIds }
                    }
                });
                await tx.instituteMembership.deleteMany({
                    where: {
                        userId,
                        role: "ADMIN",
                        instituteId: { notIn: instituteIds }
                    }
                });

                // Upsert selected institutes
                for (const instId of instituteIds) {
                    await tx.instituteManager.upsert({
                        where: {
                            userId_instituteId: { userId, instituteId: instId }
                        },
                        create: { userId, instituteId: instId },
                        update: {}
                    });

                    const existingMembership = await tx.instituteMembership.findFirst({
                        where: { userId, instituteId: instId, role: "ADMIN" }
                    });

                    if (!existingMembership) {
                        await tx.instituteMembership.create({
                            data: {
                                userId,
                                instituteId: instId,
                                role: "ADMIN",
                                status: "ACTIVE",
                                joinedAt: new Date()
                            }
                        });
                    }
                }
            }
        });

        revalidatePath(`/af-ass-manage/users/${userId}`);
        revalidatePath(`/af-ass-manage/users`);

        const hadInstitutes = currentUser.managedInstitutes.length > 0;
        const removedFromInstitutes = role !== "INSTITUTE_MANAGER" && hadInstitutes;

        return { 
            success: true, 
            message: removedFromInstitutes
                ? "User role updated and automatically removed from all institutes!" 
                : "User profile updated successfully!" 
        };
    } catch (error) {
        console.error("Update User Error:", error);
        return { success: false, error: "Failed to update user details." };
    }
}

// app/actions/adminUsers.ts ke andar add karein:

export async function addManagerRelation(userId: string, instituteId: string) {
    try {
        // 1. Relation Create Karo
        await prisma.instituteManager.create({
            data: { userId, instituteId }
        });

        // 1.5. Create Membership relation as ADMIN so they show up in Team
        const existingMembership = await prisma.instituteMembership.findFirst({
            where: { userId, instituteId, role: 'ADMIN' }
        });

        if (!existingMembership) {
            await prisma.instituteMembership.create({
                data: {
                    userId,
                    instituteId,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    joinedAt: new Date()
                }
            });
        }

        // 2. Agar user normal 'USER' hai, toh usko auto-upgrade karke 'INSTITUTE_MANAGER' bana do
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && user.role === 'USER') {
            await prisma.user.update({
                where: { id: userId },
                data: { role: 'INSTITUTE_MANAGER' }
            });
        }

        revalidatePath(`/af-ass-manage/users/${userId}`);
        return { success: true, message: "Institute assigned successfully!" };
    } catch (error) {
        return { success: false, error: "Relation already exists or failed to assign." };
    }
}

export async function removeManagerRelation(userId: string, instituteId: string) {
    try {
        await prisma.instituteManager.delete({
            where: {
                userId_instituteId: { userId, instituteId }
            }
        });

        await prisma.instituteMembership.deleteMany({
            where: {
                userId,
                instituteId,
                role: 'ADMIN'
            }
        });

        // Check if user has any remaining managed institutes
        const remainingCount = await prisma.instituteManager.count({
            where: { userId }
        });

        if (remainingCount === 0) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.role === 'INSTITUTE_MANAGER') {
                await prisma.user.update({
                    where: { id: userId },
                    data: { role: 'USER' }
                });
            }
        }

        revalidatePath(`/af-ass-manage/users/${userId}`);
        return { success: true, message: "Manager access removed." };
    } catch (error) {
        return { success: false, error: "Failed to remove access." };
    }
}

export async function searchInstitutesForAdmin(query: string) {
    if (!query || query.trim().length < 2) return [];
    try {
        const results = await prisma.institute.findMany({
            where: {
                name: {
                    contains: query.trim(),
                    mode: "insensitive"
                }
            },
            select: {
                id: true,
                name: true,
                city: { select: { name: true } }
            },
            take: 15,
            orderBy: { name: "asc" }
        });

        return results.map((r) => ({
            id: r.id,
            name: r.city?.name ? `${r.name} (${r.city.name})` : r.name
        }));
    } catch (error) {
        console.error("Search institutes error:", error);
        return [];
    }
}