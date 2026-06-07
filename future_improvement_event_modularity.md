# Future Improvement: Event Modularity (Feature Toggles)

This document contains the implementation design, UI flow, and full file diffs for the **3-Pillar Event Modularity** system. This feature allows hosts to toggle three main event pillars independently:
1. **RSVP & Guest List**
2. **Event Website**
3. **Memories & Gallery**

It has been temporarily removed from the main branch but is archived here for future reference.

---

## Architectural & UI Design

### 1. Database Fields (Firestore)
Each event document in Firestore tracks the following boolean fields:
- `rsvpEnabled` (default: `true`)
- `websiteEnabled` (default: `true`)
- `memoriesEnabled` (default: `false`)

### 2. Host Page (`EventManagePage.jsx`)
- **Toggles UI**: A modular toggle control card for each of the three modules is placed at the top of the event form.
- **Conditional Sections**:
  - If `websiteEnabled` is toggled off, style/theme selection, location details, message, and schedule builders are hidden to simplify the form.
  - If `rsvpEnabled` is toggled off, granular RSVP settings (estimated kids/adults, custom guest questions, drop-off rules) are hidden.

### 3. Guest Flow & Redirection
- **Landing Page (`EventLandingPage.jsx`)**:
  - If `websiteEnabled` is `false`, guests visiting the main invitation link `/:slug` are immediately redirected to the RSVP page `/:slug/rsvp` (if `rsvpEnabled` is `true`).
  - If `memoriesEnabled` is `true`, a "Memories" button is shown on the website details view leading to the memory wall.
- **RSVP Page (`RSVPPage.jsx`)**:
  - If `rsvpEnabled` is `false`, the RSVP form is hidden, and guests see a clean "RSVP is not enabled" fallback state.

---

## Full Code Diffs

### 1. Host Dashboard (`src/pages/dashboard/EventManagePage.jsx`)

```diff
diff --git a/src/pages/dashboard/EventManagePage.jsx b/src/pages/dashboard/EventManagePage.jsx
index 1be1600..7c5e219 100644
--- a/src/pages/dashboard/EventManagePage.jsx
+++ b/src/pages/dashboard/EventManagePage.jsx
@@ -8,6 +8,7 @@ import { db, storage } from '../../firebase';
 import { THEMES, THEME_COLOR_SCHEMES } from '../../utils/themes';
 import MiniPreview from '../../components/MiniPreview';
 import LocationInput from '../../components/LocationInput';
+import ModuleCard from '../../components/ModuleCard'; // Needs to be added or implemented
 import Toggle from '../../components/Toggle';
 import { getDevSafeOrigin } from '../../utils/url';
 import { Plus, X } from 'lucide-react';
@@ -316,6 +317,9 @@ export default function EventManagePage() {
       setGeneralInfo(data.generalInfo ?? '');
       setParkingInfo(data.parkingInfo ?? '');
       setHostContact(data.hostContact ?? '');
+      setRsvpEnabled(data.rsvpEnabled ?? true);
+      setWebsiteEnabled(data.websiteEnabled ?? true);
+      setMemoriesEnabled(data.memoriesEnabled ?? false);
       setShowParentAttendance(data.showParentAttendance ?? true);
       setStayOrDropOffMode(data.stayOrDropOffMode ?? 'ask');
       setAskChildAge(data.askChildAge ?? true);
@@ -357,6 +361,9 @@ export default function EventManagePage() {
         generalInfo: generalInfo.trim(),
         parkingInfo: parkingInfo.trim(),
         hostContact: hostContact.trim(),
+        rsvpEnabled,
+        websiteEnabled,
+        memoriesEnabled,
         showParentAttendance,
         stayOrDropOffMode,
         askChildAge,
@@ -502,6 +509,39 @@ export default function EventManagePage() {
           {/* Edit Form Column */}
           <form onSubmit={handleSave} className="em-form-col">
 
+            <div className="kb-card" style={{ ...styles.card, background: 'linear-gradient(145deg, var(--kb-surface) 0%, rgba(255,255,255,0.4) 100%)' }}>
+              <h3 style={styles.cardTitle}><span>🧩</span> Event Modules</h3>
+              <p style={{ color: 'var(--kb-text-muted)', fontSize: 14, marginBottom: 24, marginTop: -12 }}>
+                Customize the features available for this event. Turn off what you don't need to keep things simple.
+              </p>
+              
+              <ModuleCard 
+                title="RSVP & Guest List" 
+                description="Collect RSVPs, track dietary needs, and manage your guest list."
+                icon="🎟️" 
+                checked={rsvpEnabled} 
+                onChange={setRsvpEnabled} 
+                accentColor="var(--kb-purple)" 
+              />
+              
+              <ModuleCard 
+                title="Event Website" 
+                description="Publish a shareable website with your schedule, location, and details."
+                icon="🌐" 
+                checked={websiteEnabled} 
+                onChange={setWebsiteEnabled} 
+                accentColor="var(--kb-mint)" 
+              />
+              
+              <ModuleCard 
+                title="Memories & Gallery" 
+                description="Allow guests to upload photos and leave messages after the event."
+                icon="📸" 
+                checked={memoriesEnabled} 
+                onChange={setMemoriesEnabled} 
+                accentColor="var(--kb-coral)" 
+              />
+            </div>
+
             <div className="kb-card" style={styles.card}>
               <h3 style={styles.cardTitle}><span>📝</span> Basic Information</h3>
               
@@ -554,6 +594,7 @@ export default function EventManagePage() {
               </div>
             </div>
 
+            {websiteEnabled && (
             <div className="kb-card" style={styles.card}>
               <h3 style={styles.cardTitle}><span>🎨</span> Theme & Style</h3>
               <div style={styles.themePicker}>
@@ -616,6 +657,7 @@ export default function EventManagePage() {
                 </div>
               </div>
             </div>
+            )}
 
             <div className="kb-card" style={styles.card}>
               <h3 style={styles.cardTitle}><span>📅</span> Date & Time</h3>
@@ -639,18 +681,25 @@ export default function EventManagePage() {
               </div>
             </div>
 
+            {websiteEnabled && (
+              <>
+                <div className="kb-card" style={{ ...styles.card, overflow: 'visible' }}>
+                  <h3 style={styles.cardTitle}><span>📍</span> Event Location</h3>
+                  <div style={{display: 'flex', gap: 16, alignItems: 'flex-end'}}>
+                    <div className="kb-field" style={{ flex: 1, marginBottom: 0 }}>
+                      <LocationInput id="em-location" value={location} onChange={setLocation} placeholder="Myuna Farm" />
+                    </div>
+                    <img src="/images/park_trees_icon_1779434614720.png" alt="Trees" style={{height: 68}} />
+                  </div>
+                </div>
+
+                <div className="kb-card" style={styles.card}>
+                  <h3 style={styles.cardTitle}><span>💬</span> Message to Guests</h3>
+                  <div className="kb-field" style={{marginBottom: 0, position: 'relative'}}>
+                    <textarea id="em-description" className="kb-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add a special message for your guests..." style={styles.textarea} />
+                    <span style={{position: 'absolute', bottom: 12, right: 12, fontSize: 20}}>🎉</span>
+                  </div>
+                </div>
+              </>
+            )}
 
+            {rsvpEnabled && (
             <div className="kb-card" style={styles.card}>
               <h3 style={styles.cardTitle}><span>✅</span> RSVP Settings</h3>
               <div style={styles.toggleGroup}>
@@ -714,6 +763,7 @@ export default function EventManagePage() {
                 </div>
               </div>
             </div>
+            )}
 
+            {websiteEnabled && (
             <div className="kb-card" style={styles.card}>
               <h3 style={styles.cardTitle}><span>✨</span> Event Info (Optional)</h3>
               
@@ -825,6 +875,7 @@ export default function EventManagePage() {
                 </div>
               </div>
             </div>
+            )}
 
             <div style={styles.saveRow}>
```

---

### 2. Guest Portal (`src/pages/guest/EventLandingPage.jsx`)

```diff
diff --git a/src/pages/guest/EventLandingPage.jsx b/src/pages/guest/EventLandingPage.jsx
index ec1404c..efc464c 100644
--- a/src/pages/guest/EventLandingPage.jsx
+++ b/src/pages/guest/EventLandingPage.jsx
@@ -37,6 +37,13 @@ export default function EventLandingPage() {
         setError('Event not found');
         return;
       }
+      const data = snap.data();
+      // Redirection logic for websiteEnabled module:
+      // If website is disabled but RSVP is enabled, send them straight to RSVP page.
+      if (data.websiteEnabled === false && data.rsvpEnabled !== false) {
+        navigate(`/${slug}/rsvp`, { replace: true });
+        return;
+      }
       setEvent({ id: snap.id, ...snap.data() });
     }, err => {
       console.error(err);
@@ -107,10 +114,19 @@ export default function EventLandingPage() {
 
           {/* Action Buttons */}
           <div className="elp-actions">
-            <Link to={`/${slug}/rsvp`} className="elp-btn elp-btn-primary">
-              🎟️ RSVP NOW
-            </Link>
+            {event.rsvpEnabled !== false && (
+              <Link to={`/${slug}/rsvp`} className="elp-btn elp-btn-primary">
+                🎟️ RSVP NOW
+              </Link>
+            )}
+            
+            {event.memoriesEnabled === true && (
+              <Link to={`/${slug}/memories`} className="elp-btn elp-btn-secondary" style={{ border: '2px solid var(--t-accent)', background: 'var(--t-surface)', color: 'var(--t-accent)' }}>
+                📸 MEMORIES
+              </Link>
+            )}
           </div>
         </div>
```

---

### 3. Guest RSVP Form (`src/pages/guest/RSVPPage.jsx`)

```diff
diff --git a/src/pages/guest/RSVPPage.jsx b/src/pages/guest/RSVPPage.jsx
index add649e..a19c5c2 100644
--- a/src/pages/guest/RSVPPage.jsx
+++ b/src/pages/guest/RSVPPage.jsx
@@ -48,6 +48,15 @@ export default function RSVPPage() {
   if (error) return <div className="rsvp-error-screen">{error}</div>;
   if (!event) return null;
 
+  // Fallback UI if RSVP is disabled by host
+  if (event.rsvpEnabled === false) {
+    return (
+      <div className="rsvp-container">
+        <div className="rsvp-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
+          <span style={{ fontSize: 48 }}>🎟️</span>
+          <h2 style={{ fontFamily: 'var(--t-font-heading)', color: 'var(--t-text)', marginTop: 16 }}>RSVP Closed</h2>
+          <p style={{ fontFamily: 'var(--t-font-body)', color: 'var(--t-text-light)', marginTop: 8 }}>
+            Online RSVPs are not enabled or have been closed for this event. Please contact the host directly.
+          </p>
+          {event.hostContact && (
+            <p style={{ marginTop: 24, fontSize: 14, fontWeight: 'bold' }}>
+              📞 Host Contact: {event.hostContact}
+            </p>
+          )}
+          <Link to={`/${slug}`} className="rsvp-btn" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>
+            ← Return to Event Portal
+          </Link>
+        </div>
+      </div>
+    );
+  }
+
   const isPastEvent = event.date ? new Date(event.date) < new Date().setHours(0,0,0,0) : false;
```
