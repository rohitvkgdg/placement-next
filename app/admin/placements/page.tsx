import { prisma } from "@/lib/prisma"
import { PlacementTrackingView } from "@/components/admin/placement-tracking-view"

export default async function PlacementTrackingPage() {
  // Fetch placement tracking data
  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    attendeeStats,
    branchWisePlacement,
    recentPlacements
  ] = await Promise.all([
    // Total placement events
    prisma.scheduleEvent.count(),

    // Upcoming events
    prisma.scheduleEvent.findMany({
      where: {
        status: 'SCHEDULED',
        date: { gte: new Date() }
      },
      include: {
        attendees: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    branch: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 10
    }),

    // Completed events
    prisma.scheduleEvent.count({
      where: { status: 'COMPLETED' }
    }),

    // Event attendee statistics
    prisma.eventAttendee.groupBy({
      by: ['status'],
      _count: { status: true }
    }),

    // Branch-wise placement data (using profile data as proxy)
    prisma.profile.groupBy({
      by: ['branch'],
      where: {
        branch: { not: null },
        kycStatus: 'VERIFIED'
      },
      _count: { branch: true }
    }),

    // Recent placements (using recent profile updates as proxy)
    prisma.profile.findMany({
      where: {
        kycStatus: 'VERIFIED',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })
  ])

  const placementData = {
    overview: {
      totalEvents,
      upcomingEventsCount: upcomingEvents.length,
      completedEvents,
      totalAttendees: attendeeStats.reduce((acc: number, stat: { _count: { status: number } }) => acc + stat._count.status, 0)
    },
    upcomingEvents,
    attendeeStats,
    branchWisePlacement,
    recentPlacements
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Placement Tracking</h1>
      </div>

      <PlacementTrackingView data={placementData} />
    </div>
  )
}
