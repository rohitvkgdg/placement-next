import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import { checkYearAccess } from "@/lib/year-gate"

export default async function ScheduleLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const yearAccess = await checkYearAccess(session)
    if (!yearAccess.authorized) {
        redirect("/not-authorized")
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    )
}
