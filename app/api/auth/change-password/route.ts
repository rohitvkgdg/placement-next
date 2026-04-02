import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be less than 72 characters"),
})

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const result = changePasswordSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            )
        }

        const { currentPassword, newPassword } = result.data

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // This endpoint is only for credential-based accounts
        if (!user.password) {
            return NextResponse.json(
                { error: "Password change is not available for OAuth accounts" },
                { status: 400 }
            )
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            )
        }

        // Prevent reuse of same password
        const isSame = await bcrypt.compare(newPassword, user.password)
        if (isSame) {
            return NextResponse.json(
                { error: "New password must be different from your current password" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12)

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        })

        return NextResponse.json({ success: true, data: { message: "Password changed successfully" } })
    } catch (error) {
        console.error("Error changing password:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
