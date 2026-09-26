import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NoticeBoardManager } from "./NoticeBoardManager";

type Props = { params: Promise<{ instituteId: string }> };

export const metadata = {
  title: "Notice Board | Manager Dashboard | AcademyFind",
  robots: { index: false, follow: false },
};

export default async function ManagerNoticesPage({ params }: Props) {
  const { instituteId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: { id: true, name: true },
  });
  if (!institute) notFound();

  const now = new Date();
  const notices = await prisma.instituteNotice.findMany({
    where: { instituteId, isActive: true },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      priority: true,
      visibility: true,
      isPinned: true,
      expiresAt: true,
      attachmentUrl: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  return (
    <NoticeBoardManager
      instituteId={instituteId}
      instituteName={institute.name}
      initialNotices={notices as any}
    />
  );
}
