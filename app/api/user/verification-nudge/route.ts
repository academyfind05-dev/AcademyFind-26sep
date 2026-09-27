import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/auth/session";
import { getMobileUserId } from "@/lib/auth/getMobileUserId";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    const session = await getCachedSession();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      userId = await getMobileUserId(request);
    }

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        shouldNudge: false,
        hasWrittenBlog: false,
      });
    }

    // Check if user has written, submitted, or published any blog post
    const [user, blogCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          phoneVerified: true,
          email: true,
        },
      }),
      prisma.blogPost.count({
        where: {
          OR: [
            { authorProfile: { userId } },
            { publishedById: userId },
            { lastEditedById: userId },
          ],
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        shouldNudge: false,
        hasWrittenBlog: false,
      });
    }

    const hasWrittenBlog = blogCount > 0;

    // Gate: ONLY show the verification nudge to users who have written/submitted/published a blog
    if (!hasWrittenBlog) {
      return NextResponse.json({
        authenticated: true,
        shouldNudge: false,
        hasWrittenBlog: false,
        blogCount: 0,
      });
    }

    const isPhoneVerified = Boolean(user.phoneVerified);
    const hasRealEmail = Boolean(
      user.email && !user.email.endsWith("@phone.academyfind.com")
    );

    let nudgeType: "phone" | "email" | null = null;
    if (!isPhoneVerified) {
      nudgeType = "phone";
    } else if (!hasRealEmail) {
      nudgeType = "email";
    }

    return NextResponse.json({
      authenticated: true,
      shouldNudge: nudgeType !== null,
      nudgeType,
      phone: user.phone || "",
      phoneVerified: isPhoneVerified,
      email: user.email || "",
      hasWrittenBlog: true,
      blogCount,
    });
  } catch (error: any) {
    console.error("[verification-nudge] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", shouldNudge: false },
      { status: 500 }
    );
  }
}
