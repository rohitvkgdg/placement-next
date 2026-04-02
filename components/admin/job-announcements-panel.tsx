"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, ChevronDown, ChevronUp, Bell } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface JobUpdate {
    id: string
    title: string
    message: string
    createdAt: string
}

interface JobAnnouncementsPanelProps {
    jobId: string
}

export function JobAnnouncementsPanel({ jobId }: JobAnnouncementsPanelProps) {
    const [updates, setUpdates] = useState<JobUpdate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetch(`/api/admin/jobs/${jobId}/updates`)
            .then((r) => r.json())
            .then((d) => setUpdates(d.data?.updates || []))
            .catch(() => {})
            .finally(() => setIsLoading(false))
    }, [jobId])

    const handlePost = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Title and message are required")
            return
        }
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/admin/jobs/${jobId}/updates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), message: message.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to post")
            setUpdates((prev) => [data.update, ...prev])
            setTitle("")
            setMessage("")
            setShowForm(false)
            toast.success(`Announcement posted — ${data.notifiedCount} student${data.notifiedCount !== 1 ? "s" : ""} notified`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to post announcement")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-lg">Announcements</CardTitle>
                            <CardDescription>
                                Post updates to notify eligible students
                            </CardDescription>
                        </div>
                        {updates.length > 0 && (
                            <Badge variant="secondary">{updates.length}</Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Post Update
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded((v) => !v)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4">
                    {/* Post form */}
                    {showForm && (
                        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                            <div className="space-y-1">
                                <Label>Title *</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Interview Schedule Update"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Message *</Label>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handlePost} disabled={isSubmitting}>
                                    {isSubmitting ? "Posting..." : "Post & Notify Students"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setShowForm(false); setTitle(""); setMessage("") }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Updates list */}
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                    ) : updates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No announcements yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {updates.map((update) => (
                                <div key={update.id} className="rounded-lg border p-3">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-medium text-sm">{update.title}</p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(update.createdAt), "dd MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{update.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    )
}
