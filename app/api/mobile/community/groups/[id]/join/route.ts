import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserId } from '@/lib/auth/getMobileUserId';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please login' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const group = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Study group not found' },
        { status: 404 }
      );
    }

    if (group.participants && group.participants.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        conversationId: group.id,
        message: 'You are already a member of this study group.',
      });
    }

    if (group.maxMembers && group.memberCount >= group.maxMembers) {
      return NextResponse.json(
        { success: false, error: 'This study group has reached its maximum member limit.' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.conversationParticipant.create({
        data: {
          conversationId: group.id,
          userId,
          role: 'MEMBER',
        },
      }),
      prisma.conversation.update({
        where: { id: group.id },
        data: {
          memberCount: { increment: 1 },
          lastActivityAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversationId: group.id,
      message: 'Successfully joined study group! 🎉',
    });
  } catch (error: any) {
    console.error('Join Study Group Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join group' },
      { status: 500 }
    );
  }
}
