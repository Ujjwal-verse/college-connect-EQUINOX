# Backend

The server-side API is in `app/api/` and shared policy and data handling lives in `lib/`.

- `app/api/tickets/` — campus reports, role-based visibility, assignment, repair stages, reminders, verification, and faculty closure.
- `app/api/community/` — student community plus the all-role Campus Committee. Committee messages can link to shared campus reports for discussion.
- `app/api/emergency-image/` — emergency-only Gemini image observation; key is read server-side from `GEMINI_API_KEY`.
- `app/api/session/`, `profile/`, `events/`, and `analyze/` — demo login, account profile, event responses, and rules-based report routing.
- `lib/` — session, authorization, accounts, report rules, privacy filtering, and shared-campuses logic.

Students can read campus-visible reports. Staff can read them all but can only claim/update work in their department or assigned jobs. Faculty can coordinate and close campus work.
