import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canApplyToTier, getHighestTier } from "@/lib/placement-rules"

// GET - Get user's applications (simplified)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const rawPage = parseInt(searchParams.get("page") || "1", 10)
        const rawLimit = parseInt(searchParams.get("limit") || "10", 10)
        const page = isNaN(rawPage) ? 1 : Math.max(rawPage, 1)
        const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 100)
        const skip = (page - 1) * limit

        const where = {
            userId: session.user.id,
            isRemoved: false
        }

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where,
                orderBy: { appliedAt: "desc" },
                skip,
                take: limit,
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            companyName: true,
                            companyLogo: true,
                            location: true,
                            category: true,
                            tier: true,
                            jobType: true,
                            workMode: true,
                            salary: true,
                            deadline: true,
                            status: true
                        }
                    }
                }
            }),
            prisma.application.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: {
                applications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error("Error fetching applications:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Apply to a job (one-click)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { jobId } = await request.json()

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
        }

        // Get job details
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                companyName: true,
                status: true,
                deadline: true,
                tier: true,
                isDreamOffer: true,
                minCGPA: true,
                maxBacklogs: true,
                allowedBranches: true,
                eligibleBatch: true
            }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (job.status !== "ACTIVE") {
            return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 })
        }

        if (job.deadline && new Date(job.deadline) < new Date()) {
            return NextResponse.json({ error: "Application deadline has passed" }, { status: 400 })
        }

        // Check if already applied
        const existingApplication = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId,
                    userId: session.user.id
                }
            }
        })

        if (existingApplication) {
            if (existingApplication.isRemoved) {
                return NextResponse.json({ error: "Your application was removed by admin" }, { status: 400 })
            }
            return NextResponse.json({ error: "You have already applied to this job" }, { status: 400 })
        }

        // Get user profile and placement status
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
                    kycStatus: true,
                    resumeUpload: true,
                    resume: true
                }
            }),
            prisma.placement.findMany({
                where: { userId: session.user.id },
                select: { tier: true, isException: true }
            })
        ])

        if (!userProfile || userProfile.kycStatus !== "VERIFIED") {
            return NextResponse.json({ error: "Your profile must be verified before applying" }, { status: 400 })
        }

        // Determine highest tier placement (exceptions don't count toward tier lock)
        const highestTierPlacement = getHighestTier(userPlacements.filter((p) => !p.isException))

        // Check tier eligibility
        const tierCheck = canApplyToTier(highestTierPlacement, job.tier, job.isDreamOffer)
        if (!tierCheck.eligible) {
            return NextResponse.json({ error: tierCheck.reason }, { status: 400 })
        }

        // Check CGPA
        const cgpa = userProfile.finalCgpa || userProfile.cgpa || 0
        if (job.minCGPA && cgpa < job.minCGPA) {
            return NextResponse.json({ 
                error: `Minimum CGPA required: ${job.minCGPA}. Your CGPA: ${cgpa.toFixed(2)}` 
            }, { status: 400 })
        }

        // Check branch
        if (job.allowedBranches.length > 0 && userProfile.branch) {
            if (!job.allowedBranches.includes(userProfile.branch)) {
                return NextResponse.json({ 
                    error: `Your branch (${userProfile.branch}) is not eligible for this job` 
                }, { status: 400 })
            }
        }

        // Check batch
        if (job.eligibleBatch && userProfile.batch && userProfile.batch !== job.eligibleBatch) {
            return NextResponse.json({ 
                error: `Only ${job.eligibleBatch} batch is eligible` 
            }, { status: 400 })
        }

        // Check backlogs
        const hasActiveBacklogs = userProfile.activeBacklogs || userProfile.hasBacklogs === "yes"
        if (job.maxBacklogs !== null && job.maxBacklogs === 0 && hasActiveBacklogs) {
            return NextResponse.json({ error: "No active backlogs allowed" }, { status: 400 })
        }

        // Create application
        const application = await prisma.application.create({
            data: {
                jobId,
                userId: session.user.id,
                resumeUsed: userProfile.resumeUpload || userProfile.resume
            }
        })

        return NextResponse.json({ 
            success: true, 
            application,
            message: `Successfully applied to ${job.title} at ${job.companyName}`
        }, { status: 201 })

    } catch (error) {
        console.error("Error applying to job:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
