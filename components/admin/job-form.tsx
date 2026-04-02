"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export interface JobFormData {
    id?: string
    title: string
    companyName: string
    companyLogo?: string
    description: string
    location: string
    jobType: string
    workMode: string
    tier: string
    category: string
    isDreamOffer: boolean
    salary: number
    minCGPA?: number
    allowedBranches: string[]
    eligibleBatch?: string
    maxBacklogs?: number
    requiredSkills: string[]
    preferredSkills: string[]
    deadline?: string
    startDate?: string
    noOfPositions?: number
    status: string
    isVisible: boolean
}

interface JobFormProps {
    initialData?: Partial<JobFormData>
    onSubmit: (data: JobFormData) => Promise<void>
    isLoading?: boolean
}

const branches = [
    { value: "CSE", label: "Computer Science" },
    { value: "ISE", label: "Information Science" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "EEE", label: "Electrical & Electronics" },
    { value: "ME", label: "Mechanical" },
    { value: "CE", label: "Civil" },
    { value: "CHE", label: "Chemical" },
    { value: "BT", label: "Biotechnology" },
    { value: "IE", label: "Industrial Engineering" },
    { value: "AIML", label: "AI & Machine Learning" },
]

export function JobForm({ initialData, onSubmit, isLoading = false }: JobFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<JobFormData>({
        title: initialData?.title || "",
        companyName: initialData?.companyName || "",
        companyLogo: initialData?.companyLogo || "",
        description: initialData?.description || "",
        location: initialData?.location || "",
        jobType: initialData?.jobType || "FULL_TIME",
        workMode: initialData?.workMode || "OFFICE",
        tier: initialData?.tier || "TIER_3",
        category: initialData?.category || "FTE",
        isDreamOffer: initialData?.isDreamOffer || false,
        salary: initialData?.salary || 0,
        minCGPA: initialData?.minCGPA,
        allowedBranches: initialData?.allowedBranches || [],
        eligibleBatch: initialData?.eligibleBatch || "",
        maxBacklogs: initialData?.maxBacklogs || 0,
        requiredSkills: initialData?.requiredSkills || [],
        preferredSkills: initialData?.preferredSkills || [],
        deadline: initialData?.deadline || "",
        startDate: initialData?.startDate || "",
        noOfPositions: initialData?.noOfPositions || 1,
        status: initialData?.status || "DRAFT",
        isVisible: initialData?.isVisible ?? true,
    })

    const [newSkill, setNewSkill] = useState("")
    const [newPreferredSkill, setNewPreferredSkill] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    const addSkill = (type: 'required' | 'preferred') => {
        const skill = type === 'required' ? newSkill : newPreferredSkill
        if (!skill.trim()) return

        if (type === 'required') {
            setFormData(prev => ({
                ...prev,
                requiredSkills: [...prev.requiredSkills, skill.trim()]
            }))
            setNewSkill("")
        } else {
            setFormData(prev => ({
                ...prev,
                preferredSkills: [...prev.preferredSkills, skill.trim()]
            }))
            setNewPreferredSkill("")
        }
    }

    const removeSkill = (type: 'required' | 'preferred', index: number) => {
        if (type === 'required') {
            setFormData(prev => ({
                ...prev,
                requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                preferredSkills: prev.preferredSkills.filter((_, i) => i !== index)
            }))
        }
    }

    const toggleBranch = (branchValue: string) => {
        setFormData(prev => ({
            ...prev,
            allowedBranches: prev.allowedBranches.includes(branchValue)
                ? prev.allowedBranches.filter(b => b !== branchValue)
                : [...prev.allowedBranches, branchValue]
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Provide the basic details about the job posting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                required
                                placeholder="e.g., Software Engineer"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                                id="companyName"
                                required
                                placeholder="e.g., Google"
                                value={formData.companyName}
                                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                required
                                placeholder="e.g., Bangalore, Karnataka"
                                value={formData.location}
                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyLogo">Company Logo URL</Label>
                            <Input
                                id="companyLogo"
                                placeholder="https://example.com/logo.png"
                                value={formData.companyLogo}
                                onChange={e => setFormData(prev => ({ ...prev, companyLogo: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="jobType">Job Type *</Label>
                            <Select
                                value={formData.jobType}
                                onValueChange={value => setFormData(prev => ({ ...prev, jobType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    <SelectItem value="CONTRACT">Contract</SelectItem>
                                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workMode">Work Mode *</Label>
                            <Select
                                value={formData.workMode}
                                onValueChange={value => setFormData(prev => ({ ...prev, workMode: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OFFICE">Office</SelectItem>
                                    <SelectItem value="REMOTE">Remote</SelectItem>
                                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Job Description *</Label>
                        <RichTextEditor
                            content={formData.description}
                            onChange={content => setFormData(prev => ({ ...prev, description: content }))}
                            placeholder="Describe the role, responsibilities, and requirements..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility Criteria</CardTitle>
                    <CardDescription>Define the eligibility requirements for students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minCGPA">Minimum CGPA</Label>
                            <Input
                                id="minCGPA"
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                placeholder="e.g., 7.0"
                                value={formData.minCGPA || ""}
                                onChange={e => setFormData(prev => ({ ...prev, minCGPA: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxBacklogs">Maximum Backlogs</Label>
                            <Input
                                id="maxBacklogs"
                                type="number"
                                min="0"
                                placeholder="e.g., 0"
                                value={formData.maxBacklogs || ""}
                                onChange={e => setFormData(prev => ({ ...prev, maxBacklogs: e.target.value ? parseInt(e.target.value) : 0 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eligibleBatch">Eligible Batch</Label>
                            <Input
                                id="eligibleBatch"
                                placeholder="e.g., 2024"
                                value={formData.eligibleBatch}
                                onChange={e => setFormData(prev => ({ ...prev, eligibleBatch: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Allowed Branches</Label>
                        <p className="text-xs text-muted-foreground mb-2">Leave empty to allow all branches</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {branches.map(branch => (
                                <div key={branch.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`branch-${branch.value}`}
                                        checked={formData.allowedBranches.includes(branch.value)}
                                        onCheckedChange={() => toggleBranch(branch.value)}
                                    />
                                    <Label
                                        htmlFor={`branch-${branch.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {branch.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Placement Tier & Category */}
            <Card>
                <CardHeader>
                    <CardTitle>Placement Tier & Category</CardTitle>
                    <CardDescription>Set the placement tier and job category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary (LPA) *</Label>
                            <Input
                                id="salary"
                                type="number"
                                step="0.1"
                                min="0"
                                required
                                placeholder="e.g., 8.5"
                                value={formData.salary || ""}
                                onChange={e => {
                                    const salary = e.target.value ? parseFloat(e.target.value) : 0
                                    const autoTier = salary > 9 ? "TIER_1" : salary > 5 ? "TIER_2" : "TIER_3"
                                    setFormData(prev => ({ ...prev, salary, tier: prev.isDreamOffer ? "DREAM" : autoTier }))
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Tier auto-calculated: ≤5 LPA = Tier 3, 5-9 LPA = Tier 2, &gt;9 LPA = Tier 1
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tier">Placement Tier</Label>
                            <Select
                                value={formData.tier}
                                onValueChange={value => setFormData(prev => ({ ...prev, tier: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TIER_3">Tier 3 (≤5 LPA)</SelectItem>
                                    <SelectItem value="TIER_2">Tier 2 (5-9 LPA)</SelectItem>
                                    <SelectItem value="TIER_1">Tier 1 (&gt;9 LPA)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Job Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRAINING_INTERNSHIP">Training + Internship</SelectItem>
                                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    <SelectItem value="FTE">Full Time Employment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isDreamOffer"
                            checked={formData.isDreamOffer}
                            onCheckedChange={checked => setFormData(prev => ({ ...prev, isDreamOffer: checked as boolean }))}
                        />
                        <Label htmlFor="isDreamOffer" className="cursor-pointer">
                            Mark as Dream Offer (&gt;10 LPA, allows Tier 3 students to apply)
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Skills */}
            <Card>
                <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Add required and preferred skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Required Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a skill (e.g., React, Python)"
                                value={newSkill}
                                onChange={e => setNewSkill(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill('required'))}
                            />
                            <Button type="button" onClick={() => addSkill('required')}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.requiredSkills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="pr-1">
                                    {skill}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() => removeSkill('required', index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Preferred Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a preferred skill"
                                value={newPreferredSkill}
                                onChange={e => setNewPreferredSkill(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill('preferred'))}
                            />
                            <Button type="button" onClick={() => addSkill('preferred')}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.preferredSkills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="pr-1">
                                    {skill}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() => removeSkill('preferred', index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                    <CardDescription>Set deadlines and other application details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deadline">Application Deadline</Label>
                            <Input
                                id="deadline"
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Expected Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="noOfPositions">Number of Positions</Label>
                            <Input
                                id="noOfPositions"
                                type="number"
                                min="1"
                                placeholder="e.g., 5"
                                value={formData.noOfPositions}
                                onChange={e => setFormData(prev => ({ ...prev, noOfPositions: e.target.value ? parseInt(e.target.value) : 1 }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status & Visibility */}
            <Card>
                <CardHeader>
                    <CardTitle>Status & Visibility</CardTitle>
                    <CardDescription>Control job posting status and visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex items-center pt-6">
                            <Checkbox
                                id="isVisible"
                                checked={formData.isVisible}
                                onCheckedChange={checked => setFormData(prev => ({ ...prev, isVisible: checked as boolean }))}
                            />
                            <Label htmlFor="isVisible" className="ml-2 cursor-pointer">
                                Make this job visible to students
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData?.id ? "Update Job" : "Create Job"}
                </Button>
            </div>
        </form>
    )
}
