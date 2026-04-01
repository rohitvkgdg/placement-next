import { prisma } from "@/lib/prisma"
import { BackupView } from "@/components/admin/backup-view"

export default async function BackupPage() {
  const backupLogs = await prisma.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      admin: {
        select: { name: true, email: true },
      },
    },
  })

  return <BackupView initialLogs={backupLogs} />
}
