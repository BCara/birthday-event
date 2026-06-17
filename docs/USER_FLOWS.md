# Tiny Party Portal — User Flow Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax.
Paste any diagram into [https://mermaid.live](https://mermaid.live) to render it.

---

## 1. Host Signup & Onboarding

```mermaid
flowchart TD
    A([Visit tinypartyportal.com]) --> B{Have an account?}
    B -- No --> C[Click Sign Up]
    B -- Yes --> D[Click Log In]

    C --> E{Sign up method}
    E -- Google --> F[Google OAuth popup]
    E -- Email --> G[Enter name, email, password]
    G --> H{Password ≥ 6 chars?}
    H -- No --> I[Error: password too short]
    I --> G
    H -- Yes --> J{Email already registered?}
    J -- Yes --> K[Error: account already exists]
    K --> G
    J -- No --> L[Account created]

    F --> L
    L --> M[/dashboard/]
    M --> N[📧 Welcome email sent to host]

    D --> O{Login method}
    O -- Google --> P[Google OAuth popup]
    O -- Email/Password --> Q[Enter credentials]
    Q --> R{Credentials valid?}
    R -- No --> S[Error: invalid email or password]
    S --> Q
    R -- Yes --> M
    P --> M
```

---

## 2. Host Creates an Event

```mermaid
flowchart TD
    A([/dashboard/]) --> B[Click + New Party]
    B --> C[/dashboard/create]
    C --> D[Fill in required fields\nchild name · occasion · date]
    D --> E[Choose theme & colour scheme]
    E --> F[Configure RSVP settings\ntoggle on/off · questions · sibling rules]
    F --> G[Click Create Party]
    G --> H{Validation pass?}
    H -- No --> I[Show field errors]
    I --> D
    H -- Yes --> J[Event created in Firestore]
    J --> K[/dashboard/event/:id/]
    J --> L[📧 Host confirmation email sent\nYour Party is Ready!]
    J --> M[📧 Admin notification email sent]
```

---

## 3. Host Manages Event Details

```mermaid
flowchart TD
    A([/dashboard/event/:id/]) --> B[Edit any field\nname · date · time · location · theme · photo]

    B --> C[Upload birthday star photo]
    C --> D{Upload success?}
    D -- Yes --> E[Photo shown in preview + saved]
    D -- No --> F[Error toast]

    B --> G[Toggle RSVP on/off]
    G --> H[RSVP settings expand/collapse]
    H --> I[Set question toggles\nage · adults · dietary · siblings]

    B --> J[Add schedule items]
    B --> K[Add gift registry note/link]

    B --> L[Click View Invite]
    L --> M[Opens /slug in new tab]

    B --> N[Click RSVPs button]
    N --> O[/dashboard/event/:id/rsvps/]

    B --> P[Click Print Invite]
    P --> Q[/dashboard/event/:id/print/]
    Q --> R{Choose format}
    R -- Print --> S[Browser print dialog]
    R -- Download PDF --> T[PDF file downloaded]
    R -- Download Image --> U[PNG file downloaded]
```

---

## 4. Guest Views Invite & RSVPs

```mermaid
flowchart TD
    A([Guest receives invite link\n/slug or /share/slug]) --> B[/slug — Event Landing Page]
    B --> C{Event found?}
    C -- No --> D[Party not found screen]
    C -- Yes --> E[Themed invitation card shown]

    E --> F{Has guest already RSVPd?}
    F -- Yes, localStorage flag set --> G[Portal view shown\nsee Flow 6]
    F -- No --> H[Invitation view shown]

    H --> I{Guest actions}
    I -- Click RSVP NOW --> J[/slug/rsvp — RSVP Form\nsee Flow 5]
    I -- Add to Cal → Google --> K[Google Calendar opens prefilled]
    I -- Add to Cal → Apple/Outlook --> L[.ics file downloaded]
    I -- Click address --> M[Google Maps opens]
    I -- Already RSVPd? toggle --> N[Lookup form shown]

    N --> O[Enter name + contact]
    O --> P{Match found in Firestore?}
    P -- Yes --> G
    P -- No --> Q[Not found message]
    Q --> R[Contact Organiser form shown]
    R --> S[Enter name, contact, message]
    S --> T{Form valid?}
    T -- No --> S
    T -- Yes --> U[contactOrganiser Cloud Function called]
    U --> V[📧 Host receives guest message email]
    V --> W[Success message shown to guest]
```

---

## 5. Guest RSVP Form — Full Flow

```mermaid
flowchart TD
    A([/slug/rsvp]) --> B{Event found?}
    B -- No --> C[Event not found screen]
    B -- Yes --> D{Guest matching required?}
    D -- Yes --> E[Name + contact lookup form]
    E --> F{Match found?}
    F -- No --> G[Cannot proceed]
    F -- Yes --> H
    D -- No --> H

    H[Step 1: Attendance] --> I{Select attending?}
    I -- Yes --> J[Step 2: Child Info]
    I -- No --> K[Step 2: Child Info — decline path]

    J --> L[Enter child name + age if enabled]
    L --> M{Siblings allowed?}
    M -- Yes --> N[Add siblings: name, age, dietary]
    M -- No --> O
    N --> O[Step 3: Parent Info]
    K --> O

    O --> P[Enter parent name]
    P --> Q{Choose contact method}
    Q -- Email --> R[Enter email address]
    Q -- Phone --> S[Enter phone number]
    R --> T{Valid email format?}
    T -- No --> R
    T -- Yes --> U
    S --> U[Step 4: Details]

    U --> V{Is attending?}
    V -- Yes --> W[Stay/drop-off toggle if enabled]
    W --> X[Adults count if staying + enabled]
    X --> Y[Dietary notes if enabled]
    Y --> Z[Comments field]
    V -- No --> Z

    Z --> AA[Click Submit RSVP]
    AA --> BB{Event locked\nneeds approval?}
    BB -- Yes, new guest --> CC[RSVP saved with needs_approval status]
    CC --> DD[⏳ Request Submitted screen\nno confetti]
    CC --> EE[📧 Host email: Action Required]
    CC --> FF[📧 Guest email: Pending Approval\nif email provided]

    BB -- No --> GG[RSVP saved as attending/declined]
    GG --> HH[🎉 You're all set! screen + confetti\nor declined screen]
    GG --> II[📧 Host email: New RSVP]
    GG --> JJ[📧 Guest confirmation email\nif email provided]
```

---

## 5A. Guest Edits Existing RSVP

```mermaid
flowchart TD
    A([/slug/rsvp?edit=true\nor click CHANGE RSVP in portal]) --> B[Form pre-fills with existing data]
    B --> C[Guest makes changes\nattendance · details · contact]
    C --> D[Click Update RSVP]
    D --> E[RSVP document updated in Firestore]
    E --> F[Success screen]
    F --> G[Returns to portal view]
```

---

## 6. Event Portal — Post-RSVP Guest View

```mermaid
flowchart TD
    A([Landing page after RSVP\nor lookup match]) --> B[Portal view shown]
    B --> C[Status banner: YOU'RE GOING / NOT ATTENDING]

    B --> D{Is attending?}
    D -- Yes --> E[Show schedule if set]
    D -- Yes --> F[Show gift registry\nif host has set one]
    D -- Yes --> G[Show location, parking, maps link]
    D -- Yes --> H[Show countdown timer to event date]

    B --> I[Add to Calendar button\nGoogle / Apple / Outlook]
    B --> J[Contact host\nEmail or SMS based on host contact type]
    B --> K[Click CHANGE RSVP]
    K --> L[/slug/rsvp?edit=true]
```

---

## 7. Host Approves / Declines Guests (Lock Mode)

```mermaid
flowchart TD
    A([/dashboard/event/:id/rsvps/]) --> B[Needs Approval badge visible]
    B --> C[Click Needs Approval metric card to filter]
    C --> D[Guest shown with needs_approval status]

    D --> E{Host action}
    E -- Click Approve --> F[RSVP attending updated to true in Firestore]
    F --> G[Guest moves to Going list]
    F --> H{Guest has email?}
    H -- Yes --> I[📧 You're In! approval email sent to guest]
    H -- No --> J[No notification — phone only]

    E -- Click Decline --> K[RSVP attending updated to false]
    K --> L[Guest moves to Declined list]
    L --> M[No email sent on decline]
```

---

## 8. Host Manages Guest List

```mermaid
flowchart TD
    A([/dashboard/event/:id/rsvps/]) --> B{Actions available}

    B --> C[Search by name]
    C --> D[List filters live]

    B --> E[Click metric card\nGoing / Maybe / Declined]
    E --> F[List filters by status]

    B --> G[Click + Add Guest]
    G --> H[Inline form: name, email, phone]
    H --> I{Valid?}
    I -- No --> H
    I -- Yes --> J[Guest added to Firestore\nno email triggered — manual add]

    B --> K[Click Edit on guest]
    K --> L[Edit modal opens prefilled]
    L --> M[Save changes]
    M --> N[Firestore updated\nfresh getDoc read — no stale state]

    B --> O[Click Delete on guest]
    O --> P{Is sibling row?}
    P -- Yes --> Q[Fresh getDoc of parent\nRemove sibling from array]
    P -- No --> R[Delete RSVP document]

    B --> S[Magic Paste]
    S --> T[Paste natural language RSVP text]
    T --> U[parseRsvpMessage Cloud Function\nGemini AI parses text]
    U --> V{Parsed successfully?}
    V -- No --> W[Error toast]
    V -- Yes --> X[Preview shown: name, status, count]
    X --> Y[Confirm & Save]
    Y --> Z[Guest added to Firestore]

    B --> AA[Import List]
    AA --> BB[Upload CSV]
    BB --> CC[Guests added as pending\nno RSVP email triggered]

    B --> DD[Export CSV]
    DD --> EE[.csv downloaded with all guest data]

    B --> FF[Toggle Lock / Unlock]
    FF --> GG[event.lockDownRSVP toggled\naffects all future RSVPs]
```

---

## 9. Guest Submits a Memory

```mermaid
flowchart TD
    A([/slug/memories/new]) --> B{Event found?}
    B -- No --> C[Event not found screen]
    B -- Yes --> D[Memory submission form]

    D --> E[Enter name required]
    D --> F[Write optional message]
    D --> G[Upload photo or video optional]
    G --> H[File preview shown]

    E --> I[Click Share Memory]
    I --> J{Validation}
    J -- Name missing --> K[Error: please enter your name]
    J -- No message AND no file --> L[Error: add message or photo]
    J -- Valid --> M{File attached?}

    M -- Yes --> N[Upload to Firebase Storage\nProgress bar 0–100%]
    N --> O[Memory saved to Firestore\napproved: true by default]
    M -- No --> O

    O --> P[Success screen]
    P --> Q[Link back to event page]
```

---

## 10. Host Manages Memories

```mermaid
flowchart TD
    A([/dashboard — Memories tab]) --> B[Masonry grid of all memories]
    B --> C[Stats: Total · Approved · Pending]

    B --> D{Per memory actions}
    D -- Click Approve toggle --> E{Currently approved?}
    E -- Yes → unapprove --> F[approved set to false\nHidden from live display]
    E -- No → approve --> G[approved set to true\nVisible in live display]

    D -- Click Delete --> H[Memory deleted from Firestore\nFile removed from Storage]

    B --> I[Live Display link]
    I --> J[/slug/live — Slideshow screen]
    J --> K[Only approved memories shown]
    K --> L[Auto-advances every 7 seconds]
    L --> M{New memory approved?}
    M -- Yes --> N[Slideshow updates in real time\nno page refresh needed]
```

---

## 11. Email Notification Map

```mermaid
flowchart LR
    subgraph Triggers
        T1[New user signup]
        T2[New event created]
        T3[New RSVP submitted]
        T4[RSVP approved by host]
        T5[Guest contacts organiser]
        T6[Contact page form submitted]
    end

    subgraph Recipients
        R1[New host]
        R2[Event host]
        R3[Guest]
        R4[Admin\nclb.bertram@gmail.com]
        R5[Support team\ninfo@ + codebertcreations@]
    end

    T1 -->|Welcome email| R1
    T1 -->|New signup notification| R4

    T2 -->|Your Party is Ready!| R2
    T2 -->|New event notification| R4

    T3 -->|New RSVP / Action Required| R2
    T3 -->|RSVP Confirmed / Pending Approval\nonly if guest provided email| R3

    T4 -->|You're confirmed!\nonly if guest provided email| R3

    T5 -->|Guest message email\nreply-to set to guest email if they used one| R2

    T6 -->|Contact form submission| R5
```

---

## 12. Share Link & OG Preview

```mermaid
flowchart TD
    A([Host copies invite link\nhttps://tinypartyportal.com/share/slug]) --> B{Shared via}

    B -- WhatsApp / iMessage / social --> C[eventShareMeta Cloud Function]
    C --> D[Serves HTML with OG meta tags\ntitle · description · birthday star photo]
    D --> E[Rich preview card shown\nin chat or feed]
    E --> F[Recipient clicks preview]
    F --> G[JavaScript redirect to /slug]
    G --> H[Event landing page]

    B -- Direct link /slug --> H
    B -- /share/slug in browser --> I[ShareRedirect component]
    I --> J[window.location.replace to /slug]
    J --> H
```
