import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ instituteId: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const q = searchParams.get("q") || "";
        const instituteId = (await params).instituteId;

        if (!instituteId) {
            return NextResponse.json({ error: "Missing instituteId" }, { status: 400 });
        }

        let members: any[] = [];

        if (type === "STUDENT") {
            members = await prisma.studentInstituteRecord.findMany({
                where: {
                    instituteId,
                    isVerified: true,
                    isVisible: true,
                    membership: { status: "ACTIVE" },
                    studentProfile: {
                        user: {
                            name: { contains: q, mode: "insensitive" }
                        }
                    }
                },
                take: 20,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    courseName: true,
                    studentProfile: {
                        select: {
                            user: {
                                select: { id: true, name: true, username: true, image: true, allowDms: true }
                            }
                        }
                    }
                }
            });
            members = members.map((m: any) => ({
                id: m.id,
                courseName: m.courseName,
                user: m.studentProfile?.user
            }));
        } else if (type === "TEACHER") {
            members = await prisma.teacherInstituteRecord.findMany({
                where: {
                    instituteId,
                    isVerified: true,
                    isVisible: true,
                    membership: { status: "ACTIVE" },
                    teacherProfile: {
                        user: {
                            name: { contains: q, mode: "insensitive" }
                        }
                    }
                },
                take: 20,
                orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
                select: {
                    id: true,
                    designation: true,
                    teacherProfile: {
                        select: {
                            user: {
                                select: { id: true, name: true, username: true, image: true, allowDms: true }
                            }
                        }
                    }
                }
            });
            members = members.map((m: any) => ({
                id: m.id,
                designation: m.designation,
                user: m.teacherProfile?.user
            }));
        } else if (type === "MANAGER") {
            members = await prisma.instituteManager.findMany({
                where: {
                    instituteId,
                    user: {
                        name: { contains: q, mode: "insensitive" },
                        role: { notIn: ["SALES_MANAGER", "INSTITUTE_SALES_MANAGER"] },
                    }
                },
                take: 20,
                select: {
                    user: {
                        select: { id: true, name: true, username: true, image: true, allowDms: true }
                    }
                }
            });
            members = members.map((m: any) => ({
                id: m.user.id,
                user: m.user
            }));
        }

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Members API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
