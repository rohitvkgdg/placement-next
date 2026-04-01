import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import QRCode from "qrcode"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const job = await prisma.job.findUnique({
            where: {
                id,
                status: "ACTIVE",
                isVisible: true
            },
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        })

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            )
        }

        // Check if user has applied
        const application = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId: id,
                    userId: session.user.id
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                job,
                hasApplied: !!application && !application.isRemoved,
            }
        })

    } catch (error) {
        console.error("Error fetching job:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// POST - Apply to a job
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { coverLetter } = await request.json()

        // Check if job exists and is active
        const job = await prisma.job.findUnique({
            where: {
                id,
                status: "ACTIVE",
                isVisible: true
            }
        })

        if (!job) {
            return NextResponse.json(
                { error: "Job not found or no longer accepting applications" },
                { status: 404 }
            )
        }

        // Check deadline
        if (job.deadline && new Date(job.deadline) < new Date()) {
            return NextResponse.json(
                { error: "Application deadline has passed" },
                { status: 400 }
            )
        }

        // Check if user already applied
        const existingApplication = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId: id,
                    userId: session.user.id
                }
            }
        })

        if (existingApplication) {
            return NextResponse.json(
                { error: "You have already applied to this job" },
                { status: 400 }
            )
        }

        // Get user's profile
        const profile = await prisma.profile.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                resume: true,
                cgpa: true,
                branch: true,
                batch: true,
                activeBacklogs: true,
                kycStatus: true
            }
        })

        if (!profile) {
            return NextResponse.json(
                { error: "Please complete your profile before applying" },
                { status: 400 }
            )
        }

        // Check KYC status
        if (profile.kycStatus !== "VERIFIED") {
            return NextResponse.json(
                { error: "Your profile must be verified before applying to jobs" },
                { status: 400 }
            )
        }

        // Check eligibility
        if (job.minCGPA && profile.cgpa && profile.cgpa < job.minCGPA) {
            return NextResponse.json(
                { error: `Minimum CGPA of ${job.minCGPA} required` },
                { status: 400 }
            )
        }

        if (job.allowedBranches.length > 0 && profile.branch) {
            if (!job.allowedBranches.includes(profile.branch)) {
                return NextResponse.json(
                    { error: "Your branch is not eligible for this job" },
                    { status: 400 }
                )
            }
        }

        if (job.eligibleBatch && profile.batch && profile.batch !== job.eligibleBatch) {
            return NextResponse.json(
                { error: `Only ${job.eligibleBatch} batch is eligible` },
                { status: 400 }
            )
        }

        if (job.maxBacklogs === 0 && profile.activeBacklogs) {
            return NextResponse.json(
                { error: "No active backlogs allowed for this job" },
                { status: 400 }
            )
        }

        // Create application
        const application = await prisma.application.create({
            data: {
                jobId: id,
                userId: session.user.id,
                resumeUsed: profile.resume || null
            }
        })

        // Generate QR code for attendance tracking
        const qrData = JSON.stringify({
            applicationId: application.id,
            jobId: id,
            userId: session.user.id,
            timestamp: new Date().toISOString()
        })

        const qrCode = await QRCode.toDataURL(qrData)

        // Create attendance record with QR code
        await prisma.attendance.create({
            data: {
                studentId: session.user.id,
                jobId: id,
                qrCode: application.id // Using application ID as unique QR identifier
            }
        })

        // Create notification
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                title: "Application Submitted",
                message: `You have successfully applied for ${job.title} at ${job.companyName}`,
                type: "APPLICATION_STATUS",
                data: {
                    applicationId: application.id,
                    jobId: id
                }
            }
        })

        return NextResponse.json({
            success: true,
            application,
            qrCode // Return QR code for display
        }, { status: 201 })

    } catch (error) {
        console.error("Error applying to job:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
