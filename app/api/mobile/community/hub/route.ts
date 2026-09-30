import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserId } from '@/lib/auth/getMobileUserId';

export async function GET(request: NextRequest) {
  try {
    const userId = await getMobileUserId(request);

    const [groups, buddies, books, totalGroups, totalBuddies, totalBooks] =
      await Promise.all([
        // Trending Study Groups
        prisma.conversation.findMany({
          where: {
            isStudyGroup: true,
            visibility: 'PUBLIC',
          },
          orderBy: [
            { memberCount: 'desc' },
            { lastActivityAt: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 6,
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

        // Active Nearby Study Buddies
        prisma.studentProfile.findMany({
          where: {
            isVisible: true,
            lookingForBuddy: true,
            ...(userId ? { userId: { not: userId } } : {}),
          },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          select: {
            id: true,
            userId: true,
            targetExam: true,
            targetYear: true,
            city: true,
            headline: true,
            bio: true,
            subjects: true,
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

        // Recent Marketplace Book Listings
        prisma.bookListing.findMany({
          where: {
            status: 'AVAILABLE',
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            title: true,
            author: true,
            instituteName: true,
            examCategory: true,
            subject: true,
            condition: true,
            price: true,
            originalPrice: true,
            isFree: true,
            description: true,
            images: true,
            city: true,
            locality: true,
            createdAt: true,
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        }),

        // Stats
        prisma.conversation.count({
          where: { isStudyGroup: true, visibility: 'PUBLIC' },
        }),
        prisma.studentProfile.count({
          where: { isVisible: true, lookingForBuddy: true },
        }),
        prisma.bookListing.count({
          where: { status: 'AVAILABLE' },
        }),
      ]);

    const formattedGroups = groups.map((g: any) => ({
      ...g,
      isJoined: userId ? (g.participants && g.participants.length > 0) : false,
      participants: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        groups: formattedGroups,
        buddies,
        books,
        stats: {
          totalGroups,
          totalBuddies,
          totalBooks,
        },
      },
    });
  } catch (error: any) {
    console.error('Community Hub Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
