# CampusConnect — User Manual

**CampusConnect** is the official placement management portal for SDMCET. This manual covers every screen and action for both students and placement-cell administrators.

---

## Table of Contents

### Student Guide
1. [Getting Started — Signup & Login](#1-getting-started--signup--login)
2. [Completing Your Profile](#2-completing-your-profile)
3. [KYC Verification](#3-kyc-verification)
4. [Dashboard](#4-student-dashboard)
5. [Browsing & Applying for Jobs](#5-browsing--applying-for-jobs)
6. [Tracking Your Applications](#6-tracking-your-applications)
7. [Notifications](#7-notifications)
8. [Schedule & Events](#8-schedule--events)
9. [Documents & ID Card](#9-documents--id-card)
10. [Account Settings](#10-account-settings)

### Admin Guide
11. [Admin Login & Navigation](#11-admin-login--navigation)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Student Management](#13-student-management)
14. [KYC Queue](#14-kyc-queue)
15. [Job Management](#15-job-management)
16. [Managing Applicants & Application Statuses](#16-managing-applicants--application-statuses)
17. [Placement Records](#17-placement-records)
18. [Analytics](#18-analytics)
19. [Company Management](#19-company-management)
20. [Schedule & Events Management](#20-schedule--events-management)
21. [Bulk Notifications](#21-bulk-notifications)
22. [Site Settings](#22-site-settings)
23. [Backup](#23-backup)

---

# Student Guide

---

## 1. Getting Started — Signup & Login

### Creating an Account

1. Open the portal in your browser.
2. Click **Sign Up** on the login page.
3. Fill in:
   - **Full name**
   - **Email address** — use your college or personal email
   - **Password** — minimum 8 characters, maximum 72
   - **Confirm password**
   - Tick the **Terms and Conditions** checkbox
4. Click **Create Account**.
5. A verification email is sent to your address. Open it and click **Verify Email**.

> If the email does not arrive within a few minutes, check your Spam/Junk folder. You can also use the **Resend Verification** link on the login page.

### Logging In

**With email and password:**
1. Go to the portal login page.
2. Enter your registered email and password.
3. Click **Sign In**.

**With Google:**
1. Click **Continue with Google**.
2. Select or sign in to your Google account.
3. You will be redirected to the dashboard.

### Forgot / Wrong Password

Password reset is not yet available via a self-service link. Contact your placement cell admin, or use Google sign-in if your email supports it.

---

## 2. Completing Your Profile

After logging in for the first time you will be prompted to complete your profile. Profile completion is required before you can apply for jobs. The form has **five steps**; you can save progress and return later.

### Step 1 — Personal Information
- First name, last name
- Date of birth, gender
- Phone number (calling mobile)
- WhatsApp number (if different)
- Profile photo upload

### Step 2 — Contact Details
- Personal email address
- Current address
- Permanent address

### Step 3 — Academic Details
- **USN** (University Seat Number) — validated against the college code pattern
- Branch (CSE, ISE, AIML, ECE, etc.)
- Batch / admission year
- CGPA / final CGPA
- 10th percentage and board
- 12th / Diploma percentage and board
- Number of active backlogs

### Step 4 — Engineering / Professional Details
- Skills (comma-separated or tag input)
- Resume upload (PDF, uploaded to Cloudflare R2)
- LinkedIn profile URL
- GitHub profile URL
- Any internship or project experience

### Step 5 — Review & Submit
- Review all entered details.
- Upload your College ID card — this is required for KYC verification.
- Click **Submit Profile**.

> **Profile Completion Score** — Your dashboard shows a percentage score based on how many fields are filled. A higher score improves your visibility to recruiters.

---

## 3. KYC Verification

KYC (Know Your Customer) verification confirms your identity before you can access job listings.

### KYC States

| Status | Meaning | What to Do |
|--------|---------|------------|
| **Pending** | Profile submitted, ID card not yet uploaded | Upload your College ID card in Profile → Step 5 |
| **Under Review** | Admin is reviewing your documents | Wait — you will receive a notification |
| **Verified** | Identity confirmed | Full access to all placement features |
| **Rejected** | Documents could not be verified | Check admin feedback in your notifications, resubmit |

### After Rejection
1. Open the notification to read the admin's feedback.
2. Go to **Profile** and re-upload the correct document.
3. Re-submit for review.

---

## 4. Student Dashboard

URL: `/dashboard`

The dashboard is your home screen. It shows:

| Section | Description |
|---------|-------------|
| **Welcome header** | Your name, quick-action buttons (Update Profile, Browse Jobs, Download ID Card) |
| **Announcement banner** | Placement season announcements posted by admin (shown when active) |
| **Status alerts** | KYC state banners — profile setup required / pending / under review / complete-your-profile |
| **Stats cards** | Active Jobs available, My Applications count, Upcoming Events, Profile Score % |
| **Recent Job Openings** | 4 most recently posted active jobs with deadline |
| **Upcoming Events** | Next 4 scheduled placement events |

> The **Download ID Card** button appears only after KYC is verified.

---

## 5. Browsing & Applying for Jobs

URL: `/jobs`

### Job Listing Page

- All active jobs visible to you are listed as cards.
- Each card shows: company name, job title, location, salary (LPA), job tier badge, deadline.
- Use the **search bar** to filter by title or company.
- Use **Job Type** dropdown to filter: FTE, Internship, Training Internship.
- Use **Work Mode** dropdown to filter: On-site, Remote, Hybrid.
- Use **Previous / Next** buttons or page numbers to paginate.

### Eligibility Indicators

Jobs you are **not eligible** for are shown with a lock icon or a muted style. Common reasons:

- **CGPA too low** — your CGPA is below the job's minimum requirement
- **Branch not allowed** — your branch is not in the job's allowed branches list
- **Tier restriction** — you are already placed at a higher tier and cannot apply to lower-tier jobs
- **Registration closed** — the placement cell has closed registrations for the season

Hover over the indicator to see the specific reason.

### Tier System

| Tier | Package |
|------|---------|
| Tier 1 | > 9 LPA |
| Tier 2 | 5 – 9 LPA |
| Tier 3 | ≤ 5 LPA |
| Dream Offer | > 10 LPA (marked by admin; bypasses tier restrictions) |

Once placed in a higher tier, you cannot apply for lower-tier jobs (with some admin-configured exceptions).

### Job Detail Page

URL: `/jobs/[id]`

Click any job card to open its detail page. You will see:
- Full job description (rich text)
- Salary, location, work mode, job type
- Eligibility criteria (min CGPA, allowed branches, batch, max backlogs)
- Required skills
- Application deadline
- Number of positions
- Company announcements / updates (if any)

### Applying

1. On the job detail page, click **Apply Now**.
2. The application is submitted instantly (one-click apply — no cover letter required).
3. A QR code is generated for your application and stored in **My Applications**.
4. You receive an in-app notification confirming the application.

> You can only apply once per job. The button changes to **Applied** after submission.

---

## 6. Tracking Your Applications

URL: `/applications`

### My Applications Page

Lists all jobs you have applied for with:
- Company name and job title
- Application date
- **Status badge** — current stage in the hiring process
- Admin feedback (shown when provided)
- Interview date (shown when scheduled)
- Your QR code for attendance scanning

### Application Status Lifecycle

```
APPLIED → SHORTLISTED → INTERVIEW SCHEDULED → INTERVIEWED → SELECTED
                                                                  │
                                                    OFFER ACCEPTED / OFFER REJECTED

Any stage can also move to → REJECTED
```

| Status | Meaning |
|--------|---------|
| **Applied** | Application received, awaiting review |
| **Shortlisted** | You have been shortlisted for the next stage |
| **Interview Scheduled** | An interview has been scheduled; check the date shown |
| **Interviewed** | Interview recorded; result pending |
| **Selected** | You have been selected |
| **Offer Accepted** | Placement confirmed |
| **Offer Rejected** | You declined or the offer was withdrawn |
| **Rejected** | Not selected at this stage |

You receive an in-app notification every time your status changes.

---

## 7. Notifications

URL: `/notifications`

### Notification Bell

The bell icon in the top navigation bar shows a count of unread notifications. It refreshes every 30 seconds.

### Notifications Page

- Lists all notifications in reverse chronological order.
- Filter by **type** (Application Status, Interview Scheduled, Job Posted, KYC Update, System) or **read/unread**.
- Click a notification to mark it as read.
- Use **Mark All as Read** to clear the unread count.
- Delete individual notifications using the trash icon.

### Browser Push Notifications

Enable push notifications to receive alerts even when the tab is closed:

1. Go to **Settings** → **Notifications**.
2. Click **Enable Push Notifications**.
3. Allow the browser permission prompt.

You will receive a push notification whenever your application status changes or a new matching job is posted.

---

## 8. Schedule & Events

Events (placement drives, pre-placement talks, technical tests) are visible on the dashboard and can be browsed from the sidebar.

- Each event shows: title, date/time, location or online link, type.
- Click an event to see full details and register your attendance.
- Use **Register** to sign up for an event (where applicable).
- Your QR code from an application may be scanned at the event venue for attendance.

---

## 9. Documents & ID Card

URL: `/documents`

After KYC is verified:
- A placement **ID card** is available for download as a PDF.
- The **Download ID Card** button also appears on the dashboard.

This ID card is required for entry to on-campus placement drives.

---

## 10. Account Settings

URL: `/settings`

### Notifications Tab
- Toggle **Push Notifications** on/off.
- Push notifications require HTTPS and a compatible browser (Chrome, Firefox, Edge).

### Appearance Tab
- Switch between **Light** and **Dark** mode using the theme toggle.

### Security Tab

**For email/password accounts:**
1. Enter your **Current Password**.
2. Enter your **New Password** (minimum 8 characters).
3. Confirm the new password.
4. Click **Update Password**.

> The new password must be different from the current one.

**For Google (OAuth) accounts:**
- Password management is handled by Google. The security section shows a message indicating which provider manages your account.

---

# Admin Guide

---

## 11. Admin Login & Navigation

Admins log in through the same login page as students. After login, the portal detects the ADMIN role and shows admin navigation.

### Admin Sidebar

The sidebar at `/admin` contains:

| Menu Item | URL | Purpose |
|-----------|-----|---------|
| Dashboard | `/admin` | Overview stats and activity |
| Students | `/admin/students` | View all student profiles |
| KYC Queue | `/admin/students/kyc` | Review pending verifications |
| Jobs | `/admin/jobs` | Manage job postings |
| Placements | `/admin/placements` | Record and view placements |
| Analytics | `/admin/analytics` | Charts and statistics |
| Schedule | `/admin/schedule` | Manage events |
| Notifications | `/admin/notifications` | Send bulk messages |
| Companies | `/admin/companies` | Manage company records |
| Backup | `/admin/backup` | Export data |
| Settings | `/admin/settings` | Site configuration |

---

## 12. Admin Dashboard

URL: `/admin`

Shows real-time stats for the current placement season:

| Card | Metric |
|------|--------|
| Total Students | All registered student accounts |
| Verified Students | Students with KYC approved |
| Active Job Postings | Jobs currently open for applications |
| Total Applications | All submitted applications |
| Placed Students | Officially recorded placements |
| Upcoming Interviews | Events in the next 7 days |
| Pending KYC | Profiles awaiting verification |

**Batch Stats panel** (filtered to the active batch configured in Settings):
- Batch student count
- Batch placed count
- Placement rate %
- Average package (LPA)
- Tier distribution breakdown

**Announcement banner** — if an announcement is active in Settings, it appears prominently on this page.

---

## 13. Student Management

URL: `/admin/students`

### Student List

- Lists all registered students with: name, email, USN, branch, batch, KYC status, profile completion.
- Use the search bar to find by name, email, or USN.
- Filter by branch, batch, or KYC status using dropdowns.
- Click a student row to open their full profile.

### Viewing a Student Profile

Opens a detailed read-only view of the student's submitted profile including:
- Personal information, contact details
- Academic records (CGPA, 10th, 12th, backlogs)
- Uploaded documents (resume, ID card)
- KYC status and verification timestamp
- Application history

---

## 14. KYC Queue

URL: `/admin/students/kyc`

> `/admin/kyc-queue` redirects here automatically.

### Review Process

1. The page lists all students with **Pending** or **Under Review** KYC status.
2. Click a student to open their profile and view their uploaded College ID card.
3. Choose one of two actions:

**Approve:**
- Click **Approve KYC**.
- The student's status changes to **Verified**.
- The student receives an in-app notification.

**Reject:**
- Click **Reject KYC**.
- Enter a reason in the text box (e.g., "ID card is blurry, please resubmit").
- Click **Confirm Reject**.
- The student's status changes back to **Pending** and they receive a notification with your feedback.

---

## 15. Job Management

URL: `/admin/jobs`

### Job List

- Displays all jobs (Active, Draft, Closed, Cancelled) with applicant counts.
- **Stats bar** at the top: Total Jobs, Active, Draft, Total Applications.
- Click **Post New Job** to create a job.
- Click any job title to view its applicants.
- Click the edit icon (pencil) to edit a job.

### Creating a Job

URL: `/admin/jobs/new`

Fill in the form:

**Basic Details**
- Job title
- Company name — select from the companies list or type a new name
- Job type: FTE (Full-Time Employment), Internship, Training Internship
- Work mode: On-site, Remote, Hybrid
- Location
- Number of positions

**Compensation & Tier**
- Salary (LPA) — the tier is calculated automatically:
  - ≤ 5 LPA → Tier 3
  - 5–9 LPA → Tier 2
  - > 9 LPA → Tier 1
  - > 10 LPA + **Is Dream Offer** toggle → Dream Offer
- Toggle **Is Dream Offer** if the offer should bypass tier restrictions

**Eligibility Criteria**
- Minimum CGPA
- Allowed branches — select specific branches or leave empty for all
- Eligible batch year
- Maximum active backlogs allowed
- Required skills

**Job Description** — rich text editor (TipTap): add formatted description, responsibilities, requirements

**Deadline** — date and time picker; students will receive a deadline reminder 6 hours before cutoff

**Visibility** — set to **Draft** to save without publishing, or **Active** to publish immediately

Click **Save Job** (or **Publish**) to submit.

### Editing a Job

URL: `/admin/jobs/[id]/edit`

Same form as creation. You can change any field including status (Active → Closed, Draft → Active, etc.).

### Job Announcements / Updates

From the job list, click a job then select **Updates** tab (or navigate to the applicants page and find the announcements panel).

- Post a text announcement visible to all applicants of that job.
- Announcements appear on the job detail page for students.

### Job Status Values

| Status | Meaning |
|--------|---------|
| **Active** | Published and open for applications |
| **Draft** | Saved but not visible to students |
| **Closed** | No longer accepting applications |
| **Cancelled** | Cancelled and hidden |

---

## 16. Managing Applicants & Application Statuses

URL: `/admin/jobs/[id]/applicants`

### Applicants Table

For each job, the applicants table shows:
- Student name, email
- USN, branch, CGPA
- Current application **status badge**
- Application date
- Resume link

**Selection and bulk actions:**
- Check individual rows or use the **Select All** checkbox.
- **Export** selected rows to an Excel (.xlsx) file — choose which fields to include using the **Fields** dropdown.
- **Remove** selected applicants (soft delete with optional reason).

### Updating Application Status (per applicant)

Each row has two action controls on the right:

1. **Status action button** (the small dropdown with arrows) — opens the status transition menu showing only valid next steps for the applicant's current status:

   | Current Status | Available Actions |
   |---------------|-------------------|
   | Applied | Shortlist, Reject |
   | Shortlisted | Schedule Interview, Reject |
   | Interview Scheduled | Mark Interviewed, Reject |
   | Interviewed | Select, Reject |
   | Selected | Offer Accepted, Offer Rejected |

2. **More menu** (⋯ icon) — view resume, call, email, or remove the applicant.

### Status Update Dialog

When you click a status action, a confirmation dialog opens:
- For **Schedule Interview**: add the interview date and time and optional feedback.
- For **Reject**: add an optional rejection reason.
- For all other transitions: add optional feedback/notes.

Click **Confirm** to apply the status change. The student receives an automatic in-app notification with the new status.

### Removing an Applicant

Removing is a **soft delete** — the applicant record is hidden from the active list but preserved in the database. The removal reason is logged. You can restore removed applicants using the **Restore** action in the removed-applicants view.

---

## 17. Placement Records

URL: `/admin/placements`

### Viewing Placements

Lists all officially recorded placements with:
- Student name, branch, batch
- Company name, job title
- Package (LPA), tier
- Placement date

**Filters:** branch, batch, tier, date range.

**Stats panel:** total placed count, average package, tier breakdown.

### Recording a Placement

1. Click **Record Placement**.
2. Search for and select the student.
3. Select the job (or type the company/role manually).
4. Enter salary (LPA) and placement date.
5. Click **Save**.

> Recording a placement automatically tier-locks the student — they will be blocked from applying to lower-tier jobs going forward.

### Deleting a Placement Record

Click the delete icon on a placement row. This removes the placement record and unlocks the student's tier restrictions.

---

## 18. Analytics

URL: `/admin/analytics`

Two tabs:

### Placements Tab
- Placement count by branch (bar chart)
- Tier distribution (pie/donut chart)
- Top recruiting companies
- Salary / package distribution
- Monthly placement trends

### Students Tab
- Total students vs. verified count
- Branch-wise student distribution
- Monthly registration trends (last 6 months)
- KYC status breakdown

All charts are rendered with Recharts and reflect live database data.

---

## 19. Company Management

URL: `/admin/companies`

- Lists all registered companies with name, industry, website.
- Click **Add Company** to create a new record:
  - Company name, industry, website URL, description, logo URL
- Click a company name to view or edit its details.
- Delete a company using the delete icon (only possible if no jobs are linked to it).

Companies appear as selectable options when creating a new job posting.

---

## 20. Schedule & Events Management

URL: `/admin/schedule`

### Creating an Event

1. Click **Add Event**.
2. Fill in: title, event type (placement drive, pre-placement talk, test, interview, other), date, time, location or online meeting link, description.
3. Toggle **Visible to Students** to control whether students can see it.
4. Click **Save**.

### Managing Events

- Edit any event by clicking the edit icon.
- Delete an event using the delete icon.
- View registered attendees per event.
- Mark an event as **Completed** or **Cancelled** by editing its status.

### QR Code Attendance Scanning

URL: `/admin/attendance/scan`

1. Open the scanner on a device with a camera.
2. Select the job for which attendance is being taken.
3. Point the camera at the student's QR code (from their **My Applications** page).
4. The system verifies the application and records attendance. Duplicate scans are rejected.

---

## 21. Bulk Notifications

URL: `/admin/notifications`

### Sending a Notification

1. Click **Send Notification**.
2. Fill in:
   - **Title** — short subject line
   - **Message** — full notification body
   - **Notification Type** — Job Posted, Application Status, System, etc.
3. Select **Target Audience**:
   - All students
   - Verified students only
   - By specific branch (e.g., CSE only)
   - By specific batch year
4. Click **Send**.

All targeted students receive the notification in their in-app notification centre. If they have push notifications enabled, a browser push is also sent.

### Notification Stats

The right panel shows:
- Total notifications sent in a selected period
- Breakdown by type
- Recent notification history

---

## 22. Site Settings

URL: `/admin/settings`

Two tabs:

### Batch Access Control

Controls which student cohorts can log in and access the portal.

| Setting | Description |
|---------|-------------|
| **Active Admission Years** | Checkboxes for each admission year suffix (e.g., 20, 21, 22). Only students whose USN matches an active year can log in. Untick a year to lock out that cohort. |
| **College Code** | The USN prefix used to validate USN format on student profiles (e.g., `4SF`). |

Click **Save Batch Settings** to apply.

### Site Configuration

| Setting | Description |
|---------|-------------|
| **Placement Season Name** | Display name shown on dashboard and notifications (e.g., "2025-26 Placement Season") |
| **Active Batch** | The batch used for batch-level stats on the admin dashboard (e.g., "2021-2025") |
| **Registration Open** | Toggle — when off, students cannot submit new job applications |
| **Announcement Active** | Toggle — when on, the announcement text is shown as a banner on both student and admin dashboards |
| **Announcement Text** | The text to display in the banner |

Click **Save Site Settings** to apply. Changes take effect immediately.

---

## 23. Backup

URL: `/admin/backup`

### Creating a Backup

1. Select the **Batch Year** to export.
2. Check the **Fields** to include (name, USN, branch, CGPA, contact info, placement details, etc.).
3. Click **Start Backup**.
4. The system generates an Excel export. When complete, the status changes to **Completed** and a **Download** link appears.

### Backup History

The table below the form shows all previous backups:

| Column | Description |
|--------|-------------|
| Date | When the backup was initiated |
| Batch Year | Cohort exported |
| Status | Pending / Completed / Failed |
| Record Count | Number of student records included |
| File Size | Size of the generated file |
| Admin | Who triggered the backup |
| Actions | Download (if completed) |

> Backup files are stored in Cloudflare R2. Download links expire after a period configured in R2 settings.

---

## Quick Reference — URL Map

### Student Pages

| Page | URL |
|------|-----|
| Login | `/login` |
| Signup | `/signup` |
| Dashboard | `/dashboard` |
| Complete Profile | `/profile` |
| Browse Jobs | `/jobs` |
| Job Detail | `/jobs/[id]` |
| My Applications | `/applications` |
| Notifications | `/notifications` |
| Documents & ID Card | `/documents` |
| Settings | `/settings` |

### Admin Pages

| Page | URL |
|------|-----|
| Admin Dashboard | `/admin` |
| Students | `/admin/students` |
| KYC Queue | `/admin/students/kyc` |
| Job Management | `/admin/jobs` |
| New Job | `/admin/jobs/new` |
| Edit Job | `/admin/jobs/[id]/edit` |
| Job Applicants | `/admin/jobs/[id]/applicants` |
| Placements | `/admin/placements` |
| Analytics | `/admin/analytics` |
| Companies | `/admin/companies` |
| Schedule | `/admin/schedule` |
| Attendance Scan | `/admin/attendance/scan` |
| Bulk Notifications | `/admin/notifications` |
| Settings | `/admin/settings` |
| Backup | `/admin/backup` |

---

## Common Questions

**Q: I verified my email but still can't log in.**  
A: Your admission year may not be in the active years list. Contact the placement cell to check if your batch is enabled in Settings → Batch Access Control.

**Q: A job shows as locked even though my CGPA meets the requirement.**  
A: Check if your branch is in the job's allowed branches, and whether you are already placed at a higher tier. Also confirm your profile's branch and CGPA fields are filled in.

**Q: I applied for a job but don't see it in My Applications.**  
A: Refresh the page. If the job still does not appear, it may have been removed by the admin.

**Q: I'm not receiving push notifications.**  
A: Ensure you have granted notification permission in your browser settings (Site Settings → Notifications). Push notifications require HTTPS and do not work in Incognito mode.

**Q: My KYC was rejected. What document should I upload?**  
A: Read the rejection reason in your notification. Typically a clear photo or scan of your **College ID card** is required — both sides visible, not blurry, with the college name and your USN readable.

**Q (Admin): I closed a job by mistake.**  
A: Go to `/admin/jobs/[id]/edit`, change the Status back to **Active**, and save.

**Q (Admin): How do I re-open registrations after closing them?**  
A: Go to `/admin/settings` → Site Configuration → toggle **Registration Open** to ON, then click **Save Site Settings**.
