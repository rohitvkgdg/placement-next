import { auth } from "@/lib/auth"
import { Scheduler } from "@/components/scheduler"

export default async function AdminSchedulePage() {
  const session = await auth()

  return (
    <main className="flex-1 bg-muted/30 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">
            Manage placement events, interviews, and schedules for all students
          </p>
        </div>
        
        <Scheduler 
          isAdmin={true} 
          userId={session!.user.id}
        />
      </div>
    </main>
  )
}
