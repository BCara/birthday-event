// src/utils/calendarUtils.js
// Generates .ics files and Google Calendar URLs with links back to the event page.

export function generateICS({ title, date, time, endTime, location, description, url }) {
  if (!title || !date) return null;
  const dateParts = date.split('-').join('');
  let dtStart, dtEnd;
  if (time) {
    dtStart = `${dateParts}T${time.replace(':', '')}00`;
    if (endTime) {
      dtEnd = `${dateParts}T${endTime.replace(':', '')}00`;
    } else {
      const h = parseInt(time.split(':')[0], 10);
      const m = time.split(':')[1] || '00';
      dtEnd = `${dateParts}T${String(Math.min(h + 3, 23)).padStart(2, '0')}${m}00`;
    }
  } else {
    dtStart = dateParts;
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    dtEnd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
  let fullDesc = description || '';
  if (url) { if (fullDesc) fullDesc += '\\n\\n'; fullDesc += `View event details: ${url}`; }
  const esc = s => (s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@kidsbash.app`;
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KidsBash//Birthday RSVP//EN',
    'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    `UID:${uid}`,`DTSTAMP:${stamp}`,
    ...(time ? [`DTSTART:${dtStart}`,`DTEND:${dtEnd}`] : [`DTSTART;VALUE=DATE:${dtStart}`,`DTEND;VALUE=DATE:${dtEnd}`]),
    `SUMMARY:${esc(title)}`,
    ...(fullDesc ? [`DESCRIPTION:${esc(fullDesc)}`] : []),
    ...(location ? [`LOCATION:${esc(location)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY',`DESCRIPTION:Reminder: ${esc(title)} is tomorrow!`,'END:VALARM',
    ...(time ? ['BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY',`DESCRIPTION:${esc(title)} starts in 1 hour!`,'END:VALARM'] : []),
    'END:VEVENT','END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadICS(icsContent, filename = 'event.ics') {
  if (!icsContent) return;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl({ title, date, time, endTime, location, description, url }) {
  const d = date.split('-').join('');
  let dates;
  if (time) {
    const s = `${d}T${time.replace(':', '')}00`;
    const h = parseInt(time.split(':')[0], 10);
    const e = endTime ? `${d}T${endTime.replace(':', '')}00` : `${d}T${String(Math.min(h+3,23)).padStart(2,'0')}${time.split(':')[1]||'00'}00`;
    dates = `${s}/${e}`;
  } else {
    dates = `${d}/${d}`;
  }
  let desc = description || '';
  if (url) { if (desc) desc += '\n\n'; desc += `View event: ${url}`; }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates, ...(location && { location }), ...(desc && { details: desc }) });
  return `https://calendar.google.com/calendar/render?${params}`;
}
