"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Building2, Search, Plus, Pencil, Trash2, Briefcase, Globe, Tag } from "lucide-react"
import { toast } from "sonner"

interface Company {
    id: string
    name: string
    logo: string | null
    website: string | null
    industry: string | null
    description: string | null
    isActive: boolean
    createdAt: Date | string
    updatedAt: Date | string
    _count: { jobs: number }
}

interface CompanyManagementViewProps {
    initialCompanies: Company[]
    totalCount: number
}

type FormData = {
    name: string
    logo: string
    website: string
    industry: string
    description: string
}

const emptyForm: FormData = {
    name: "",
    logo: "",
    website: "",
    industry: "",
    description: "",
}

export function CompanyManagementView({ initialCompanies, totalCount }: CompanyManagementViewProps) {
    const [companies, setCompanies] = useState<Company[]>(initialCompanies)
    const [searchTerm, setSearchTerm] = useState("")
    const [showDialog, setShowDialog] = useState(false)
    const [editTarget, setEditTarget] = useState<Company | null>(null)
    const [form, setForm] = useState<FormData>(emptyForm)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filtered = companies.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.industry?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )

    const openAdd = () => {
        setEditTarget(null)
        setForm(emptyForm)
        setShowDialog(true)
    }

    const openEdit = (company: Company) => {
        setEditTarget(company)
        setForm({
            name: company.name,
            logo: company.logo || "",
            website: company.website || "",
            industry: company.industry || "",
            description: company.description || "",
        })
        setShowDialog(true)
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error("Company name is required")
            return
        }
        setIsSubmitting(true)
        try {
            if (editTarget) {
                const res = await fetch(`/api/admin/companies/${editTarget.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        logo: form.logo || null,
                        website: form.website || null,
                        industry: form.industry || null,
                        description: form.description || null,
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to update")
                setCompanies((prev) =>
                    prev.map((c) =>
                        c.id === editTarget.id ? { ...c, ...data.data.company } : c
                    )
                )
                toast.success("Company updated")
            } else {
                const res = await fetch("/api/admin/companies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        logo: form.logo || null,
                        website: form.website || null,
                        industry: form.industry || null,
                        description: form.description || null,
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to create")
                setCompanies((prev) => [{ ...data.data.company, _count: { jobs: 0 } }, ...prev])
                toast.success("Company added")
            }
            setShowDialog(false)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Operation failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (company: Company) => {
        try {
            const res = await fetch(`/api/admin/companies/${company.id}`, { method: "DELETE" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to delete")
            setCompanies((prev) => prev.filter((c) => c.id !== company.id))
            toast.success("Company removed")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete company")
        }
    }

    const totalJobsPosted = companies.reduce((acc, c) => acc + c._count.jobs, 0)
    const activeCompanies = companies.filter((c) => c.isActive).length
    const newThisMonth = companies.filter(
        (c) => new Date(c.createdAt).getMonth() === new Date().getMonth()
    ).length

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalJobsPosted}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCompanies}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newThisMonth}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Company Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Company Directory</CardTitle>
                            <CardDescription>Manage companies that post jobs on the portal</CardDescription>
                        </div>
                        <Button onClick={openAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Company
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or industry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Industry</TableHead>
                                    <TableHead>Website</TableHead>
                                    <TableHead>Jobs</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">No companies found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((company) => (
                                        <TableRow key={company.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {company.logo ? (
                                                        <img
                                                            src={company.logo}
                                                            alt={company.name}
                                                            className="h-8 w-8 rounded object-contain"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{company.name}</p>
                                                        {company.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-48">
                                                                {company.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {company.industry ? (
                                                    <span className="flex items-center gap-1 text-sm">
                                                        <Tag className="h-3 w-3" />
                                                        {company.industry}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {company.website ? (
                                                    <a
                                                        href={company.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                    >
                                                        <Globe className="h-3 w-3" />
                                                        Website
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{company._count.jobs}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        company.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-600"
                                                    }
                                                >
                                                    {company.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEdit(company)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-destructive"
                                                                disabled={company._count.jobs > 0}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete company?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete{" "}
                                                                    <strong>{company.name}</strong>. This cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(company)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Company" : "Add Company"}</DialogTitle>
                        <DialogDescription>
                            {editTarget
                                ? "Update company details."
                                : "Add a new company to the portal."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Company Name *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Infosys"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Industry</Label>
                            <Input
                                value={form.industry}
                                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                placeholder="e.g. Technology"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Website</Label>
                            <Input
                                value={form.website}
                                onChange={(e) => setForm({ ...form, website: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Logo URL</Label>
                            <Input
                                value={form.logo}
                                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Brief description..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : editTarget ? "Save Changes" : "Add Company"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
