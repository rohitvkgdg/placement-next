import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSiteSettings } from "@/lib/settings"
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view"

export default async function AdminDashboardPage() {
  const session = await auth()

  const siteSettings = await getSiteSettings()

  // Fetch comprehensive dashboard data
  const [
    totalStudents,
    verifiedStudents,
    pendingVerifications,
    totalRecruiters,
    activeJobPostings,
    totalApplications,
    placedStudents,
    upcomingInterviews,
    recentActivities,
    placementStats,
    branchWiseStats,
    monthlyTrends,
    // Batch-specific stats
    batchStudents,
    batchPlacedStudents,
    batchPlacements,
    tierDistribution
  ] = await Promise.all([
    // Total registered students
    prisma.user.count({
      where: { role: 'STUDENT' }
    }),

    // Verified students (KYC approved)
    prisma.profile.count({
      where: { kycStatus: 'VERIFIED' }
    }),

    // Pending verifications
    prisma.profile.count({
      where: { kycStatus: 'PENDING' }
    }),

    // Total recruiters
    prisma.user.count({
      where: { role: 'RECRUITER' }
    }),

    // Active job postings (fixed: was using scheduleEvent)
    prisma.job.count({
      where: {
        status: 'ACTIVE',
        isVisible: true
      }
    }),

    // Total applications (fixed: was using profile count)
    prisma.application.count({
      where: { isRemoved: false }
    }),

    // Placed students (fixed: was using verified profile count)
    prisma.placement.count(),

    // Upcoming interviews/events
    prisma.scheduleEvent.count({
      where: {
        status: 'SCHEDULED',
        date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),

    // Recent activities (last 10 profile updates)
    prisma.profile.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }),

    // Placement statistics by branch
    prisma.profile.groupBy({
      by: ['branch'],
      where: {
        branch: { not: null },
        kycStatus: 'VERIFIED'
      },
      _count: { branch: true }
    }),

    // Branch-wise student distribution
    prisma.profile.groupBy({
      by: ['branch'],
      where: { branch: { not: null } },
      _count: { branch: true }
    }),

    // Monthly registration trends (last 6 months)
    prisma.$queryRaw<{ month: Date; count: bigint }[]>`
      SELECT
        DATE_TRUNC('month', "created_at") as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
        AND "created_at" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY month ASC
    `,

    // Batch-specific: students in active batch
    prisma.profile.count({
      where: { batch: { startsWith: siteSettings.activeBatch.substring(0, 4) } }
    }),

    // Batch-specific: placed students in active batch
    prisma.placement.count({
      where: {
        user: {
          profile: {
            batch: { startsWith: siteSettings.activeBatch.substring(0, 4) }
          }
        }
      }
    }),

    // Batch-specific: placements with salary for avg calculation
    prisma.placement.findMany({
      where: {
        user: {
          profile: {
            batch: { startsWith: siteSettings.activeBatch.substring(0, 4) }
          }
        }
      },
      select: { salary: true, tier: true }
    }),

    // Tier distribution
    prisma.placement.groupBy({
      by: ['tier'],
      _count: { tier: true }
    })
  ])

  const avgPackage = batchPlacements.length > 0
    ? batchPlacements.reduce((sum, p) => sum + p.salary, 0) / batchPlacements.length
    : 0

  const placementRate = batchStudents > 0
    ? Math.round((batchPlacedStudents / batchStudents) * 100)
    : 0

  const dashboardData = {
    overview: {
      totalStudents,
      verifiedStudents,
      pendingVerifications,
      totalRecruiters,
      activeJobPostings,
      totalApplications,
      placedStudents,
      upcomingInterviews
    },
    batchStats: {
      batchStudents,
      batchPlacedStudents,
      avgPackage,
      placementRate,
      tierDistribution: tierDistribution.map(t => ({
        tier: t.tier,
        count: t._count.tier
      }))
    },
    siteSettings: {
      placementSeasonName: siteSettings.placementSeasonName,
      activeBatch: siteSettings.activeBatch,
      announcementText: siteSettings.announcementText,
      announcementActive: siteSettings.announcementActive,
      registrationOpen: siteSettings.registrationOpen,
    },
    activities: recentActivities,
    stats: {
      placementStats,
      branchWiseStats,
      monthlyTrends
    },
    user: {
      name: session?.user?.name || 'Admin',
      email: session?.user?.email || ''
    }
  }

  return <AdminDashboardView data={dashboardData} />
}
