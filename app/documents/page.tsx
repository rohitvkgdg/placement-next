import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { checkYearAccess } from "@/lib/year-gate"
import { DocumentsView } from "@/components/documents-view"

export default async function DocumentsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const yearAccess = await checkYearAccess(session)
  if (!yearAccess.authorized) {
    redirect("/not-authorized")
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      isComplete: true,
      resumeUpload: true,
      resume: true,
      profilePhoto: true,
      tenthMarksCard: true,
      twelfthMarksCard: true,
      diplomaCertificate: true,
      semesterMarksCards: true,
    },
  })

  if (!profile?.isComplete) {
    redirect("/profile")
  }

  return <DocumentsView profile={profile} />
}
