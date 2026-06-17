# Tiny Party Portal — Analytics Event Schema

How Google Analytics (GA4) is wired into the app, every event we send, and how to
verify it. Keep this in sync when you add or change `trackEvent()` calls.

---

## Setup

- GA4 runs through **Firebase Analytics** (`firebase/analytics`), initialised in
  `src/firebase.js`.
- It only turns on when **`VITE_FIREBASE_MEASUREMENT_ID`** is set in `.env` *and* the
  browser supports analytics. Until then, `trackEvent()` is a silent no-op (no errors,
  no data).
- Current measurement ID: **`G-GK4EZTJMKJ`** (GA4 property for `tinypartyportal.com`).
- All events go through one helper so nothing throws if analytics is disabled or blocked:

  ```js
  import { trackEvent } from '../firebase';
  trackEvent('event_name', { param: 'value' });
  ```

- **Page views** are tracked automatically on every route change in
  `src/layouts/MainLayout.jsx` (marketing + dashboard) and `src/layouts/GuestLayout.jsx`
  (guest pages), via the `page_view` event.

---

## Event reference

> **PII rule:** never send names, emails, phone numbers, child ages, or free-text into
> GA4 — it violates GA's terms and our privacy stance. Params below are deliberately
> aggregate/categorical only (counts, enums, booleans, IDs).

| Event | Fires when | Params | Source file |
|-------|-----------|--------|-------------|
| `page_view` | Any route change | `page_path`, `page_location` | `layouts/MainLayout.jsx`, `layouts/GuestLayout.jsx` |
| `sign_up` | Account created | `method`: `google` \| `email` | `pages/SignupPage.jsx` |
| `login` | Successful sign-in | `method`: `google` \| `email` | `pages/LoginPage.jsx` |
| `create_event_validation_failed` | Host hits "Create" but required fields are missing | `missing`: comma list of `child_name` \| `event_name` \| `date` | `pages/dashboard/CreateEventPage.jsx` |
| `create_event_failed` | Create attempt threw an error (e.g. permissions, network) | `reason`: `error` | `pages/dashboard/CreateEventPage.jsx` |
| `event_created` | Host creates a party | `theme`, `theme_color`, `rsvp_enabled` (bool), `lockdown` (bool) | `pages/dashboard/CreateEventPage.jsx` |
| `invite_shared` | Host shares the invite | `method`: `copy_link` \| `whatsapp` \| `qr_download` | `pages/dashboard/EventManagePage.jsx` |
| `invite_viewed` | Guest opens the event landing/portal | `event_id`, `rsvp_enabled` (bool) | `pages/guest/EventLandingPage.jsx` |
| `rsvp_submitted` | Guest submits or updates an RSVP | `attending`: `yes` \| `no` \| `needs_approval`; `party_size` (int, 0 if not attending); `is_edit` (bool) | `pages/guest/RSVPPage.jsx` |
| `rsvp_lookup` | Guest uses "Already RSVP'd?" lookup | `result`: `found` \| `not_found` | `pages/guest/RSVPPage.jsx` |
| `memory_uploaded` | Guest submits a memory | `has_media` (bool), `media_type`: `image` \| `video` \| `text` | `pages/guest/LeaveMemoryPage.jsx` |
| `contact_submitted` | Global contact form sent | _(none)_ | `pages/ContactPage.jsx` |

---

## Funnels these enable

**Host funnel**
```
sign_up  →  event_created  →  invite_shared
```

**Guest funnel** (per event)
```
invite_viewed  →  rsvp_submitted (attending=yes)
invite_viewed  →  memory_uploaded
```

`rsvp_lookup result=not_found` is a friction signal — a spike means guests can't find
their invite (typos, never invited, or cleared localStorage).

---

## Diagnosing "why didn't they create an event?"

GA4 can pinpoint **where** people drop off; it can only *proxy* **why**. Build this
funnel in **Explore → Funnel exploration**:

```
Step 1  page_view  page_path = /signup        (or sign_up)
Step 2  sign_up                                (account made)
Step 3  page_view  page_path contains /dashboard/create   (reached the form)
Step 4  event_created                          (finished)
```

Read it like this:

| Drop between | What it means | Likely fix |
|--------------|---------------|------------|
| Step 1 → 2 | They bounced off signup | signup friction, trust, password rules |
| Step 2 → 3 | Signed up but never opened the create form | unclear next step on the dashboard / no obvious CTA |
| Step 3 → 4 | Opened the form but never finished | the form is the problem — see below |

For the Step 3 → 4 group (opened but didn't finish), cross-reference:
- **`create_event_validation_failed`** — they *tried* to submit and a required field
  blocked them. Break down by the `missing` param to see which field (`date` is the
  usual culprit). High count here = a fixable form problem, not disinterest.
- **`create_event_failed`** — a technical error stopped them. Any volume here is a bug
  to chase in logs.
- **Neither event fired** — they opened the form and left without submitting. That's
  silent abandonment; GA can't tell you why (too long, confusing, distracted, changed
  their mind). For that you need qualitative tools — see below.

### Segment the droppers
In any of the above, add a **comparison/secondary dimension** to find patterns:
- **Device category** — mobile drop-off is often layout/keyboard friction.
- **Session source / medium** — low-intent traffic (e.g. random social) converts worse.
- **Country / language** — copy or currency mismatch.

### The "why" GA4 can't give you
For silent abandonment, add a session-replay / heatmap tool. **Microsoft Clarity** is
free and drops in with one script tag — it shows recordings of people rage-clicking,
hesitating, or bailing on a specific field, plus "dead click" and scroll heatmaps. Pair
that with a one-question exit survey ("What stopped you?") for the real answer.

> **Caveat for now:** while this is a personal-party test run, traffic is tiny. Funnels
> need volume to be trustworthy — with a handful of users, one person skews everything.
> At this stage, watching 3–4 Clarity recordings or just asking testers directly will
> tell you far more than the GA funnel will.

---

## Recommended GA4 console config

In **Admin → Events**, mark these as **key events (conversions)**:
- `sign_up`
- `event_created`
- `rsvp_submitted`

Optionally register custom dimensions for params you want to break reports down by
(e.g. `attending`, `method`, `theme`) under **Admin → Custom definitions**.

---

## Verifying

1. Set `VITE_FIREBASE_MEASUREMENT_ID` in `.env`, then `npm run build && firebase deploy --only hosting`.
2. Open the live site and check **GA4 → Reports → Realtime** or **Admin → DebugView** —
   events appear within seconds.
3. Standard reports (Engagement → Events) lag ~24–48h; don't judge by those on day one.

---

## Adding a new event

1. `import { trackEvent } from '<relative>/firebase';`
2. Call `trackEvent('snake_case_name', { /* non-PII params */ });` at the success point.
3. Add a row to the table above so this stays the single source of truth.
</content>
