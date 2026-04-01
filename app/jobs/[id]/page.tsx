"use client"

import { useState, useEffect, useMemo } from "react"
import DOMPurify from "dompurify"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    ArrowLeft,
    MapPin,
    Building2,
    Clock,
    Briefcase,
    Users,
    AlertCircle,
    CheckCircle,
    GraduationCap,
    Calendar
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Job {
    id: string
    title: string
    companyName: string
    companyLogo?: string
    description: string
    location: string
    jobType: string
    workMode: string
    salary: number
    tier: string
    category: string
    isDreamOffer: boolean
    minCGPA?: number
    allowedBranches: string[]
    eligibleBatch?: string
    maxBacklogs?: number
    requiredSkills: string[]
    preferredSkills: string[]
    deadline?: string
    startDate?: string
    noOfPositions?: number
    createdAt: string
    _count: {
        applications: number
    }
}

export default function JobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<Job | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasApplied, setHasApplied] = useState(false)
    const [isApplying, setIsApplying] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [showQRDialog, setShowQRDialog] = useState(false)

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await fetch(`/api/jobs/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setJob(data.data.job)
                    setHasApplied(data.data.hasApplied)
                } else {
                    toast.error("Job not found")
                    router.push("/jobs")
                }
            } catch (error) {
                console.error("Error fetching job:", error)
                toast.error("Failed to load job details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchJob()
    }, [params.id, router])

    const handleApply = async () => {
        setIsApplying(true)
        try {
            const response = await fetch(`/api/jobs/${params.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            })

            if (response.ok) {
                const data = await response.json()
                toast.success("Application submitted successfully!")
                setHasApplied(true)

                if (data.qrCode) {
                    setQrCode(data.qrCode)
                    setShowQRDialog(true)
                }
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to apply")
            }
        } catch (error) {
            console.error("Error applying:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsApplying(false)
        }
    }

    const getJobTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            FULL_TIME: "Full Time",
            PART_TIME: "Part Time",
            INTERNSHIP: "Internship",
            CONTRACT: "Contract",
            FREELANCE: "Freelance"
        }
        return labels[type] || type
    }

    const getWorkModeLabel = (mode: string) => {
        const labels: Record<string, string> = {
            OFFICE: "On-site",
            REMOTE: "Remote",
            HYBRID: "Hybrid",
            FLEXIBLE: "Flexible"
        }
        return labels[mode] || mode
    }

    const getTierVariant = (tier: string, isDreamOffer: boolean): "default" | "secondary" | "outline" | "destructive" => {
        if (isDreamOffer) return "destructive"
        if (tier === "TIER_1") return "default"
        if (tier === "TIER_2") return "secondary"
        return "outline"
    }

    const getTierLabel = (tier: string, isDreamOffer: boolean) => {
        if (isDreamOffer) return "Dream Offer"
        return tier.replace("_", " ")
    }

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            TRAINING_INTERNSHIP: "Training + Internship",
            INTERNSHIP: "Internship",
            FTE: "Full Time Employment"
        }
        return labels[category] || category
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 max-w-4xl space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (!job) {
        return null
    }

    const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date()

    return (
        <div className="container mx-auto py-6 max-w-4xl space-y-6">
            <Link href="/jobs">
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Button>
            </Link>

            {/* Job Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            {job.companyLogo ? (
                                <img
                                    src={job.companyLogo}
                                    alt={job.companyName}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-2xl font-bold">{job.title}</h1>
                                    <Badge variant={getTierVariant(job.tier, job.isDreamOffer)}>
                                        {getTierLabel(job.tier, job.isDreamOffer)}
                                    </Badge>
                                    <Badge variant="outline">{getCategoryLabel(job.category)}</Badge>
                                    {hasApplied && (
                                        <Badge className="bg-green-100 text-green-800">Applied</Badge>
                                    )}
                                </div>
                                <p className="text-lg text-muted-foreground">{job.companyName}</p>
                                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {job.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        {getJobTypeLabel(job.jobType)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {getWorkModeLabel(job.workMode)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {hasApplied ? (
                                <Button variant="outline" disabled>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Applied
                                </Button>
                            ) : isDeadlinePassed ? (
                                <Button disabled>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Deadline Passed
                                </Button>
                            ) : (
                                <Button onClick={handleApply} disabled={isApplying}>
                                    {isApplying ? "Applying..." : "Apply Now"}
                                </Button>
                            )}
                            <p className="text-lg font-semibold text-green-600">₹{job.salary} LPA</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
                            />
                        </CardContent>
                    </Card>

                    {/* Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Required Skills</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {job.requiredSkills.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Must have:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.requiredSkills.map((skill, index) => (
                                            <Badge key={index} variant="secondary">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {job.preferredSkills.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Good to have:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.preferredSkills.map((skill, index) => (
                                            <Badge key={index} variant="outline">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Key Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Key Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 flex items-center justify-center text-green-600 font-bold">₹</div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Salary</p>
                                    <p className="font-medium">{job.salary} LPA</p>
                                </div>
                            </div>
                            {job.noOfPositions && (
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Positions</p>
                                        <p className="font-medium">{job.noOfPositions}</p>
                                    </div>
                                </div>
                            )}
                            {job.deadline && (
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Deadline</p>
                                        <p className="font-medium">{format(new Date(job.deadline), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            )}
                            {job.startDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Start Date</p>
                                        <p className="font-medium">{format(new Date(job.startDate), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Applications</p>
                                    <p className="font-medium">{job._count.applications} applied</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Eligibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Eligibility Criteria</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {job.minCGPA && (
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Min CGPA: {job.minCGPA}</span>
                                </div>
                            )}
                            {job.allowedBranches.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Allowed Branches:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {job.allowedBranches.map((branch, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {branch}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {job.eligibleBatch && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Batch: {job.eligibleBatch}</span>
                                </div>
                            )}
                            {job.maxBacklogs !== null && job.maxBacklogs !== undefined && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {job.maxBacklogs === 0 ? "No backlogs allowed" : `Max ${job.maxBacklogs} backlogs`}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* QR Code Dialog */}
            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Application Submitted!</DialogTitle>
                        <DialogDescription>
                            Save this QR code for attendance tracking at placement events
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center py-4">
                        {qrCode && (
                            <img src={qrCode} alt="Application QR Code" className="w-64 h-64" />
                        )}
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                            Show this QR code when attending events for {job.companyName}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowQRDialog(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
