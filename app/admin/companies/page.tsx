import { prisma } from "@/lib/prisma"
import { CompanyManagementView } from "@/components/admin/company-management-view"

export default async function CompaniesPage() {
  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: { select: { jobs: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.company.count()
  ])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Company Management</h1>
      </div>

      <CompanyManagementView
        initialCompanies={companies}
        totalCount={totalCount}
      />
    </div>
  )
}
