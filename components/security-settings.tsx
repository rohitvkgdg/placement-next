"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound } from "lucide-react"

interface SecuritySettingsProps {
    isOAuthUser: boolean
    providerName?: string
}

export function SecuritySettings({ isOAuthUser, providerName }: SecuritySettingsProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    if (isOAuthUser) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">Password managed by {providerName || "OAuth provider"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your account is linked to {providerName || "an external provider"}. Password management is handled externally.
                    </p>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Password changed successfully")
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(data.error || "Failed to change password")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                    <Input
                        id="current-password"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        autoComplete="current-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrent(!showCurrent)}
                    >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                    <Input
                        id="new-password"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        autoComplete="new-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNew(!showNew)}
                    >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    autoComplete="new-password"
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Changing..." : "Change Password"}
            </Button>
        </form>
    )
}
