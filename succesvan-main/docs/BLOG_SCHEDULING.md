# Blog Scheduling System

## Overview
Allows admins to schedule blog posts for future auto-publishing from the dashboard. Blogs transition from `draft` → `scheduled` → `published` automatically at the set date/time.

## How It Works

```
Admin clicks "Schedule Publish" on a blog in the dashboard
  ↓
Picks a date & time in the modal
  ↓
POST /api/blog/schedule { blogId, scheduledPublishDate }
  ↓
Blog status → "scheduled", scheduledPublishDate saved
  ↓
Cron/worker hits GET /api/cron/publish-blogs periodically
  ↓
Finds all scheduled blogs where scheduledPublishDate ≤ now
  ↓
Updates each blog: status → "published", clears scheduledPublishDate
```

## Files Changed / Created

### 1. Model — `model/blogs.ts`
- Added `"scheduled"` to the `status` enum: `["draft", "published", "archived", "scheduled"]`
- Added `scheduledPublishDate: { type: Date, default: null }` field

### 2. Schedule API — `app/api/blog/schedule/route.ts` (NEW)
**POST** — Schedule a blog for future publishing
- **Auth**: Admin only (JWT)
- **Body**: `{ blogId: string, scheduledPublishDate: string (ISO date) }`
- **Validation**: Date must be in the future, blog must exist
- **Action**: Sets `status = "scheduled"` and stores the publish date

**DELETE** — Cancel a scheduled publish
- **Auth**: Admin only (JWT)
- **Body**: `{ blogId: string }`
- **Validation**: Blog must be in `"scheduled"` status
- **Action**: Reverts `status = "draft"`, clears `scheduledPublishDate`

### 3. Cron Worker — `app/api/cron/publish-blogs/route.ts` (NEW)
**GET** — Publishes all due scheduled blogs
- **Auth**: `CRON_SECRET` bearer token (optional in dev)
- **Query**: Finds blogs where `status = "scheduled"` AND `scheduledPublishDate <= now`
- **Action**: Sets `status = "published"`, copies scheduledPublishDate to `seo.publishDate`, clears `scheduledPublishDate`
- **Response**: Returns count of published blogs and their IDs

### 4. Blog List API — `app/api/blog/route.ts`
- Already included `scheduledPublishDate` in the `.select()` query (no change needed)

### 5. Dashboard UI — `components/dashboard/BlogManagement.tsx`
- **Schedule Modal**: Date picker + time picker with live preview of the publish date/time
- **"Schedule Publish" button**: In the actions dropdown (⋮ menu) for draft/archived blogs
- **"Cancel Schedule" button**: Replaces the schedule button when a blog is already scheduled
- **Purple "Scheduled" badge**: Shows in the status column with the scheduled date below it
- **"Scheduled" filter**: Added to the status dropdown filter
- **New imports**: `FiCalendar` icon
- **New state**: `scheduleModalOpen`, `blogToSchedule`, `scheduleDate`, `scheduleTime`, `isScheduling`
- **New functions**: `openScheduleModal()`, `handleSchedule()`, `handleCancelSchedule()`

## Environment Variables

Add to `.env.local`:
```env
CRON_SECRET=your-secret-key-here
```

## Setting Up the Cron Job

The worker endpoint needs to be called periodically. Options:

### Option A: External Cron Service (Recommended)
Use [cron-job.org](https://cron-job.org), UptimeRobot, or similar:
- **URL**: `https://yourdomain.com/api/cron/publish-blogs`
- **Method**: GET
- **Header**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Interval**: Every 1-5 minutes

### Option B: Vercel Cron (if on Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/publish-blogs",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option C: AWS EventBridge (if on Amplify)
Create a rule that triggers every 5 minutes hitting your endpoint with the CRON_SECRET header.

## API Examples

### Schedule a blog
```bash
curl -X POST https://yourdomain.com/api/blog/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"blogId": "abc123", "scheduledPublishDate": "2026-04-10T09:00:00.000Z"}'
```

### Cancel a schedule
```bash
curl -X DELETE https://yourdomain.com/api/blog/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"blogId": "abc123"}'
```

### Trigger cron manually
```bash
curl https://yourdomain.com/api/cron/publish-blogs \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
