import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSiteSettings } from "@/lib/settings"

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

// Helper to check tier eligibility
function canApplyToTier(studentTier: string | null, jobTier: string, isDreamOffer: boolean): { eligible: boolean; reason?: string } {
    // Dream offers are open to everyone
    if (isDreamOffer) {
        return { eligible: true }
    }

    // If student has no placement, they can apply to any tier
    if (!studentTier) {
        return { eligible: true }
    }

    // Tier 1 placed students are blocked from all placements
    if (studentTier === "TIER_1") {
        return { eligible: false, reason: "You are already placed in Tier 1 and blocked from further placements" }
    }

    // Tier 2 placed students can only apply to Tier 1
    if (studentTier === "TIER_2") {
        if (jobTier === "TIER_1") {
            return { eligible: true }
        }
        return { eligible: false, reason: "You are placed in Tier 2. You can only apply for Tier 1 jobs (>9 LPA)" }
    }

    // Tier 3 placed students can apply to Tier 2 and Tier 1
    if (studentTier === "TIER_3") {
        if (jobTier === "TIER_1" || jobTier === "TIER_2") {
            return { eligible: true }
        }
        return { eligible: false, reason: "You are placed in Tier 3. You can only apply for Tier 1 or Tier 2 jobs" }
    }

    return { eligible: true }
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

        // Determine highest tier placement
        let highestTierPlacement: string | null = null
        const tierOrder = ["TIER_1", "TIER_2", "TIER_3"]
        for (const placement of userPlacements) {
            if (!placement.isException) {
                if (!highestTierPlacement || tierOrder.indexOf(placement.tier) < tierOrder.indexOf(highestTierPlacement)) {
                    highestTierPlacement = placement.tier
                }
            }
        }

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
            jobs: jobsWithEligibility,
            userPlacementTier: highestTierPlacement,
            registrationOpen: siteSettings.registrationOpen,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
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
