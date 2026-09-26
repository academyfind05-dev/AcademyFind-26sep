import { requireAuth } from "@/lib/auth/requireAuth";
import { prisma } from "@/lib/prisma";
import { ProfileForms } from "@/app/(app)/settings/profile/ProfileForms";

export default async function ProfileSettingsPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      phone: true,
      phoneVerified: true,
      image: true,
      coverImage: true,
      studentProfile: {
        select: {
          headline: true,
          bio: true,
          targetExam: true,
          currentClass: true,
          isVisible: true,
        },
      },
      teacherProfile: {
        select: {
          headline: true,
          bio: true,
          qualification: true,
          experience: true,
          subjects: true,
          languages: true,
          isVisible: true,
        },
      },
      memberships: {
        where: { isActive: true },
        select: {
          id: true,
          role: true,
          status: true,
          institute: { select: { name: true, slug: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-slate-500">
        Your global identity and role profiles live here.
      </p>
      <div className="mt-7">
        <ProfileForms
          user={user}
          student={user.studentProfile}
          teacher={user.teacherProfile}
        />
      </div>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Institute memberships</h2>
        <p className="mt-1 text-sm text-slate-500">
          These are sourced from InstituteMembership and must be managed at each
          institute.
        </p>
        <div className="mt-4 space-y-2">
          {user.memberships.map((membership: any) => (
            <div
              key={membership.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
            >
              <span>{membership.institute.name}</span>
              <span className="text-slate-500">
                {membership.role} · {membership.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
