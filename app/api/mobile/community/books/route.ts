import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserId } from '@/lib/auth/getMobileUserId';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('examCategory') || 'ALL';
    const city = searchParams.get('city') || 'ALL';
    const search = searchParams.get('search') || '';
    const isFree = searchParams.get('isFree') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where: any = {
      status: 'AVAILABLE',
    };

    if (examCategory !== 'ALL') {
      where.examCategory = { equals: examCategory, mode: 'insensitive' };
    }

    if (city !== 'ALL') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (isFree) {
      where.isFree = true;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { instituteName: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.bookListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      prisma.bookListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        books,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Mobile Books Error:', error);
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
        { success: false, error: 'Unauthorized: Please login' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      author,
      instituteName,
      examCategory,
      subject = 'General',
      condition = 'LIKE_NEW',
      price = 0,
      originalPrice,
      isFree = false,
      description,
      images = [],
      city,
      locality,
    } = body;

    if (!title?.trim() || !examCategory?.trim() || !city?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title, exam category, and city are required' },
        { status: 400 }
      );
    }

    const finalIsFree = isFree || price === 0;

    const listing = await prisma.bookListing.create({
      data: {
        sellerId: userId,
        title: title.trim(),
        author: author?.trim() || null,
        instituteName: instituteName?.trim() || null,
        examCategory: examCategory.trim().toUpperCase(),
        subject: subject?.trim() || 'General',
        condition,
        price: finalIsFree ? 0 : Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        isFree: finalIsFree,
        description: description?.trim() || null,
        images: Array.isArray(images) ? images : [],
        city: city.trim(),
        locality: locality?.trim() || null,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json({
      success: true,
      data: listing,
      message: 'Book listed successfully on the community marketplace! 📚',
    });
  } catch (error: any) {
    console.error('Create Book Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list book' },
      { status: 500 }
    );
  }
}
