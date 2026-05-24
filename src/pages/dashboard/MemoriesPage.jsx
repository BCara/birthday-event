import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, deleteDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';

function MemoryCard({ memory, onToggleApprove, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await onToggleApprove(memory.id, !memory.approved);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this memory? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(memory.id);
      toast.success('Memory deleted.');
    } catch {
      toast.error('Failed to delete memory.');
      setDeleting(false);
    }
  }

  return (
    <div style={cardStyles.card}>
      {/* Photo */}
      {memory.photoUrl && (
        <img
          src={memory.photoUrl}
          alt="Memory"
          style={cardStyles.photo}
          loading="lazy"
        />
      )}

      {/* Message */}
      {memory.message && (
        <p style={cardStyles.message}>{memory.message}</p>
      )}

      {/* Author */}
      <p style={cardStyles.author}>— {memory.authorName || 'Anonymous'}</p>

      {/* Actions */}
      <div style={cardStyles.actions}>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="kb-btn"
          style={{
            ...cardStyles.approveBtn,
            background: memory.approved ? 'rgba(6,214,160,0.15)' : 'var(--kb-surface-2)',
            color: memory.approved ? 'var(--kb-mint)' : 'var(--kb-text-muted)',
            border: `1px solid ${memory.approved ? 'rgba(6,214,160,0.3)' : 'var(--kb-border)'}`,
          }}
        >
          {toggling ? '…' : memory.approved ? '✅ Approved' : '⏳ Approve'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="kb-btn"
          style={cardStyles.deleteBtn}
          title="Delete memory"
        >
          {deleting ? '…' : '🗑'}
        </button>
      </div>

      {/* Approval status indicator */}
      {!memory.approved && (
        <div style={cardStyles.pendingBadge}>Pending</div>
      )}
    </div>
  );
}

export default function MemoriesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load memories.');
      setLoading(false);
    });
    return unsub;
  }, [eventId]);

  async function handleToggleApprove(memoryId, approved) {
    try {
      await updateDoc(doc(db, 'memories', memoryId), { approved });
      toast.success(approved ? 'Memory approved! ✅' : 'Memory unapproved.');
    } catch {
      toast.error('Failed to update memory.');
    }
  }

  async function handleDelete(memoryId) {
    await deleteDoc(doc(db, 'memories', memoryId));
  }

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={styles.header}>
          <button
            onClick={() => navigate(`/dashboard/event/${eventId}`)}
            className="kb-btn kb-btn-secondary"
          >
            ← Back
          </button>
          <h1 style={styles.heading}>📸 Memory Wall</h1>
          <div style={styles.headerStats}>
            <span style={styles.statBadge}>
              {memories.length} total
            </span>
            <span style={{ ...styles.statBadge, color: 'var(--kb-mint)' }}>
              {memories.filter(m => m.approved).length} approved
            </span>
            <span style={{ ...styles.statBadge, color: 'var(--kb-yellow)' }}>
              {memories.filter(m => !m.approved).length} pending
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
          </div>
        ) : memories.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 56 }}>📸</span>
            <h2 style={styles.emptyTitle}>No memories yet</h2>
            <p style={styles.emptyBody}>Guests can share photos and messages from your event page.</p>
          </div>
        ) : (
          <div style={styles.masonry}>
            {memories.map(m => (
              <MemoryCard
                key={m.id}
                memory={m}
                onToggleApprove={handleToggleApprove}
                onDelete={handleDelete}
              />
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
    padding: '18px',
    breakInside: 'avoid',
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    position: 'relative',
    transition: 'transform 0.2s',
  },
  photo: {
    width: '100%',
    borderRadius: 10,
    objectFit: 'cover',
    display: 'block',
  },
  message: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 15,
    color: 'var(--kb-text)',
    lineHeight: 1.6,
    margin: 0,
    wordBreak: 'break-word',
  },
  author: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    margin: 0,
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    fontSize: 13,
    padding: '7px 14px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.15s',
  },
  deleteBtn: {
    padding: '7px 12px',
    borderRadius: 10,
    fontSize: 16,
    cursor: 'pointer',
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.2)',
    color: 'var(--kb-coral)',
    transition: 'all 0.15s',
  },
  pendingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(255,209,102,0.15)',
    color: 'var(--kb-yellow)',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'var(--kb-font-ui)',
    padding: '3px 10px',
    borderRadius: 100,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
};

const styles = {
  root: { minHeight: '100vh', background: 'var(--kb-bg)', padding: '40px 24px' },
  inner: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' },
  heading: { fontFamily: 'var(--kb-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--kb-text)', margin: 0 },
  headerStats: { display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' },
  statBadge: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--kb-text-muted)',
    background: 'var(--kb-surface-2)',
    padding: '5px 12px',
    borderRadius: 100,
  },
  masonry: {
    columns: '3 280px',
    columnGap: 20,
  },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: { width: 40, height: 40, border: '3px solid var(--kb-border)', borderTopColor: 'var(--kb-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '80px 20px' },
  emptyTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 26, fontWeight: 700, color: 'var(--kb-text)', margin: 0 },
  emptyBody: { fontFamily: 'var(--kb-font-body)', fontSize: 15, color: 'var(--kb-text-muted)', margin: 0 },
};
