# college-connect-EQUINOX

# CampusConnect

Private campus maintenance demo with a login-first interface and separate student, working staff and faculty dashboards. Scope: one campus and plumbing, electricity, cleanliness and internet complaints.

## Roles and workflow
- Students create reports with location and optional photo, review extracted details, view only their reports, and verify/reopen fixes.
- Working staff see only jobs assigned to their registered staff account. They start work, add updates and submit repairs for verification.
- Faculty (Dean/Warden demo accounts) see campus reports, assign registered department staff, review possible duplicates, verify repairs and reopen issues.
- Stages: Submitted → Assigned → In progress → Awaiting verification → Resolved. Reopening returns to Assigned when an assignee exists.
- Server handlers enforce visibility, role restrictions, department matching, stage transitions and optimistic concurrency. The role in a client request never authorizes an action.

## Demo access
| Role | Identifier | Email / phone | Login key |
|---|---|---|---|
| Student Aarav | DEMO2026001 | aarav@demo.university.test | STUDENT-DEMO-26 |
| Student Meera | DEMO2026002 | meera@demo.university.test | STUDENT-DEMO-26 |
| Plumbing Ravi | STAFF-P01 | 0000000001 | STAFF-DEMO-26 |
| Electrical Priya | STAFF-E01 | 0000000002 | STAFF-DEMO-26 |
| Housekeeping Sana | STAFF-C01 | 0000000003 | STAFF-DEMO-26 |
| IT Dev | STAFF-I01 | 0000000004 | STAFF-DEMO-26 |
| Dean Kavya | — | dean@demo.university.test | DEAN-DEMO-26 |
| Warden Ananya | — | warden@demo.university.test | WARDEN-DEMO-26 |

These are intentionally public sample credentials. `.test` email addresses and zero-prefixed phone values are fictional and no emails/SMS are sent. The outer Sites ChatGPT access boundary remains private. App role sessions are eight-hour opaque HttpOnly/Secure/SameSite cookies stored hashed in D1 and bound to the outer Site user. Different outer Site owners have isolated demo data. This is not production university authentication: there is no real roster, email verification, phone OTP or account provisioning. Do not widen the Site's audience for real campus use without replacing sample identities with verified membership.

## Presenting the demo
1. Sign in as Dean. Open Demo access & setup and load six examples (idempotent; existing reports preserved).
2. Review new plumbing reports and possible duplicates. Assign a plumbing report to Ravi.
3. Sign out, then sign in as Ravi using STAFF-P01, 0000000001 and STAFF-DEMO-26.
4. Start the assigned work, then submit a completion note for verification.
5. Sign out, sign in as the reporting student, and confirm the fix or reopen it.
6. Return as Dean to inspect the workload, five-stage pipeline and complete audit timeline.
Each role has a distinct dashboard and navigation. Use separate browser profiles for simultaneous role sessions. Cookies are shared by tabs in the same browser profile.

## AI and routing
Configure GEMINI_API_KEY (secret) and GEMINI_MODEL through Sites runtime environment settings, then redeploy. The server calls Gemini generateContent with description, optional photo and demo routing rules; validates a JSON response and times out after 20 seconds. Without configuration or when Gemini fails, the app clearly labels rules-based text suggestions. Live Gemini has not been tested without credentials. Demo routing rules must be replaced with the supplied campus guide. Duplicate suggestions use category and building matching and require faculty review; links never delete or merge tickets.

## Stack and data
React + TypeScript + Vinext, Cloudflare D1, Sites hosting. Managed database replaces the originally discussed Supabase to avoid extra account setup. Existing tickets remain intact; legacy owner tickets without a reporter default to the first demo student. Schema migrations are append-only. Demo seed examples are separate from migrations. Small photos are resized and stored alongside ticket JSON; use object storage before larger-scale use.

## Validation
`node tests/roles.mjs` runs the actual API handler code with an in-memory SQLite database and mocked platform identity/cookie transport. It covers unauthorized access, invalid credentials, cross-origin requests, student isolation, staff assignment scope, department checks, invalid transitions, full resolution/reopen cycle, duplicate linking, seed idempotency, stale writes, logout revocation and workspace binding. It does not validate the hosted ChatGPT sign-in boundary, browser cookie transport or live Gemini network calls.
`node node_modules/typescript/bin/tsc --noEmit` checks types. Build using the Sites build helper.

## Four-person ownership
Student reporting and UI; staff workspace and repair UX; backend/auth and faculty coordination; Gemini evaluation, demo guide and QA. Split the main client component before concurrent edits. Final campus rollout also requires verified membership, rate limits, pagination and a real campus routing guide.
