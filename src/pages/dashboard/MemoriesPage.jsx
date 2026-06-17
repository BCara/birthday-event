import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, getDoc, deleteDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getDevSafeOrigin } from '../../utils/url';

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function downloadFile(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

function MemoryCard({ memory, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const mediaUrl = memory.mediaUrl || memory.photoUrl;

  async function handleDelete() {
    if (!window.confirm('Remove this memory? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(memory.id);
      toast.success('Memory removed.');
    } catch {
      toast.error('Failed to remove.');
      setDeleting(false);
    }
  }

  return (
    <div style={cardStyles.card}>
      {mediaUrl && (
        memory.mediaType === 'video' ? (
          <video src={mediaUrl} controls style={cardStyles.media} />
        ) : (
          <img src={mediaUrl} alt="Memory" style={cardStyles.media} loading="lazy" />
        )
      )}
      {memory.message && <p style={cardStyles.message}>{memory.message}</p>}
      <div style={cardStyles.footer}>
        <span style={cardStyles.author}>— {memory.authorName || 'Anonymous'}</span>
        <span style={cardStyles.time}>{timeAgo(memory.createdAt)}</span>
      </div>
      <div style={cardStyles.actions}>
        {mediaUrl && (
          <button
            onClick={() => downloadFile(
              mediaUrl,
              `memory_${(memory.authorName || 'guest').replace(/\s+/g, '_')}.${memory.mediaType === 'video' ? 'mp4' : 'jpg'}`
            )}
            className="kb-btn"
            style={cardStyles.downloadBtn}
          >
            ⬇ Save
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting} className="kb-btn" style={cardStyles.deleteBtn}>
          {deleting ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}

export default function MemoriesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'events', eventId))
      .then(snap => { if (snap.exists()) setEvent({ id: snap.id, ...snap.data() }); })
      .catch(console.error);
  }, [eventId]);

  useEffect(() => {
    const q = query(
      collection(db, 'memories'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      toast.error('Failed to load capsule.');
      setLoading(false);
    });
    return unsub;
  }, [eventId]);

  async function handleDelete(memoryId) {
    await deleteDoc(doc(db, 'memories', memoryId));
  }

  function handleExport() {
    const lines = memories.map(m => {
      const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('en-AU') : '';
      return [
        `From: ${m.authorName || 'Anonymous'}`,
        `Date: ${date}`,
        `Message: ${m.message || '(no message)'}`,
        m.mediaUrl || m.photoUrl ? `Media: ${m.mediaUrl || m.photoUrl}` : null,
      ].filter(Boolean).join('\n');
    });
    const childLabel = event?.childName ? `${event.childName}'s ` : '';
    const header = `Memory Capsule — ${childLabel}${event?.name || ''}\nExported ${new Date().toLocaleDateString('en-AU')}\n${'─'.repeat(44)}`;
    const blob = new Blob([[header, ...lines].join('\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(event?.name || 'capsule').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_memories.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const submissionUrl = event?.slug ? `${getDevSafeOrigin()}/${event.slug}/memories/new` : null;
  const qrUrl = submissionUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(submissionUrl)}&bgcolor=ffffff&color=2d1b69&margin=12`
    : null;
  const capsuleTitle = event?.memoriesTitle
    || (event?.childName ? `${event.childName}'s Memory Capsule` : event?.name || 'Memory Capsule');

  return (
    <div style={styles.root}>
      <div style={styles.inner}>

        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(`/dashboard/event/${eventId}`)} className="kb-btn kb-btn-secondary">← Back</button>
          <div>
            <h1 style={styles.heading}>📸 Memory Capsule</h1>
            {event && <p style={styles.subheading}>{capsuleTitle}</p>}
          </div>
          <div style={styles.headerActions}>
            <span style={styles.statBadge}>
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
            </span>
            {memories.length > 0 && (
              <button onClick={handleExport} className="kb-btn kb-btn-secondary kb-btn-sm">
                📄 Export
              </button>
            )}
          </div>
        </div>

        {/* Submission link + QR */}
        {submissionUrl && (
          <div style={styles.qrPanel}>
            <img src={qrUrl} alt="Capsule QR Code" style={styles.qrImg} />
            <div style={styles.qrInfo}>
              <p style={styles.qrLabel}>Share this link or display the QR code on the day</p>
              <div style={styles.qrLinkRow}>
                <code style={styles.qrLink}>{submissionUrl.replace(/^https?:\/\//, '')}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(submissionUrl); toast.success('Copied!'); }}
                  className="kb-btn kb-btn-secondary kb-btn-sm"
                >
                  Copy
                </button>
              </div>
              {event?.memoriesMessage && (
                <p style={styles.qrMessage}>"{event.memoriesMessage}"</p>
              )}
              {(event?.memoriesOpenDate || event?.memoriesCloseDate) && (
                <p style={styles.qrDates}>
                  {event.memoriesOpenDate && `Opens ${new Date(event.memoriesOpenDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
                  {event.memoriesOpenDate && event.memoriesCloseDate && ' · '}
                  {event.memoriesCloseDate && `Closes ${new Date(event.memoriesCloseDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={styles.center}><div style={styles.spinner} /></div>
        ) : memories.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 56 }}>✨</span>
            <h2 style={styles.emptyTitle}>The capsule is empty</h2>
            <p style={styles.emptyBody}>Share the link above so guests can start adding their memories.</p>
          </div>
        ) : (
          <div style={styles.masonry}>
            {memories.map(m => (
              <MemoryCard key={m.id} memory={m} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const cardStyles = {
  card: {
    background: 'var(--kb-surface)',
    border: '1px solid var(--kb-border)',
    borderRadius: 16,
    padding: 18,
    breakInside: 'avoid',
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  media: {
    width: '100%',
    borderRadius: 10,
    objectFit: 'cover',
    display: 'block',
    maxHeight: 320,
  },
  message: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 15,
    color: 'var(--kb-text)',
    lineHeight: 1.6,
    margin: 0,
    wordBreak: 'break-word',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    fontStyle: 'italic',
  },
  time: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 12,
    color: 'var(--kb-text-muted)',
  },
  actions: { display: 'flex', gap: 8, marginTop: 4 },
  downloadBtn: {
    fontSize: 13,
    padding: '7px 14px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    background: 'var(--kb-surface-2)',
    border: '1px solid var(--kb-border)',
    color: 'var(--kb-text)',
  },
  deleteBtn: {
    padding: '7px 12px',
    borderRadius: 10,
    fontSize: 16,
    cursor: 'pointer',
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.2)',
    color: 'var(--kb-coral)',
  },
};

const styles = {
  root: { minHeight: '100vh', background: 'var(--kb-bg)', padding: '40px 24px' },
  inner: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  heading: { fontFamily: 'var(--kb-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--kb-text)', margin: 0 },
  subheading: { fontFamily: 'var(--kb-font-body)', fontSize: 14, color: 'var(--kb-text-muted)', margin: '4px 0 0', fontWeight: 500 },
  headerActions: { display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' },
  statBadge: {
    fontFamily: 'var(--kb-font-ui)', fontSize: 12, fontWeight: 600,
    color: 'var(--kb-text-muted)', background: 'var(--kb-surface-2)',
    padding: '5px 12px', borderRadius: 100,
  },
  qrPanel: {
    display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap',
    background: 'var(--kb-surface)', border: '1px solid var(--kb-border)',
    borderRadius: 20, padding: 24, marginBottom: 32,
  },
  qrImg: { width: 110, height: 110, borderRadius: 12, flexShrink: 0 },
  qrInfo: { flex: 1, minWidth: 200 },
  qrLabel: { fontFamily: 'var(--kb-font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', margin: '0 0 10px' },
  qrLinkRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  qrLink: {
    fontFamily: 'monospace', fontSize: 13, color: 'var(--kb-text)',
    background: 'var(--kb-surface-2)', padding: '6px 10px', borderRadius: 8,
    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  qrMessage: { fontFamily: 'var(--kb-font-body)', fontSize: 13, color: 'var(--kb-text-muted)', fontStyle: 'italic', margin: '10px 0 0' },
  qrDates: { fontFamily: 'var(--kb-font-ui)', fontSize: 12, color: 'var(--kb-mint)', fontWeight: 600, margin: '8px 0 0' },
  masonry: { columns: '3 280px', columnGap: 20 },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: { width: 40, height: 40, border: '3px solid var(--kb-border)', borderTopColor: 'var(--kb-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '80px 20px' },
  emptyTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 26, fontWeight: 700, color: 'var(--kb-text)', margin: 0 },
  emptyBody: { fontFamily: 'var(--kb-font-body)', fontSize: 15, color: 'var(--kb-text-muted)', margin: 0 },
};
