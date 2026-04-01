import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

type ScheduleEvent = {
  id: string
  title: string
  description: string | null
  date: Date
  duration: number | null
  location: string | null
  type: string
  company: string | null
  status: string
  isVisible: boolean
  createdBy: string
  maxAttendees: number | null
  attendees: {
    user: {
      id: string
      name: string | null
      email: string
    }
  }[]
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'

    const events = await prisma.scheduleEvent.findMany({
      where: isAdmin ? {} : { isVisible: true },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform the data to match the frontend interface
    const transformedEvents = events.map((event: ScheduleEvent) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.date.toTimeString().slice(0, 5),
      duration: event.duration,
      location: event.location,
      type: event.type.toLowerCase(),
      company: event.company,
      attendees: event.attendees.length,
      maxAttendees: event.maxAttendees,
      status: event.status.toLowerCase(),
      isVisible: event.isVisible,
      createdBy: event.createdBy
    }))

    return NextResponse.json({ success: true, data: transformedEvents })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date, time, duration, location, type, company, maxAttendees, isVisible } = body

    if (!title || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Combine date and time
    const eventDateTime = new Date(`${date}T${time}:00`)

    const event = await prisma.scheduleEvent.create({
      data: {
        title,
        description,
        date: eventDateTime,
        duration: duration || 60,
        location,
        type: type.toUpperCase(),
        company,
        maxAttendees,
        isVisible: isVisible ?? true,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Transform the response
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.date.toTimeString().slice(0, 5),
      duration: event.duration,
      location: event.location,
      type: event.type.toLowerCase(),
      company: event.company,
      attendees: event.attendees.length,
      maxAttendees: event.maxAttendees,
      status: event.status.toLowerCase(),
      isVisible: event.isVisible,
      createdBy: event.createdBy
    }

    return NextResponse.json({ success: true, data: transformedEvent }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
