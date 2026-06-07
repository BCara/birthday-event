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
        // Ignore imported guests until they actually submit an RSVP
        if (data.isImported && data.attending === 'pending') return;

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
        const isAttending = data.attending === true || data.attending === 'yes';
        const isMaybe = data.attending === 'maybe';
        const attendingText = isAttending ? "Yes, Attending" : (isMaybe ? "Maybe" : "No, Not Attending");
        
        // --- Send Email to Host ---
        const hostSubject = `New RSVP for ${eventData.name || 'your event'}`;
        const hostHtml = `
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
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">New RSVP Received</h1>
      </div>
      <div class="content">
        <h2>Hi ${escapeHtml(userName)},</h2>
        <p>A new RSVP has been submitted for <strong>${escapeHtml(eventData.name || 'your event')}</strong>.</p>
        
        <p><strong>Guest details:</strong><br/>
        Child Name: ${escapeHtml(childName)}<br/>
        Parent Name: ${escapeHtml(parentName)}<br/>
        Email: ${escapeHtml(data.email || 'Not provided')}<br/>
        Phone: ${escapeHtml(data.phone || 'Not provided')}<br/>
        Attending: <strong>${escapeHtml(attendingText)}</strong></p>

        <p>Log in to your dashboard to view the full guest list.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event <${FROM}>`, 
                    to: [userEmail], 
                    subject: hostSubject, 
                    html: hostHtml 
                })
            });
            logger.info("onRsvpCreated: Sent email to host for RSVP", event.params.rsvpId);
        } catch (e) {
            logger.error("onRsvpCreated: Resend host email threw", e);
        }

        // --- Send Email to Guest (if email provided) ---
        if (data.email) {
            const portalUrl = eventData.slug ? \`https://digiguestbook.com/\${eventData.slug}?rsvpId=\${event.params.rsvpId}\` : '';
            const guestSubject = \`RSVP Confirmation: \${eventData.name || 'Birthday Event'}\`;
            const guestHtml = \`
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
    .btn { display: inline-block; background: #10B981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">RSVP Confirmed</h1>
      </div>
      <div class="content">
        <h2>Hi ${escapeHtml(parentName)},</h2>
        <p>Thank you for RSVPing to <strong>${escapeHtml(eventData.name || 'the event')}</strong>.</p>
        <p>You have indicated that you are <strong>${escapeHtml(attendingText)}</strong>.</p>
        
        \${portalUrl ? \`<p>You can access the event portal anytime to check the schedule, location, and details by clicking the button below:</p>
        <p style="text-align: center;"><a href="\${portalUrl}" class="btn">View Event Portal</a></p>\` : ''}
      </div>
    </div>
  </div>
</body>
</html>\`;

            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { 
                        Authorization: `Bearer ${API_KEY}`, 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ 
                        from: `Birthday Event <${FROM}>`, 
                        to: [data.email], 
                        subject: guestSubject, 
                        html: guestHtml 
                    })
                });
                logger.info("onRsvpCreated: Sent email to guest", event.params.rsvpId);
            } catch (e) {
                logger.error("onRsvpCreated: Resend guest email threw", e);
            }
        }
    }
);

exports.contactOrganiser = functionsV1
    .runWith({ secrets: ["RESEND_API_KEY"] })
    .https.onCall(async (data, context) => {
        const { eventId, guestName, guestContact, message } = data;
        
        if (!eventId || !guestName || !guestContact || !message) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Missing required fields.');
        }

        const db = getFirestore();
        let eventData = null;
        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (eventDoc.exists) {
                eventData = eventDoc.data();
            }
        } catch (e) {
            logger.error("contactOrganiser: Error fetching event", e);
            throw new functionsV1.https.HttpsError('internal', 'Error fetching event.');
        }

        if (!eventData || !eventData.hostId) {
            throw new functionsV1.https.HttpsError('not-found', 'Event or host not found.');
        }

        let userEmail = "";
        let userName = "";
        try {
            const userRecord = await getAuth().getUser(eventData.hostId);
            userEmail = userRecord.email;
            userName = userRecord.displayName || "there";
        } catch (err) {
            logger.error("contactOrganiser: Error fetching host user", err);
            throw new functionsV1.https.HttpsError('internal', 'Error fetching host.');
        }

        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@digiguestbook.com";

        if (!API_KEY) {
            logger.error("contactOrganiser: RESEND_API_KEY not set");
            throw new functionsV1.https.HttpsError('internal', 'Email service not configured.');
        }

        const subject = `Message from Guest: ${guestName}`;
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
    .msg-box { background: #f1f5f9; padding: 15px; border-radius: 8px; font-style: italic; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">Guest Message</h1>
      </div>
      <div class="content">
        <h2>Hi ${escapeHtml(userName)},</h2>
        <p>A guest has reached out regarding <strong>${escapeHtml(eventData.name || 'your event')}</strong>.</p>
        
        <p><strong>Guest Name:</strong> ${escapeHtml(guestName)}<br/>
        <strong>Contact Info:</strong> ${escapeHtml(guestContact)}</p>

        <p><strong>Message:</strong></p>
        <div class="msg-box">
          ${escapeHtml(message).replace(/\\n/g, '<br/>')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${API_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    from: `Birthday Event <${FROM}>`, 
                    to: [userEmail], 
                    subject: subject, 
                    html: html,
                    reply_to: guestContact.includes('@') ? guestContact : undefined
                })
            });
            return { success: true };
        } catch (e) {
            logger.error("contactOrganiser: Resend threw", e);
            throw new functionsV1.https.HttpsError('internal', 'Failed to send email.');
        }
    });

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
