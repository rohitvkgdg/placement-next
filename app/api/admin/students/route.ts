import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"

// GET - Search/list students for admin use (e.g. placement form)
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = request.nextUrl
        const search = searchParams.get("search") || ""
        const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50)

        const where = search
            ? {
                  role: "STUDENT" as const,
                  OR: [
                      { name: { contains: search, mode: "insensitive" as const } },
                      { email: { contains: search, mode: "insensitive" as const } },
                      {
                          profile: {
                              OR: [
                                  { usn: { contains: search, mode: "insensitive" as const } },
                                  { firstName: { contains: search, mode: "insensitive" as const } },
                                  { lastName: { contains: search, mode: "insensitive" as const } },
                              ],
                          },
                      },
                  ],
              }
            : { role: "STUDENT" as const }

        const students = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        usn: true,
                        branch: true,
                        batch: true,
                        kycStatus: true,
                    },
                },
            },
            orderBy: { name: "asc" },
            take: limit,
        })

        return NextResponse.json({ success: true, data: { students } })
    } catch (error) {
        console.error("Error fetching students:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
