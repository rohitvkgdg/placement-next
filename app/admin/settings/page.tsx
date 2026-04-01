import { prisma } from "@/lib/prisma"
import { AdminSettingsView } from "@/components/admin/admin-settings-view"

const SETTINGS_ID = "default"

export default async function AdminSettingsPage() {
  // Fetch fresh data directly (admin always sees latest)
  const [adminSettings, siteSettings] = await Promise.all([
    prisma.adminSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    }),
    prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    }),
  ])

  return (
    <AdminSettingsView
      adminSettings={{
        activeAdmissionYears: adminSettings.activeAdmissionYears,
        collegeCode: adminSettings.collegeCode,
      }}
      siteSettings={{
        placementSeasonName: siteSettings.placementSeasonName,
        activeBatch: siteSettings.activeBatch,
        announcementText: siteSettings.announcementText,
        announcementActive: siteSettings.announcementActive,
        registrationOpen: siteSettings.registrationOpen,
      }}
    />
  )
}
