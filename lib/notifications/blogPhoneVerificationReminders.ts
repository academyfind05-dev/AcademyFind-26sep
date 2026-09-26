import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { buildBlogPhoneVerificationEmailHtml } from "./blogTemplates";
import { NotificationType } from "@/app/generated/prisma/enums";

interface TriggerVerificationAbandonedInput {
  postId: string;
  userId: string;
}

/**
 * Triggered when a blog writer attempts to publish but abandons at the phone verification modal.
 * 1. Creates an in-app UserNotification with direct resume link
 * 2. Creates an AdminNotification alerting admins of the unverified draft
 * 3. Sends an immediate branded email reminder via Resend
 * 4. Records reminder #1 on the blog post
 */
export async function triggerBlogPhoneVerificationAbandoned({
  postId,
  userId,
}: TriggerVerificationAbandonedInput) {
  try {
    const [user, post] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, phoneVerified: true },
      }),
      prisma.blogPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          phoneVerificationReminderCount: true,
        },
      }),
    ]);

    if (!user || !post) return { success: false, error: "User or post not found" };

    // If user is already phone verified, no reminder needed
    if (user.phoneVerified) return { success: true, message: "User already phone verified" };

    const baseUrl = process.env.BASE_URL || "https://academyfind.com";
    const verifyUrl = `${baseUrl}/blog/editor?id=${post.id}&verifyPhone=true`;
    const writerName = user.name || "Valued Author";

    // 1. Create In-App UserNotification
    await prisma.userNotification.create({
      data: {
        userId: user.id,
        type: NotificationType.NOTICE,
        title: "Verify Phone to Publish Article",
        body: `Your article "${post.title}" is saved as a draft. Click to verify your phone number and publish it.`,
        entityId: post.id,
      },
    });

    // 2. Create AdminNotification
    await prisma.adminNotification.create({
      data: {
        type: "BLOG_PENDING_PHONE_VERIFICATION",
        title: "Blog Pending Phone Verification",
        message: `Author "${user.name || user.email}" attempted to publish "${post.title}", but phone verification is pending.`,
        actionUrl: `/af-ass-manage/blog?query=${encodeURIComponent(post.slug)}`,
        referenceId: post.id,
        userId: user.id,
      },
    });

    // 3. Send Email Reminder #1 (if legitimate email available)
    let emailSent = false;
    if (user.email && !user.email.endsWith("@phone.academyfind.com")) {
      const emailHtml = buildBlogPhoneVerificationEmailHtml({
        writerName,
        articleTitle: post.title,
        verifyUrl,
        reminderNumber: 1,
      });

      const emailRes = await sendEmail(
        user.email,
        `Action Required: Verify your phone to publish "${post.title}" on AcademyFind`,
        emailHtml
      );
      emailSent = emailRes.success;
    }

    // 4. Update reminder tracking on BlogPost
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        phoneVerificationReminderCount: 1,
        lastPhoneReminderAt: new Date(),
      },
    });

    return {
      success: true,
      emailSent,
      verifyUrl,
      postId: post.id,
    };
  } catch (error) {
    console.error("[blogPhoneReminders] triggerBlogPhoneVerificationAbandoned error:", error);
    return { success: false, error };
  }
}

/**
 * Periodic follow-up service for cron jobs.
 * Scans for unverified authors who abandoned publishing, sending reminder #2 (after 24h) and reminder #3 (after 48h).
 */
export async function runPeriodicBlogPhoneReminders() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingPosts = await prisma.blogPost.findMany({
      where: {
        status: "DRAFT",
        phoneVerificationReminderCount: { gte: 1, lt: 3 },
        lastPhoneReminderAt: { lte: oneDayAgo },
        authorProfile: {
          user: {
            phoneVerified: false,
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        phoneVerificationReminderCount: true,
        authorProfile: {
          select: {
            displayName: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneVerified: true,
              },
            },
          },
        },
      },
      take: 50,
    });

    const baseUrl = process.env.BASE_URL || "https://academyfind.com";
    const results = [];

    for (const post of pendingPosts) {
      const user = post.authorProfile?.user;
      if (!user || user.phoneVerified) continue;

      const nextReminderNumber = (post.phoneVerificationReminderCount || 1) + 1;
      const verifyUrl = `${baseUrl}/blog/editor?id=${post.id}&verifyPhone=true`;
      const writerName = user.name || post.authorProfile?.displayName || "Valued Author";

      // 1. Send Follow-up Email
      let emailSent = false;
      if (user.email && !user.email.endsWith("@phone.academyfind.com")) {
        const subject =
          nextReminderNumber >= 3
            ? `Final Reminder: Complete verification to publish "${post.title}" on AcademyFind`
            : `Reminder: Your article "${post.title}" is waiting to be published on AcademyFind`;

        const emailHtml = buildBlogPhoneVerificationEmailHtml({
          writerName,
          articleTitle: post.title,
          verifyUrl,
          reminderNumber: nextReminderNumber,
        });

        const emailRes = await sendEmail(user.email, subject, emailHtml);
        emailSent = emailRes.success;
      }

      // 2. Create updated In-App Notification
      await prisma.userNotification.create({
        data: {
          userId: user.id,
          type: NotificationType.NOTICE,
          title: `Reminder: Verify Phone for "${post.title}"`,
          body: `Don't let your article stay in drafts. Verify your phone in 10 seconds to publish it.`,
          entityId: post.id,
        },
      });

      // 3. Update blog post reminder count
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          phoneVerificationReminderCount: nextReminderNumber,
          lastPhoneReminderAt: new Date(),
        },
      });

      results.push({
        postId: post.id,
        reminderNumber: nextReminderNumber,
        emailSent,
      });
    }

    return { success: true, processedCount: results.length, results };
  } catch (error) {
    console.error("[blogPhoneReminders] runPeriodicBlogPhoneReminders error:", error);
    return { success: false, error };
  }
}
