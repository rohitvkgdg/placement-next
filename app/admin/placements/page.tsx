import { PlacementManagementView } from "@/components/admin/placement-management-view"

export default function PlacementsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Placement Management</h1>
      </div>
      <div className="px-4">
        <PlacementManagementView />
      </div>
    </div>
  )
}
