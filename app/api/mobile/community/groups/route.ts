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
      isStudyGroup: true,
      visibility: 'PUBLIC',
    };

    if (examCategory !== 'ALL') {
      where.examCategory = { equals: examCategory, mode: 'insensitive' };
    }

    if (city !== 'ALL') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { examCategory: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { memberCount: 'desc' },
          { lastActivityAt: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          examCategory: true,
          subject: true,
          city: true,
          tags: true,
          memberCount: true,
          maxMembers: true,
          createdAt: true,
          createdById: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          ...(userId
            ? {
                participants: {
                  where: { userId },
                  select: { id: true, role: true },
                },
              }
            : {}),
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    const formatted = groups.map((g: any) => ({
      ...g,
      isJoined: userId ? (g.participants && g.participants.length > 0) : false,
      participants: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        groups: formatted,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Mobile Study Groups Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please login first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      examCategory,
      subject = 'All Subjects',
      city = 'Online / Pan-India',
      tags = [],
      rules,
      imageUrl,
      maxMembers = 500,
    } = body;

    if (!title?.trim() || !description?.trim() || !examCategory?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and exam category are required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        visibility: 'PUBLIC',
        isStudyGroup: true,
        title: title.trim(),
        description: description.trim(),
        examCategory: examCategory.trim().toUpperCase(),
        subject: subject || 'All Subjects',
        city: city || 'Online / Pan-India',
        tags: Array.isArray(tags) ? tags : [],
        rules: rules?.trim() || null,
        imageUrl: imageUrl || null,
        maxMembers: typeof maxMembers === 'number' ? maxMembers : 500,
        memberCount: 1,
        createdById: userId,
        lastActivityAt: new Date(),
        participants: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
      message: 'Study group created successfully! 🎉',
    });
  } catch (error: any) {
    console.error('Create Study Group Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create study group' },
      { status: 500 }
    );
  }
}
