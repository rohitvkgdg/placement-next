import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSiteSettings } from "@/lib/settings"
import { canApplyToTier, getHighestTier } from "@/lib/placement-rules"

type JobWithDetails = {
    id: string
    title: string
    companyId: string | null
    companyName: string
    companyLogo: string | null
    location: string
    category: string
    tier: string
    isDreamOffer: boolean
    jobType: string
    workMode: string
    salary: string | null
    minSalary: number | null
    maxSalary: number | null
    minCGPA: number | null
    allowedBranches: string[]
    eligibleBatch: string | null
    maxBacklogs: number | null
    requiredSkills: string[]
    deadline: Date | null
    noOfPositions: number | null
    createdAt: Date
    updatedAt: Date
    updates: {
        id: string
        title: string
        message: string
        createdAt: Date
    }[]
    _count: {
        applications: number
    }
}

// GET - List active jobs for students
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || ""
        const category = searchParams.get("category")
        const workMode = searchParams.get("workMode")
        const tier = searchParams.get("tier")
        const rawPage = parseInt(searchParams.get("page") || "1", 10)
        const rawLimit = parseInt(searchParams.get("limit") || "10", 10)
        const page = isNaN(rawPage) ? 1 : Math.max(rawPage, 1)
        const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 100)
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {
            status: "ACTIVE",
            isVisible: true,
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
            ]
        }

        if (category && category !== "ALL") {
            where.category = category
        }

        if (workMode && workMode !== "ALL") {
            where.workMode = workMode
        }

        if (tier && tier !== "ALL") {
            where.tier = tier
        }

        // Get user's profile and placement status
        const [userProfile, userPlacements] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: session.user.id },
                select: {
                    branch: true,
                    batch: true,
                    finalCgpa: true,
                    cgpa: true,
                    activeBacklogs: true,
                    hasBacklogs: true,
                }
            }),
            prisma.placement.findMany({
                where: { userId: session.user.id },
                select: { tier: true, isException: true }
            })
        ])

        // Determine highest tier placement (exceptions don't count toward tier lock)
        const highestTierPlacement = getHighestTier(userPlacements.filter((p) => !p.isException))

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy: {
                    createdAt: "desc"
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    companyId: true,
                    companyName: true,
                    companyLogo: true,
                    location: true,
                    category: true,
                    tier: true,
                    isDreamOffer: true,
                    jobType: true,
                    workMode: true,
                    salary: true,
                    minSalary: true,
                    maxSalary: true,
                    minCGPA: true,
                    allowedBranches: true,
                    eligibleBatch: true,
                    maxBacklogs: true,
                    requiredSkills: true,
                    deadline: true,
                    noOfPositions: true,
                    createdAt: true,
                    updatedAt: true,
                    updates: {
                        orderBy: { createdAt: "desc" },
                        take: 3,
                        select: {
                            id: true,
                            title: true,
                            message: true,
                            createdAt: true
                        }
                    },
                    _count: {
                        select: {
                            applications: {
                                where: { isRemoved: false }
                            }
                        }
                    }
                }
            }),
            prisma.job.count({ where })
        ])

        // Check if user has already applied to each job
        const userApplications = await prisma.application.findMany({
            where: {
                userId: session.user.id,
                jobId: { in: jobs.map((j: JobWithDetails) => j.id) },
                isRemoved: false
            },
            select: {
                jobId: true,
                appliedAt: true
            }
        })

        const applicationMap = new Map(userApplications.map((a: { jobId: string; appliedAt: Date }) => [a.jobId, a.appliedAt]))

        // Add eligibility and application status to each job
        const cgpa = userProfile?.finalCgpa || userProfile?.cgpa || 0

        const jobsWithEligibility = jobs.map((job: JobWithDetails) => {
            let isEligible = true
            const eligibilityIssues: string[] = []

            // Check tier eligibility first
            const tierCheck = canApplyToTier(highestTierPlacement, job.tier, job.isDreamOffer)
            if (!tierCheck.eligible) {
                isEligible = false
                if (tierCheck.reason) eligibilityIssues.push(tierCheck.reason)
            }

            if (userProfile) {
                // Check CGPA
                if (job.minCGPA && cgpa < job.minCGPA) {
                    isEligible = false
                    eligibilityIssues.push(`Minimum CGPA required: ${job.minCGPA} (yours: ${cgpa.toFixed(2)})`)
                }

                // Check branch
                if (job.allowedBranches.length > 0 && userProfile.branch) {
                    if (!job.allowedBranches.includes(userProfile.branch)) {
                        isEligible = false
                        eligibilityIssues.push(`Your branch (${userProfile.branch}) is not eligible`)
                    }
                }

                // Check batch
                if (job.eligibleBatch && userProfile.batch && userProfile.batch !== job.eligibleBatch) {
                    isEligible = false
                    eligibilityIssues.push(`Only ${job.eligibleBatch} batch is eligible`)
                }

                // Check backlogs
                const hasActiveBacklogs = userProfile.activeBacklogs || userProfile.hasBacklogs === "yes"
                if (job.maxBacklogs !== null && job.maxBacklogs === 0 && hasActiveBacklogs) {
                    isEligible = false
                    eligibilityIssues.push(`No active backlogs allowed`)
                }
            }

            // Check deadline
            if (job.deadline && new Date(job.deadline) < new Date()) {
                isEligible = false
                eligibilityIssues.push("Application deadline has passed")
            }

            const hasApplied = applicationMap.has(job.id)

            return {
                ...job,
                isEligible,
                eligibilityIssues,
                hasApplied,
                appliedAt: applicationMap.get(job.id) || null,
                hasUpdates: job.updates.length > 0,
                latestUpdate: job.updates[0] || null
            }
        })

        const siteSettings = await getSiteSettings()

        return NextResponse.json({
            success: true,
            data: {
                jobs: jobsWithEligibility,
                userPlacementTier: highestTierPlacement,
                registrationOpen: siteSettings.registrationOpen,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error("Error fetching jobs:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
