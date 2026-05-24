const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const functionsV1 = require("firebase-functions/v1");

initializeApp();

function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
}

exports.onEventCreated = onDocumentCreated(
    { 
        document: "events/{eventId}",
        secrets: ["RESEND_API_KEY"]
    },
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        const eventName = data.name || "Untitled Party";
        const childName = data.childName || "Your child";
        const eventDate = data.date || "TBD";
        const hostId = data.hostId;

        if (!hostId) {
            logger.warn("onEventCreated: No hostId found for event", event.params.eventId);
            return;
        }

        let userEmail = "";
        let userName = "";
        try {
            const userRecord = await getAuth().getUser(hostId);
            userEmail = userRecord.email;
            userName = userRecord.displayName || "there";
        } catch (err) {
            logger.error("onEventCreated: Error fetching user", err);
            return;
        }

        if (!userEmail) return;

        const API_KEY = process.env.RESEND_API_KEY;
        // Use the DigiGuestbook email since the user requested to use their API key for now
        const FROM = "hello@digiguestbook.com";

        if (!API_KEY) {
            logger.error("onEventCreated: RESEND_API_KEY not set");
            return;
        }

        const subject = "Your Birthday Event is Ready! 🎉";
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { width: 100%; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #ffffff; padding: 25px 20px 20px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .content { padding: 40px; line-height: 1.6; }
    .content h2 { color: #0f172a; margin-top: 0; }
    .guide { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin: 25px 0; }
    .guide h3 { margin-top: 0; color: #166534; font-size: 16px; }
    .event-details { list-style: none; padding: 0; margin: 15px 0; }
    .event-details li { margin-bottom: 10px; font-size: 15px; }
    .event-details strong { color: #0f172a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">🎉 Birthday Event</h1>
      </div>
      <div class="content">
        <h2>Your Party is Ready, ${escapeHtml(userName)}! 🎈</h2>
        <p>Congratulations! You have successfully created <strong>${escapeHtml(eventName)}</strong> for ${escapeHtml(childName)}.</p>
        
        <div class="guide">
          <h3>Event Details</h3>
          <ul class="event-details">
            <li><strong>Event Name:</strong> ${escapeHtml(eventName)}</li>
            <li><strong>Event Date:</strong> ${escapeHtml(eventDate)}</li>
          </ul>
        </div>

        <p>You can manage your guest list, theme colors, and RSVP options directly from your dashboard.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event <${FROM}>`, 
                    to: [userEmail], 
                    subject: subject, 
                    html: html 
                })
            });

            if (!r.ok) {
                const bodyText = await r.text();
                logger.error("onEventCreated: Resend failed", { status: r.status, body: bodyText });
            } else {
                logger.info("onEventCreated: Sent email for event", event.params.eventId);
            }
            
            // Send notification to admin for logging purposes
            const adminEmail = "hello@digiguestbook.com";
            const adminSubject = `New Event Created: ${eventName}`;
            const adminHtml = `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>New Event Created!</h2>
                <p><strong>Host:</strong> ${userName} (${userEmail})</p>
                <p><strong>Event Name:</strong> ${eventName}</p>
                <p><strong>Child Name:</strong> ${childName}</p>
                <p><strong>Event Date:</strong> ${eventDate}</p>
              </div>
            `;
            
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event Logs <${FROM}>`, 
                    to: [adminEmail], 
                    subject: adminSubject, 
                    html: adminHtml 
                })
            });
            logger.info("onEventCreated: Sent admin notification for event", event.params.eventId);

        } catch (e) {
            logger.error("onEventCreated: Resend threw", e);
        }
    }
);

exports.onRsvpCreated = onDocumentCreated(
    { 
        document: "rsvps/{rsvpId}",
        secrets: ["RESEND_API_KEY"]
    },
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        if (data.attending !== 'needs_approval') return;

        const eventId = data.eventId;
        if (!eventId) return;

        const db = getFirestore();
        let eventData = null;
        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (eventDoc.exists) {
                eventData = eventDoc.data();
            }
        } catch (e) {
            logger.error("onRsvpCreated: Error fetching event", e);
            return;
        }

        if (!eventData || !eventData.hostId) return;

        let userEmail = "";
        let userName = "";
        try {
            const userRecord = await getAuth().getUser(eventData.hostId);
            userEmail = userRecord.email;
            userName = userRecord.displayName || "there";
        } catch (err) {
            logger.error("onRsvpCreated: Error fetching host user", err);
            return;
        }

        if (!userEmail) return;

        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@digiguestbook.com";

        if (!API_KEY) {
            logger.error("onRsvpCreated: RESEND_API_KEY not set");
            return;
        }

        const childName = data.childName || "A guest";
        const parentName = data.parentName || "Unknown parent";
        
        const subject = "RSVP Requires Your Approval";
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { width: 100%; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #ffffff; padding: 25px 20px 20px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .content { padding: 40px; line-height: 1.6; }
    .content h2 { color: #0f172a; margin-top: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">RSVP Requires Approval</h1>
      </div>
      <div class="content">
        <h2>Hi ${escapeHtml(userName)},</h2>
        <p>A new guest has RSVP'd to <strong>${escapeHtml(eventData.name || 'your event')}</strong>, but they are not on your guest list.</p>
        
        <p><strong>Guest details:</strong><br/>
        Child Name: ${escapeHtml(childName)}<br/>
        Parent Name: ${escapeHtml(parentName)}<br/>
        Email: ${escapeHtml(data.email || 'Not provided')}<br/>
        Phone: ${escapeHtml(data.phone || 'Not provided')}</p>

        <p>Please log in to your dashboard to review and approve or decline this request.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event <${FROM}>`, 
                    to: [userEmail], 
                    subject: subject, 
                    html: html 
                })
            });

            if (!r.ok) {
                const bodyText = await r.text();
                logger.error("onRsvpCreated: Resend failed", { status: r.status, body: bodyText });
            } else {
                logger.info("onRsvpCreated: Sent email to host for RSVP", event.params.rsvpId);
            }
        } catch (e) {
            logger.error("onRsvpCreated: Resend threw", e);
        }
    }
);

exports.onUserCreated = functionsV1
    .runWith({ secrets: ["RESEND_API_KEY"] })
    .auth.user()
    .onCreate(async (user) => {
        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@digiguestbook.com";
        const adminEmail = "hello@digiguestbook.com";

        if (!API_KEY) {
            logger.error("onUserCreated: RESEND_API_KEY not set");
            return;
        }

        const subject = `New User Signup: ${user.email}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New User Signup!</h2>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Name:</strong> ${user.displayName || 'Not provided'}</p>
            <p><strong>UID:</strong> ${user.uid}</p>
          </div>
        `;

        try {
            const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event Logs <${FROM}>`, 
                    to: [adminEmail], 
                    subject: subject, 
                    html: html 
                })
            });

            if (!r.ok) {
                const bodyText = await r.text();
                logger.error("onUserCreated: Resend failed", { status: r.status, body: bodyText });
            } else {
                logger.info("onUserCreated: Sent admin notification for new user", user.uid);
            }
        } catch (e) {
            logger.error("onUserCreated: Resend threw", e);
        }
    });
