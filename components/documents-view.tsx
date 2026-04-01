"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileText, Download, Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DocumentEntry {
  label: string
  description: string
  field: string
  uploadType: string
  accept: string
  currentUrl: string | null
}

interface DocumentsViewProps {
  profile: {
    resumeUpload: string | null
    resume: string | null
    profilePhoto: string | null
    tenthMarksCard: string | null
    twelfthMarksCard: string | null
    diplomaCertificate: string | null
    semesterMarksCards: unknown
  }
}

export function DocumentsView({ profile }: DocumentsViewProps) {
  const resumeUrl = profile.resumeUpload ?? profile.resume ?? null

  const DOCUMENTS: DocumentEntry[] = [
    {
      label: "Resume / CV",
      description: "PDF or Word document, max 10MB",
      field: "resumeUpload",
      uploadType: "resume",
      accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      currentUrl: resumeUrl,
    },
    {
      label: "10th Marks Card",
      description: "PDF or image, max 10MB",
      field: "tenthMarksCard",
      uploadType: "tenthMarksCard",
      accept: "application/pdf,image/jpeg,image/png",
      currentUrl: profile.tenthMarksCard,
    },
    {
      label: "12th / PUC Marks Card",
      description: "PDF or image, max 10MB",
      field: "twelfthMarksCard",
      uploadType: "twelfthMarksCard",
      accept: "application/pdf,image/jpeg,image/png",
      currentUrl: profile.twelfthMarksCard,
    },
    {
      label: "Diploma Certificate",
      description: "PDF or image, max 10MB — only if applicable",
      field: "diplomaCertificate",
      uploadType: "diplomaMarksCard",
      accept: "application/pdf,image/jpeg,image/png",
      currentUrl: profile.diplomaCertificate,
    },
  ]

  const [urls, setUrls] = useState<Record<string, string | null>>(
    Object.fromEntries(DOCUMENTS.map((d) => [d.field, d.currentUrl]))
  )
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  async function handleUpload(doc: DocumentEntry, file: File) {
    setUploading((prev) => ({ ...prev, [doc.field]: true }))
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", doc.uploadType)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error ?? "Upload failed")
      }

      // Save URL back to profile
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [doc.field]: uploadData.url }),
      })

      if (!profileRes.ok) {
        throw new Error("Failed to save document URL to profile")
      }

      setUrls((prev) => ({ ...prev, [doc.field]: uploadData.url }))
      toast.success(`${doc.label} uploaded successfully`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading((prev) => ({ ...prev, [doc.field]: false }))
    }
  }

  // Extract semester marks cards from JSON
  const semesterCards: Array<{ semester: number | string; url: string }> = (() => {
    try {
      const raw = profile.semesterMarksCards
      if (Array.isArray(raw)) return raw.filter((s) => s?.url)
      return []
    } catch {
      return []
    }
  })()

  return (
    <main className="flex-1 bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Manage your uploaded documents. These are shared with recruiters when you apply.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {DOCUMENTS.map((doc) => {
            const current = urls[doc.field]
            const isUploading = uploading[doc.field]

            return (
              <Card key={doc.field}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{doc.label}</CardTitle>
                    {current ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        Not uploaded
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  {current && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={current} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        View / Download
                      </a>
                    </Button>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="sr-only"
                      accept={doc.accept}
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(doc, file)
                        e.target.value = ""
                      }}
                    />
                    <Button variant={current ? "ghost" : "default"} size="sm" asChild disabled={isUploading}>
                      <span>
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Uploading…
                          </>
                        ) : current ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Replace
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {semesterCards.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Semester Marks Cards</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {semesterCards.map((s, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between py-4">
                    <span className="text-sm font-medium">Semester {s.semester}</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
