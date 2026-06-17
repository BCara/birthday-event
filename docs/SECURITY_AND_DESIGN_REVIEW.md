# Tiny Party Portal — Security & Design Review

_Date: 2026-06-13. Covers Firebase rules, Cloud Functions, host dashboard, guest-facing
flow, auth and config. Severity reflects impact given the app stores children's and
parents' personal data (names, ages, emails, phones, dietary/allergy info)._

Status legend: ✅ fixed in this pass · 🟡 partially mitigated (follow-up needed) ·
⬜ documented, not yet actioned.

---

## CRITICAL

### C1 — Any guest could read/list/edit/delete every RSVP for a published event ✅
`firestore.rules` (rsvps block).
- The `list` rule let any guest download **all** RSVP documents for a published event
  (full names, ages, emails, phones, dietary notes) — a bulk PII-harvesting hole. The
  "Already RSVP'd?" lookup relied on this (it downloaded the whole collection and filtered
  client-side).
- The `get/update/delete` rule ended in `|| true`, so anyone could also modify or delete
  any RSVP.
- **Fix:** `list` and `delete` are now host-only. Guest "find my RSVP" moved to a
  server-side Cloud Function (`lookupRsvp`) that requires child name **and** matching
  email/phone before returning anything. `get`/`update` remain open as a deliberate
  bearer-token model (you must know the unguessable 20-char document ID — e.g. from your
  own localStorage or edit link). Create is validated (see C3).
- **Residual risk (documented):** holding an RSVP's document ID grants read/edit of that
  one RSVP. This is the intended "edit-link" design. A fully locked-down version would
  route all reads/writes through Cloud Functions — see follow-up F1.

### C2 — Firebase Storage was world-readable AND world-writable with no limits ✅
`storage.rules`.
- `allow read, write: if true` on `memories/**` and `event-photos/**` let anyone upload
  unlimited files of any type/size, and **overwrite or delete** existing photos/memories.
- **Fix:** uploads are now create-only (no overwrite/delete by clients), restricted to
  image/* (<15 MB) and video/* (<200 MB). Event-photo uploads additionally require an
  authenticated user. Host memory deletion still works (it only removes the Firestore doc).

### C3 — `memories` collection had no Firestore rule ✅
`firestore.rules`.
- The repo ruleset defined `users`, `events`, `rsvps` then default-deny — the `memories`
  collection (used by the memory wall / live display / leave-a-memory) had **no rule**, so
  under these rules every memory read/write is denied. (The live deployment may differ from
  the repo, which is itself a risk.)
- **Fix:** added an explicit `memories` rule — public read, validated public create (size
  caps on text), update/delete host-only.

---

## HIGH

### H1 — RSVP creation is an open email-sending oracle 🟡
`firestore.rules` (rsvps create) + `functions/index.js` (`onRsvpCreated`).
- Anyone can create an RSVP doc with an arbitrary `email`; the function then sends a styled
  email from the Resend account to that address — usable to spam third parties and the host,
  and to burn the sender reputation.
- **Mitigated:** create is now validated (event must be published; size caps on all text
  fields and the siblings array) which limits payload abuse.
- **Follow-up (F2):** the real fix is **Firebase App Check** (attestation on callable +
  Firestore writes) plus per-event rate limiting. Requires Firebase console setup.

### H2 — Unauthenticated callable functions with no abuse controls 🟡
`functions/index.js` — `contactOrganiser`, `submitGlobalContactForm`.
- No auth, no captcha, no rate limit, no length caps → spam relays to host/admin inboxes.
- **Mitigated:** added field validation and length caps (name ≤100, contact ≤200,
  message ≤4000, basic email shape) to both functions.
- **Follow-up (F2):** App Check + rate limiting.

### H3 — No email verification and no password reset ✅
`AuthContext.jsx`, `SignupPage.jsx`, `LoginPage.jsx`.
- Signup never verified emails; there was no "Forgot password?" path, so a locked-out host
  permanently lost their event.
- **Fix:** signup now sends a verification email (non-blocking — does not gate access),
  minimum password length raised to 8, and a "Forgot password?" flow
  (`sendPasswordResetEmail`) added to the login page.

---

## MEDIUM (documented, not yet actioned unless noted)

- **M1** ⬜ `events` create doesn't bind `hostId` to the caller, and update can change it —
  a user can create/alter events under another UID. Add
  `request.resource.data.hostId == request.auth.uid` on create and freeze it on update.
- **M2** ✅ Admin/notification emails interpolated `eventName`/`childName`/`displayName`
  unescaped (`onEventCreated`, `onUserCreated`) — HTML injection into our own inboxes. Now
  escaped.
- **M3** ✅ `contactOrganiser` used `/\\n/g` (literal backslash-n) instead of `/\n/g` when
  converting newlines. Fixed.
- **M4** ⬜ Event password stored in plaintext in Firestore (`CreateEventPage`,
  `EventManagePage`). Hash server-side if the password gate is kept.
- **M5** ⬜ Slug uniqueness is check-then-write (race). Use a `slugs/{slug}` reservation doc
  in a transaction, or a Cloud Function.
- **M6** ⬜ Google Maps API key shipped to the client (`LocationInput`). Acceptable only if
  HTTP-referrer-restricted in Google Cloud console — verify.
- **M7** ⬜ `/dev/themes` route ships in production (`router.jsx`). Gate behind
  `import.meta.env.DEV`.
- **M8** ⬜ Hardcoded personal emails in `functions/index.js` (admin/notify addresses).
  Move to config/secrets.
- **M9** ⬜ Server-side validation generally absent: RSVP deadline not enforced; approval/
  lockdown logic is client-side and bypassable. Durable fix is routing guest writes through
  Cloud Functions (F1).
- **M10** ⬜ Two god components: `EventManagePage.jsx` (~1340 lines) and `GuestListPage.jsx`.
  Extract sub-components.
- **M11** ⬜ Scalability: guest list, memories and lookup load entire collections
  client-side. Add pagination once past a few hundred docs.
- **M12** ⬜ Stubbed/dead UI: `BillingPage` calls `createStripeCheckoutSession` which does
  not exist; "Send Reminder" button is unwired. Wire up or hide.

## LOW (documented)

- **L1** ⬜ RSVP doc IDs (bearer tokens) live in localStorage — shared-device leakage.
- **L2** ⬜ QR codes generated via third-party `api.qrserver.com` (leaks invite URLs).
  Generate client-side instead.
- **L3** ⬜ Calendar export doesn't fully sanitise newlines/`&` for ICS / Google Calendar URLs.
- **L4** ⬜ `/login` and `/signup` should set `noindex` (login already does); no CSP headers.
- **L5** ⬜ `RequireAuth` renders `null` while auth resolves (blank flash) — return the loader.
- **L6** ⬜ Login doesn't preserve the originally-requested URL after redirect.

---

## FOLLOW-UPS REQUIRING CONSOLE / PRODUCT DECISIONS

- **F1** — Route all guest RSVP reads/writes through Cloud Functions (fully removes the
  bearer-token residual in C1 and makes approval/lockdown/ deadline server-authoritative).
- **F2** — Enable **Firebase App Check** (reCAPTCHA Enterprise/v3) and enforce it on callable
  functions and Firestore/Storage — this is the proper fix for H1/H2.
- **F3** — Add `@firebase/rules-unit-testing` tests so a regression like the `|| true` in C1
  can never ship silently again.
- **F4** — Decide on memory moderation (currently auto-approved and shown on the live display
  within seconds of upload).

---

## DEPLOYMENT NOTES (order matters — live site)

The rules changes depend on the new `lookupRsvp` function and the rebuilt client. Deploy in
this order to avoid breaking the live guest flow:

1. `firebase deploy --only functions` (publishes `lookupRsvp` + validation changes)
2. `npm run build && firebase deploy --only hosting` (client that calls `lookupRsvp`)
3. `firebase deploy --only firestore:rules,storage` (locks down access)

If rules are deployed before steps 1–2, the "Already RSVP'd?" lookup will fail until the
client/function catch up.
</content>
</invoke>
