import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserId } from '@/lib/auth/getMobileUserId';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('examCategory') || 'ALL';
    const city = searchParams.get('city') || 'ALL';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const userId = await getMobileUserId(request);
    const skip = (page - 1) * limit;

    const where: any = {
      isVisible: true,
      lookingForBuddy: true,
      ...(userId ? { userId: { not: userId } } : {}),
    };

    if (examCategory !== 'ALL') {
      where.targetExam = { contains: examCategory, mode: 'insensitive' };
    }

    if (city !== 'ALL') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { targetExam: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { headline: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [buddies, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          targetExam: true,
          targetYear: true,
          city: true,
          headline: true,
          bio: true,
          subjects: true,
          preferredMedium: true,
          lookingForBuddy: true,
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
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        buddies,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Mobile Buddies Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
