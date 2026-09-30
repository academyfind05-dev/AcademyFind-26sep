import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve actual institute ID if slug was passed
    let instituteId = id;
    const inst = await prisma.institute.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (inst) {
      instituteId = inst.id;
    }

    const [
      students,
      teachers,
      managers,
      totalStudents,
      totalTeachers,
      flatMembers,
    ] = await Promise.all([
      prisma.studentInstituteRecord.findMany({
        where: {
          instituteId,
          isVisible: true,
          membership: { status: 'ACTIVE', isActive: true },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          courseName: true,
          batchYear: true,
          bio: true,
          isVerified: true,
          allowMessaging: true,
          studentProfile: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  allowDms: true,
                },
              },
            },
          },
        },
      }),

      prisma.teacherInstituteRecord.findMany({
        where: {
          instituteId,
          isVisible: true,
          membership: { status: 'ACTIVE', isActive: true },
        },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
        take: 30,
        select: {
          id: true,
          designation: true,
          department: true,
          teachingSubjects: true,
          isFeatured: true,
          isVerified: true,
          bio: true,
          teacherProfile: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  allowDms: true,
                },
              },
            },
          },
        },
      }),

      prisma.instituteManager.findMany({
        where: {
          instituteId,
          user: { role: { notIn: ['SALES_MANAGER', 'INSTITUTE_SALES_MANAGER'] } },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              allowDms: true,
            },
          },
        },
        take: 10,
      }),

      prisma.studentInstituteRecord.count({
        where: {
          instituteId,
          isVisible: true,
          membership: { status: 'ACTIVE', isActive: true },
        },
      }),

      prisma.teacherInstituteRecord.count({
        where: {
          instituteId,
          isVisible: true,
          membership: { status: 'ACTIVE', isActive: true },
        },
      }),

      // Flat legacy membership support
      prisma.instituteMembership.findMany({
        where: {
          instituteId,
          status: 'ACTIVE',
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, name: true, image: true, username: true },
          },
        },
        take: 30,
      }),
    ]);

    const formattedStudents = students.map((s) => ({
      id: s.id,
      role: 'STUDENT',
      courseName: s.courseName,
      batchYear: s.batchYear,
      bio: s.bio,
      isVerified: s.isVerified,
      allowMessaging: s.allowMessaging,
      user: s.studentProfile.user,
    }));

    const formattedTeachers = teachers.map((t) => ({
      id: t.id,
      role: 'TEACHER',
      designation: t.designation,
      department: t.department,
      teachingSubjects: t.teachingSubjects,
      isFeatured: t.isFeatured,
      isVerified: t.isVerified,
      bio: t.bio,
      user: t.teacherProfile.user,
    }));

    const formattedManagers = managers.map((m) => ({
      id: `${m.userId}-${m.instituteId}`,
      role: 'MANAGER',
      designation: 'Institute Manager',
      user: m.user,
    }));

    const counts = {
      total: totalStudents + totalTeachers + managers.length,
      students: totalStudents,
      teachers: totalTeachers,
      managers: managers.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        students: formattedStudents,
        teachers: formattedTeachers,
        managers: formattedManagers,
        counts,
        members: flatMembers,
      },
    });
  } catch (error: any) {
    console.error('Mobile Members Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
