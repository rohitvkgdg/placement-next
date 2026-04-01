"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    MapPin,
    Building2,
    Clock,
    Briefcase,
    CheckCircle,
    FileText,
    QrCode,
    ExternalLink,
    IndianRupee
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import QRCode from "qrcode"

interface Application {
    id: string
    appliedAt: string
    resumeUsed?: string
    job: {
        id: string
        title: string
        companyName: string
        location: string
        jobType: string
        workMode: string
        salary: number
        tier: string
        category: string
        isDreamOffer: boolean
        deadline?: string
    }
    attendance?: {
        scannedAt?: string
    }
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({})

    const fetchApplications = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            })

            const response = await fetch(`/api/applications?${params}`)
            if (response.ok) {
                const data = await response.json()
                setApplications(data.data.applications)
                setTotalPages(data.data.pagination?.pages || 1)

                // Generate QR codes for each application
                const newQrCodes: Record<string, string> = {}
                for (const app of data.data.applications) {
                    const qrData = JSON.stringify({
                        applicationId: app.id,
                        jobId: app.job.id,
                        company: app.job.companyName
                    })
                    newQrCodes[app.id] = await QRCode.toDataURL(qrData)
                }
                setQrCodes(newQrCodes)
            }
        } catch (error) {
            console.error("Error fetching applications:", error)
            toast.error("Failed to load applications")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [page])

    const getTierBadge = (tier: string, isDreamOffer: boolean) => {
        if (isDreamOffer) {
            return <Badge variant="destructive">Dream Offer</Badge>
        }
        const variants: Record<string, "default" | "secondary" | "outline"> = {
            "TIER_1": "default",
            "TIER_2": "secondary",
            "TIER_3": "outline",
        }
        return <Badge variant={variants[tier] || "outline"}>{tier.replace("_", " ")}</Badge>
    }

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            "TRAINING_INTERNSHIP": "Training + Internship",
            "INTERNSHIP": "Internship",
            "FTE": "Full Time",
        }
        return labels[category] || category
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Applications</h1>
                <p className="text-muted-foreground mt-2">
                    Jobs you have applied to
                </p>
            </div>

            {/* Summary */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Briefcase className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{applications.length}</p>
                                <p className="text-sm text-muted-foreground">Total Applications</p>
                            </div>
                        </div>
                        <Link href="/jobs">
                            <Button>Browse More Jobs</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Applications List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                                <div className="h-4 bg-muted rounded w-1/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : applications.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start exploring job opportunities and apply to positions.
                        </p>
                        <Link href="/jobs">
                            <Button>Browse Jobs</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <Card key={app.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-lg font-semibold">{app.job.title}</h3>
                                                    {getTierBadge(app.job.tier, app.job.isDreamOffer)}
                                                    <Badge variant="outline">{getCategoryLabel(app.job.category)}</Badge>
                                                </div>
                                                <p className="text-muted-foreground">{app.job.companyName}</p>

                                                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {app.job.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <IndianRupee className="w-4 h-4" />
                                                        {app.job.salary} LPA
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Applied {format(new Date(app.appliedAt), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>

                                                {app.attendance?.scannedAt && (
                                                    <div className="mt-2 inline-flex items-center gap-1 text-sm text-green-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Attendance marked on {format(new Date(app.attendance.scannedAt), 'MMM dd, yyyy HH:mm')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Link href={`/jobs/${app.job.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    View Job
                                                </Button>
                                            </Link>

                                            {app.resumeUsed && (
                                                <a href={app.resumeUsed} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm">
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        Resume
                                                    </Button>
                                                </a>
                                            )}

                                            {qrCodes[app.id] && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <QrCode className="w-4 h-4 mr-1" />
                                                            QR
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Your Application QR Code</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Show this QR code for attendance at {app.job.companyName} events
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="flex justify-center py-4">
                                                            <img src={qrCodes[app.id]} alt="QR Code" className="w-48 h-48" />
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Close</AlertDialogCancel>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
