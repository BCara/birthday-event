const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const functionsV1 = require("firebase-functions/v1");
const { GoogleGenAI } = require("@google/genai");
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
        // Use the Tiny Party Portal email since the user requested to use their API key for now
        const FROM = "hello@tinypartyportal.com";

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
            const adminEmail = "codebertcreations@gmail.com";
            const adminSubject = `New Event Created: ${eventName}`;
            const adminHtml = `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>New Event Created!</h2>
                <p><strong>Host:</strong> ${escapeHtml(userName)} (${escapeHtml(userEmail)})</p>
                <p><strong>Event Name:</strong> ${escapeHtml(eventName)}</p>
                <p><strong>Child Name:</strong> ${escapeHtml(childName)}</p>
                <p><strong>Event Date:</strong> ${escapeHtml(eventDate)}</p>
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
        const FROM = "hello@tinypartyportal.com";

        if (!API_KEY) {
            logger.error("onRsvpCreated: RESEND_API_KEY not set");
            return;
        }

        const childName = data.childName || "A guest";
        const parentName = data.parentName || "Unknown parent";
        const needsApproval = data.attending === 'needs_approval';
        const isAttending = data.attending === true || data.attending === 'yes';
        const isMaybe = data.attending === 'maybe';
        const attendingText = needsApproval ? "Pending Approval" : isAttending ? "Yes, Attending" : (isMaybe ? "Maybe" : "No, Not Attending");

        const formatDate = (d) => {
            if (!d) return null;
            return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        };
        const formatTime = (t) => {
            if (!t) return null;
            const [h, m] = t.split(':');
            const hour = parseInt(h, 10);
            return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
        };

        // --- Send Email to Host ---
        const hostSubject = needsApproval
            ? `Action Required: RSVP Needs Approval for ${eventData.name || 'your event'}`
            : `New RSVP for ${eventData.name || 'your event'}`;
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
            const portalUrl = eventData.slug ? `https://tinypartyportal.com/${eventData.slug}` : '';
            const editUrl = portalUrl ? `${portalUrl}?rsvpId=${event.params.rsvpId}` : '';
            const guestSubject = needsApproval
                ? `RSVP Received — Awaiting Approval: ${eventData.name || 'Birthday Event'}`
                : `RSVP Confirmed: ${eventData.name || 'Birthday Event'}`;

            const eventDateStr = formatDate(eventData.date);
            const eventTimeStr = formatTime(eventData.time);
            const eventEndStr = formatTime(eventData.endTime);
            const timeStr = eventTimeStr ? `${eventTimeStr}${eventEndStr ? ` – ${eventEndStr}` : ''}` : null;
            const locationStr = [eventData.location, eventData.address].filter(Boolean).join(', ');

            const siblings = Array.isArray(data.siblings) ? data.siblings : [];
            const siblingsHtml = siblings.length > 0
                ? `<p style="margin: 4px 0;"><strong>Also coming:</strong> ${siblings.map(s => `${escapeHtml(s.name || '')}${s.age ? ` (${s.age}yo)` : ''}${s.dietary ? ` — ${escapeHtml(s.dietary)}` : ''}`).join(', ')}</p>`
                : '';

            const dietaryHtml = data.dietary
                ? `<p style="margin: 4px 0;"><strong>Dietary / allergies:</strong> ${escapeHtml(data.dietary)}</p>`
                : '';

            const adultsHtml = (data.adultsCount !== undefined && data.adultsCount !== null)
                ? `<p style="margin: 4px 0;"><strong>Adults attending:</strong> ${data.adultsCount}</p>`
                : '';

            const commentsHtml = data.comments
                ? `<p style="margin: 4px 0;"><strong>Your note:</strong> ${escapeHtml(data.comments)}</p>`
                : '';

            const statusBanner = needsApproval
                ? `<div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:15px;">⏳ <strong>Your RSVP is pending approval.</strong> The host will review and confirm your spot shortly.</div>`
                : isAttending
                ? `<div style="background:#D1FAE5;border:1px solid #6EE7B7;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:15px;">✅ <strong>You're confirmed — see you there!</strong></div>`
                : isMaybe
                ? `<div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:15px;">🤔 <strong>Thanks — we've marked you as a maybe.</strong> Just let us know if your plans firm up. We'd love to see you there!</div>`
                : `<div style="background:#F1F5F9;border:1px solid #CBD5E1;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:15px;">😢 <strong>Sorry you can't make it.</strong> Thanks for letting us know.</div>`;

            const guestHtml = `
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
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0; font-size: 15px; display: flex; flex-direction: column; gap: 6px; }
    .btn { display: inline-block; background: #10B981; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: bold; margin-top: 20px; font-size: 15px; }
    .footer { padding: 20px 40px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 22px; color: #0f172a;">🎉 ${escapeHtml(eventData.name || 'Birthday Party')}</h1>
      </div>
      <div class="content">
        <h2>Hi ${escapeHtml(parentName)},</h2>
        <p>Thanks for RSVPing! Here's a summary of what we received:</p>

        ${statusBanner}

        <div class="detail-box">
          ${eventDateStr ? `<p style="margin: 4px 0;">📅 <strong>${eventDateStr}</strong></p>` : ''}
          ${timeStr ? `<p style="margin: 4px 0;">🕛 ${timeStr}</p>` : ''}
          ${locationStr ? `<p style="margin: 4px 0;">📍 ${escapeHtml(locationStr)}</p>` : ''}
        </div>

        <div class="detail-box">
          <p style="margin: 4px 0;"><strong>Attending for:</strong> ${escapeHtml(childName)}${data.childAge ? ` (${data.childAge}yo)` : ''}</p>
          ${siblingsHtml}
          ${dietaryHtml}
          ${adultsHtml}
          ${commentsHtml}
        </div>

        ${editUrl && isAttending ? `<p>You can view the full event details — schedule, location, and more — anytime from the event portal:</p>
        <p style="text-align: center;"><a href="${editUrl}" class="btn">View Event Portal</a></p>` : ''}
      </div>
      <div class="footer">
        <p>Need to make changes? <a href="${editUrl}" style="color:#10B981;">View or edit your RSVP</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ from: `Tiny Party Portal <${FROM}>`, to: [data.email], subject: guestSubject, html: guestHtml })
                });
                logger.info("onRsvpCreated: Sent confirmation email to guest", event.params.rsvpId);
            } catch (e) {
                logger.error("onRsvpCreated: Guest email threw", e);
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
        if (typeof eventId !== 'string' || typeof guestName !== 'string'
            || typeof guestContact !== 'string' || typeof message !== 'string') {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Invalid field types.');
        }
        if (guestName.length > 100 || guestContact.length > 200 || message.length > 4000) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'One or more fields are too long.');
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
        const FROM = "hello@tinypartyportal.com";

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
          ${escapeHtml(message).replace(/\n/g, '<br/>')}
        </div>
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
                    html: html,
                    reply_to: guestContact.includes('@') ? guestContact : undefined
                })
            });
            if (!r.ok) {
                const bodyText = await r.text();
                logger.error("contactOrganiser: Resend failed", { status: r.status, body: bodyText });
                throw new functionsV1.https.HttpsError('internal', 'Failed to send email.');
            }
            return { success: true };
        } catch (e) {
            if (e instanceof functionsV1.https.HttpsError) throw e;
            logger.error("contactOrganiser: Resend threw", e);
            throw new functionsV1.https.HttpsError('internal', 'Failed to send email.');
        }
    });

exports.onUserCreated = functionsV1
    .runWith({ secrets: ["RESEND_API_KEY"] })
    .auth.user()
    .onCreate(async (user) => {
        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@tinypartyportal.com";
        const adminEmail = "codebertcreations@gmail.com";

        if (!API_KEY) {
            logger.error("onUserCreated: RESEND_API_KEY not set");
            return;
        }

        const subject = `New User Signup: ${user.email}`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New User Signup!</h2>
            <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
            <p><strong>Name:</strong> ${escapeHtml(user.displayName || 'Not provided')}</p>
            <p><strong>UID:</strong> ${escapeHtml(user.uid)}</p>
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

        // Welcome email to the new user
        if (user.email) {
            const welcomeSubject = `Welcome to Tiny Party Portal! 🎉`;
            const displayName = escapeHtml(user.displayName || 'there');
            const welcomeHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Tiny Party Portal</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Quicksand:wght@400;500;700&display=swap');
  body { margin:0; padding:0; background:#FFF9F2; }
  a { text-decoration:none; }
  @media (max-width:620px){
    .container{ width:100% !important; border-radius:0 !important; }
    .pad{ padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#FFF9F2;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">Your party-planning HQ is ready — create your first invite in minutes.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F2;">
    <tr>
      <td align="center" style="padding:28px 12px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:#FFFFFF; border-radius:20px; overflow:hidden; border:1px solid #F0E6DA;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#FF6B6B; background-image:linear-gradient(135deg,#FF6B6B 0%,#FFD166 100%); padding:40px 24px;">
              <div style="font-family:Merriweather,Georgia,serif; font-size:30px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">
                🎂 Tiny Party <span style="font-weight:400;">Portal</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="pad" style="padding:40px 48px 8px;">
              <h1 style="margin:0 0 10px; font-family:Merriweather,Georgia,serif; font-size:26px; line-height:1.25; color:#2D3748;">Welcome, ${displayName}! 🎉</h1>
              <p style="margin:0; font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif; font-size:16px; line-height:1.7; color:#5A6473;">
                You're all set to plan something brilliant. Here's everything Tiny Party Portal does for you:
              </p>
            </td>
          </tr>

          <!-- Feature rows -->
          <tr>
            <td class="pad" style="padding:24px 48px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <!-- item -->
                <tr><td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="top" width="52">
                      <div style="width:40px; height:40px; line-height:40px; text-align:center; font-size:20px; background:#FFE3E3; border-radius:12px;">🎨</div>
                    </td>
                    <td valign="top" style="font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif;">
                      <div style="font-size:15px; font-weight:700; color:#2D3748;">Create your event page</div>
                      <div style="font-size:14px; line-height:1.6; color:#6B7280;">Pick a theme, add the details, and get a shareable invite link in minutes.</div>
                    </td>
                  </tr></table>
                </td></tr>
                <!-- item -->
                <tr><td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="top" width="52">
                      <div style="width:40px; height:40px; line-height:40px; text-align:center; font-size:20px; background:#FFF3D6; border-radius:12px;">📩</div>
                    </td>
                    <td valign="top" style="font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif;">
                      <div style="font-size:15px; font-weight:700; color:#2D3748;">Share with guests</div>
                      <div style="font-size:14px; line-height:1.6; color:#6B7280;">Send your link by WhatsApp, message or email. No app needed for guests.</div>
                    </td>
                  </tr></table>
                </td></tr>
                <!-- item -->
                <tr><td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="top" width="52">
                      <div style="width:40px; height:40px; line-height:40px; text-align:center; font-size:20px; background:#D7F8EE; border-radius:12px;">👥</div>
                    </td>
                    <td valign="top" style="font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif;">
                      <div style="font-size:15px; font-weight:700; color:#2D3748;">Track RSVPs in real time</div>
                      <div style="font-size:14px; line-height:1.6; color:#6B7280;">See who's coming, dietary needs and sibling counts as replies arrive.</div>
                    </td>
                  </tr></table>
                </td></tr>
                <!-- item -->
                <tr><td style="padding:10px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td valign="top" width="52">
                      <div style="width:40px; height:40px; line-height:40px; text-align:center; font-size:20px; background:#EDE6FF; border-radius:12px;">📸</div>
                    </td>
                    <td valign="top" style="font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif;">
                      <div style="font-size:15px; font-weight:700; color:#2D3748;">Collect memories</div>
                      <div style="font-size:14px; line-height:1.6; color:#6B7280;">Guests upload photos and messages you can display live at the party.</div>
                    </td>
                  </tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA (bulletproof) -->
          <tr>
            <td align="center" style="padding:24px 48px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td align="center" bgcolor="#FF6B6B" style="border-radius:999px;">
                  <a href="https://tinypartyportal.com/dashboard" style="display:inline-block; padding:15px 34px; font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif; font-size:16px; font-weight:700; color:#ffffff; border-radius:999px;">Create your first party →</a>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px; background:#FCF6EF; border-top:1px solid #F0E6DA;">
              <p style="margin:0; font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif; font-size:13px; line-height:1.6; color:#9AA1AC;">
                Questions? Just reply to this email or reach us at
                <a href="mailto:support@tinypartyportal.com" style="color:#FF6B6B; font-weight:600;">support@tinypartyportal.com</a>.
              </p>
              <p style="margin:10px 0 0; font-family:Quicksand,'Trebuchet MS','Segoe UI',sans-serif; font-size:12px; color:#C2B8AC;">
                🎂 Tiny Party Portal · Making little celebrations effortless
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ from: `Tiny Party Portal <${FROM}>`, to: [user.email], subject: welcomeSubject, html: welcomeHtml })
                });
                logger.info("onUserCreated: Sent welcome email to new user", user.uid);
            } catch (e) {
                logger.error("onUserCreated: Welcome email threw", e);
            }
        }
    });

exports.parseRsvpMessage = functionsV1
    .runWith({ secrets: ["GEMINI_API_KEY"] })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functionsV1.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const { text } = data;
        if (!text) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Missing message text.');
        }
        if (typeof text !== 'string' || text.length > 2000) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Message must be under 2000 characters.');
        }

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            logger.error("parseRsvpMessage: GEMINI_API_KEY not set");
            throw new functionsV1.https.HttpsError('internal', 'AI service not configured.');
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `You are a helpful assistant that parses forwarded RSVP messages for a child's birthday party.
Extract the following information into a JSON object. Ensure the output is strictly valid JSON:
- childName (string, primary child's name, or null if not mentioned)
- parentName (string, parent's name, or null if not mentioned)
- attending (boolean, true if they say they are coming/yes, false if they decline/no, null if maybe or unclear)
- dietary (string, any allergies or dietary notes, or null)
- adultsCount (number, how many adults are attending. If not explicitly specified but context implies 1, set to 1. If unclear, set to null)
- siblings (array of objects with 'name' (string) and 'age' (number, optional), or empty array if none mentioned)

Here is the message to parse:
"""
${text}
"""
`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });
            const raw = response.text;
            if (!raw) {
                logger.warn("parseRsvpMessage: empty/filtered response from Gemini");
                throw new functionsV1.https.HttpsError('internal', 'AI returned no result. Try rephrasing the message.');
            }
            const result = JSON.parse(raw);
            return result;
        } catch (e) {
            logger.error("parseRsvpMessage error:", e);
            throw new functionsV1.https.HttpsError('internal', 'Failed to parse message.');
        }
    });

exports.eventShareMeta = functionsV1.https.onRequest(async (req, res) => {
    const pathParts = req.path.split('/');
    // e.g. /share/slug -> ["", "share", "slug"]
    const slug = pathParts[2];
    
    if (!slug) {
        return res.status(404).send('Not found');
    }

    try {
        const db = getFirestore();
        const snapshot = await db.collection('events').where('slug', '==', slug).limit(1).get();
        
        if (snapshot.empty) {
            return res.status(404).send('Event not found');
        }

        const eventData = snapshot.docs[0].data();
        const childName = eventData.childName ? eventData.childName.trim() : "";
        const title = childName ? `${childName}'s ${eventData.name || 'Birthday'}` : (eventData.name || "You're Invited!");
        const description = eventData.description || `Join us to celebrate ${childName || 'the birthday star'}'s special day!`;
        
        let imageUrl = eventData.invitePreviewUrl || eventData.photoUrl;
        if (!imageUrl) {
            let themeName = (eventData.theme || 'generic').replace('kids-', '');
            if (themeName === 'generic') themeName = 'classic';
            
            const color = eventData.themeColor || 'default';
            let colorName = 'blue';
            
            if (themeName === 'dino') {
                if (color === 'default') colorName = 'pink';
                else if (color === 'green') colorName = 'green';
                else if (color === 'blue') colorName = 'blue';
                else if (color === 'orange') colorName = 'orange';
            } else if (themeName === 'princess') {
                if (color === 'default') colorName = 'pink';
                else if (color === 'teal') colorName = 'teal';
                else if (color === 'yellow') colorName = 'yellow';
                else if (color === 'purple') colorName = 'purple';
            } else if (themeName === 'unicorn') {
                if (color === 'default') colorName = 'pink';
                else if (color === 'purple') colorName = 'purple';
                else if (color === 'teal') colorName = 'teal';
                else if (color === 'yellow') colorName = 'yellow';
            } else if (themeName === 'cars') {
                if (color === 'default') colorName = 'red';
                else if (color === 'blue') colorName = 'blue';
                else if (color === 'yellow') colorName = 'yellow';
                else if (color === 'grey') colorName = 'grey';
            } else {
                if (color === 'default') colorName = 'red';
                else if (color === 'blue') colorName = 'blue';
                else if (color === 'green') colorName = 'green';
                else if (color === 'purple') colorName = 'purple';
            }
            
            imageUrl = `https://tinypartyportal.com/images/themes/${themeName}_${colorName}.png`;
        }

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:url" content="https://tinypartyportal.com/share/${escapeHtml(slug)}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    
    <script>
        // Redirect to the actual event page
        window.location.replace("/${escapeHtml(slug)}");
    </script>
</head>
<body>
    <p>Redirecting to invitation...</p>
</body>
</html>
        `;
        
        res.status(200).send(html);
    } catch (e) {
        logger.error("eventShareMeta error:", e);
        res.status(500).send('Internal Server Error');
    }
});

exports.onRsvpApproved = onDocumentUpdated(
    {
        document: "rsvps/{rsvpId}",
        secrets: ["RESEND_API_KEY"]
    },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();

        // Only fire when transitioning from needs_approval to attending
        if (before.attending !== 'needs_approval') return;
        if (after.attending !== true && after.attending !== 'yes') return;

        // Only send if guest provided an email
        if (!after.email) return;

        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@tinypartyportal.com";
        if (!API_KEY) {
            logger.error("onRsvpApproved: RESEND_API_KEY not set");
            return;
        }

        const db = getFirestore();
        let eventData = null;
        try {
            const eventDoc = await db.collection('events').doc(after.eventId).get();
            if (eventDoc.exists) eventData = eventDoc.data();
        } catch (e) {
            logger.error("onRsvpApproved: Error fetching event", e);
            return;
        }

        if (!eventData) return;

        const parentName = escapeHtml(after.parentName || 'there');
        const childName = escapeHtml(after.childName || 'your child');
        const eventName = escapeHtml(eventData.name || 'the party');
        const portalUrl = eventData.slug ? `https://tinypartyportal.com/${eventData.slug}` : '';

        const formatDate = (d) => {
            if (!d) return null;
            return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        };
        const formatTime = (t) => {
            if (!t) return null;
            const [h, m] = t.split(':');
            const hour = parseInt(h, 10);
            return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
        };

        const eventDateStr = formatDate(eventData.date);
        const eventTimeStr = formatTime(eventData.time);
        const eventEndStr = formatTime(eventData.endTime);
        const timeStr = eventTimeStr ? `${eventTimeStr}${eventEndStr ? ` – ${eventEndStr}` : ''}` : null;
        const locationStr = [eventData.location, eventData.address].filter(Boolean).join(', ');

        const subject = `You're confirmed for ${eventName}! 🎉`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { width: 100%; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #10B981, #6EE7B7); padding: 28px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; color: #fff; }
    .content { padding: 40px; line-height: 1.7; }
    .content h2 { color: #0f172a; margin-top: 0; }
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0; font-size: 15px; }
    .btn { display: inline-block; background: #10B981; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: bold; margin-top: 20px; font-size: 15px; }
    .footer { padding: 20px 40px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>✅ You're In!</h1>
      </div>
      <div class="content">
        <h2>Great news, ${parentName}!</h2>
        <p>Your RSVP for <strong>${childName}</strong> has been approved for <strong>${eventName}</strong>. We can't wait to see you there!</p>

        <div class="detail-box">
          ${eventDateStr ? `<p style="margin: 4px 0;">📅 <strong>${eventDateStr}</strong></p>` : ''}
          ${timeStr ? `<p style="margin: 4px 0;">🕛 ${timeStr}</p>` : ''}
          ${locationStr ? `<p style="margin: 4px 0;">📍 ${escapeHtml(locationStr)}</p>` : ''}
        </div>

        ${portalUrl ? `<p>View the full event details — schedule, location, and more:</p>
        <p style="text-align: center;"><a href="${portalUrl}" class="btn">View Event Portal</a></p>` : ''}
      </div>
      <div class="footer">
        <p>Questions? Contact the event host directly via the event page.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: `Tiny Party Portal <${FROM}>`, to: [after.email], subject, html })
            });
            logger.info("onRsvpApproved: Sent approval email", event.params.rsvpId);
        } catch (e) {
            logger.error("onRsvpApproved: Resend threw", e);
        }
    }
);

exports.onRsvpDeclined = onDocumentUpdated(
    {
        document: "rsvps/{rsvpId}",
        secrets: ["RESEND_API_KEY"]
    },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();

        // Only fire when a host declines a guest who was awaiting approval
        // (needs_approval -> not attending). Normal RSVPs never pass through here.
        if (before.attending !== 'needs_approval') return;
        if (after.attending !== false && after.attending !== 'no') return;

        // Only send if the guest provided an email
        if (!after.email) return;

        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@tinypartyportal.com";
        if (!API_KEY) {
            logger.error("onRsvpDeclined: RESEND_API_KEY not set");
            return;
        }

        const db = getFirestore();
        let eventData = null;
        try {
            const eventDoc = await db.collection('events').doc(after.eventId).get();
            if (eventDoc.exists) eventData = eventDoc.data();
        } catch (e) {
            logger.error("onRsvpDeclined: Error fetching event", e);
            return;
        }

        if (!eventData) return;

        const parentName = escapeHtml(after.parentName || 'there');
        const childName = escapeHtml(after.childName || 'your little one');
        const eventName = escapeHtml(eventData.name || 'the party');
        const hostName = escapeHtml(eventData.hostName || 'the host');

        const subject = `Update on your RSVP for ${eventName}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { width: 100%; padding: 20px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #F59E0B, #FCD34D); padding: 28px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; }
    .content { padding: 40px; line-height: 1.7; }
    .content h2 { color: #0f172a; margin-top: 0; }
    .footer { padding: 20px 40px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>💛 A quick update on your RSVP</h1>
      </div>
      <div class="content">
        <h2>Hi ${parentName},</h2>
        <p>Thank you so much for wanting to celebrate <strong>${eventName}</strong> with us — it really means a lot.</p>
        <p>Unfortunately, we're unable to confirm a spot for <strong>${childName}</strong> at this time, as the party has reached capacity. We're genuinely sorry to miss you on the day.</p>
        <p>If you think this is a mistake or you'd like to chat about it, please reach out to ${hostName} directly — we'd love to hear from you.</p>
        <p>Warm wishes,<br/>${hostName}</p>
      </div>
      <div class="footer">
        <p>Sent via Tiny Party Portal on behalf of the event host.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: `Tiny Party Portal <${FROM}>`, to: [after.email], subject, html })
            });
            logger.info("onRsvpDeclined: Sent decline email", event.params.rsvpId);
        } catch (e) {
            logger.error("onRsvpDeclined: Resend threw", e);
        }
    }
);

exports.submitGlobalContactForm = functionsV1
    .runWith({ secrets: ["RESEND_API_KEY"] })
    .https.onCall(async (data, context) => {
        const { name, email, message } = data;

        if (!name || !email || !message) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Missing required fields.');
        }
        if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Invalid field types.');
        }
        if (name.length > 100 || email.length > 200 || message.length > 4000) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'One or more fields are too long.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Invalid email address.');
        }

        const API_KEY = process.env.RESEND_API_KEY;
        const FROM = "hello@tinypartyportal.com";
        // Send to codebertcreations and info@tinypartyportal.com
        const TO = ["codebertcreations@gmail.com", "info@tinypartyportal.com"];

        if (!API_KEY) {
            logger.error("submitGlobalContactForm: RESEND_API_KEY not set");
            throw new functionsV1.https.HttpsError('internal', 'Email service not configured.');
        }

        const subject = `New Contact Form Submission from ${name}`;
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
    .msg-box { background: #f1f5f9; padding: 15px; border-radius: 8px; font-style: italic; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 style="margin:0; font-size: 24px; color: #0f172a;">New Inquiry</h1>
      </div>
      <div class="content">
        <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
        <strong>Email:</strong> ${escapeHtml(email)}</p>

        <p><strong>Message:</strong></p>
        <div class="msg-box">
          ${escapeHtml(message).replace(/\n/g, '<br/>')}
        </div>
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
                    from: `Tiny Party Portal <${FROM}>`,
                    to: TO,
                    subject: subject,
                    html: html,
                    reply_to: email
                })
            });
            if (!r.ok) {
                const bodyText = await r.text();
                logger.error("submitGlobalContactForm: Resend failed", { status: r.status, body: bodyText });
                throw new functionsV1.https.HttpsError('internal', 'Failed to send email.');
            }
            return { success: true };
        } catch (e) {
            if (e instanceof functionsV1.https.HttpsError) throw e;
            logger.error("submitGlobalContactForm: Resend threw", e);
            throw new functionsV1.https.HttpsError('internal', 'Failed to send email.');
        }
    });

// Server-side RSVP lookup. Replaces the old client-side "download every RSVP and
// filter" approach (which exposed the whole guest list). A caller must supply the
// child's name AND a matching email/phone before any RSVP data is returned, so the
// guest list can no longer be enumerated.
const normaliseContact = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

exports.lookupRsvp = functionsV1.https.onCall(async (data, context) => {
    const { eventId, childName, contact } = data || {};

    if (typeof eventId !== 'string' || typeof childName !== 'string' || typeof contact !== 'string') {
        throw new functionsV1.https.HttpsError('invalid-argument', 'eventId, childName and contact are required.');
    }
    if (!eventId || !childName.trim() || !contact.trim()) {
        throw new functionsV1.https.HttpsError('invalid-argument', 'eventId, childName and contact are required.');
    }
    if (childName.length > 200 || contact.length > 320) {
        throw new functionsV1.https.HttpsError('invalid-argument', 'Input too long.');
    }

    const db = getFirestore();

    // Event must exist and be published.
    let published = false;
    try {
        const eventDoc = await db.collection('events').doc(eventId).get();
        published = eventDoc.exists && eventDoc.data().published === true;
    } catch (e) {
        logger.error('lookupRsvp: error fetching event', e);
        throw new functionsV1.https.HttpsError('internal', 'Lookup failed.');
    }
    if (!published) {
        throw new functionsV1.https.HttpsError('not-found', 'Event not found.');
    }

    const childClean = childName.trim().toLowerCase();
    const contactClean = normaliseContact(contact);

    let match = null;
    try {
        const snap = await db.collection('rsvps').where('eventId', '==', eventId).get();
        snap.forEach((docSnap) => {
            if (match) return;
            const d = docSnap.data();
            const storedChild = (d.childName || '').trim().toLowerCase();
            const storedEmail = normaliseContact(d.email);
            const storedPhone = normaliseContact(d.phone);
            if (storedChild === childClean && (storedEmail === contactClean || storedPhone === contactClean)) {
                match = { id: docSnap.id, data: d };
            }
        });
    } catch (e) {
        logger.error('lookupRsvp: error querying rsvps', e);
        throw new functionsV1.https.HttpsError('internal', 'Lookup failed.');
    }

    if (!match) {
        return { found: false };
    }

    const d = match.data;
    // Return only the fields the RSVP form needs to prefill. The caller has proven
    // knowledge of this guest's child name + contact, so returning their own RSVP is safe.
    return {
        found: true,
        rsvp: {
            id: match.id,
            // Only genuinely-confirmed guests are "attending". Imported ('pending'),
            // needs_approval, maybe and declined RSVPs must NOT show "YOU'RE GOING!".
            isAttending: d.attending === true || d.attending === 'yes',
            // Raw status so the client can distinguish pending/needs_approval/maybe/declined.
            attending: d.attending ?? null,
            parentName: d.parentName ?? '',
            email: d.email ?? '',
            phone: d.phone ?? '',
            childName: d.childName ?? '',
            childAge: d.childAge ?? '',
            adultsCount: d.adultsCount ?? 1,
            siblings: Array.isArray(d.siblings) ? d.siblings : [],
            dietary: d.dietary ?? '',
            comments: d.comments ?? '',
        },
    };
});

// Maintain a public memoryCount on the event doc so the day-of display can show a
// live "N memories shared!" count. Memories themselves are host-only/private, so the
// public display can't count them directly — this counter on the (public) event doc
// is the only thing it reads.
exports.onMemoryCreated = onDocumentCreated("memories/{memoryId}", async (event) => {
    const snap = event.data;
    if (!snap) return;
    const eventId = snap.data().eventId;
    if (!eventId) return;
    try {
        await getFirestore().doc(`events/${eventId}`).update({
            memoryCount: FieldValue.increment(1),
        });
    } catch (e) {
        logger.error("onMemoryCreated: failed to increment memoryCount", e);
    }
});

exports.onMemoryDeleted = onDocumentDeleted("memories/{memoryId}", async (event) => {
    const snap = event.data;
    if (!snap) return;
    const eventId = snap.data().eventId;
    if (!eventId) return;
    try {
        await getFirestore().doc(`events/${eventId}`).update({
            memoryCount: FieldValue.increment(-1),
        });
    } catch (e) {
        logger.error("onMemoryDeleted: failed to decrement memoryCount", e);
    }
});
