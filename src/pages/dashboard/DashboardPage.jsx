import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const THEME_EMOJI = {
  generic: '🎈',
  dino: '🦕',
  unicorn: '🦄',
  princess: '👑',
  cars: '🏎️',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function EventCard({ event }) {
  const emoji = THEME_EMOJI[event.theme] || '🎈';
  const [rsvpCount, setRsvpCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    const qRsvps = query(collection(db, 'rsvps'), where('eventId', '==', event.id));
    const unsubRsvps = onSnapshot(qRsvps, snap => {
      let count = 0;
      snap.forEach(doc => {
        const data = doc.data();
        const isAttending = data.attending === true || data.attending === 'yes' || data.isAttending === true || data.isAttending === 'yes';
        if (isAttending) {
          count += 1 + (data.siblings?.length || 0);
        }
      });
      setRsvpCount(count);
    });

    const qMemories = query(collection(db, 'memories'), where('eventId', '==', event.id));
    const unsubMemories = onSnapshot(qMemories, snap => {
      setMemoryCount(snap.size);
    });

    return () => {
      unsubRsvps();
      unsubMemories();
    };
  }, [event.id]);

  return (
    <div style={cardStyles.card} className="kb-card">
      <div style={cardStyles.themeRow}>
        <span style={cardStyles.emoji}>{emoji}</span>
        <span style={cardStyles.themeBadge}>{event.theme || 'generic'}</span>
      </div>

      <h2 style={cardStyles.name}>{event.name}</h2>
      <div style={cardStyles.details}>
        <p style={cardStyles.detail}>📅 {formatDate(event.date)}</p>
        {event.location && <p style={cardStyles.detail}>📍 {event.location}</p>}
        {(event.hostName || event.hostContact) && (
          <p style={cardStyles.detail}>
            📞 {[event.hostName, event.hostContact].filter(Boolean).join(' - ')}
          </p>
        )}
      </div>

      <div style={cardStyles.badges}>
        <span style={cardStyles.badge}>
          <span style={{ ...cardStyles.badgeDot, background: 'var(--kb-mint)' }} />
          {rsvpCount} RSVPs
        </span>
        <span style={cardStyles.badge}>
          <span style={{ ...cardStyles.badgeDot, background: 'var(--kb-purple)' }} />
          {memoryCount} Memories
        </span>
      </div>

      <div style={cardStyles.actions}>
        <Link
          to={`/dashboard/event/${event.id}`}
          className="kb-btn kb-btn-primary"
          style={cardStyles.manageBtn}
        >
          Manage →
        </Link>
        <a
          href={`/${event.slug}`}
          target="_blank"
          rel="noreferrer"
          className="kb-btn kb-btn-secondary"
          style={cardStyles.viewBtn}
        >
          View invite ↗
        </a>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'events'),
      where('hostId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerEmoji}>🎉</span>
          <h1 style={styles.heading}>My Parties</h1>
        </div>
        <Link to="/dashboard/create" className="kb-btn kb-btn-primary" style={styles.newBtn}>
          + New Party
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your parties…</p>
        </div>
      ) : events.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyEmoji}>🎈</div>
          <h2 style={styles.emptyTitle}>No parties yet!</h2>
          <p style={styles.emptyBody}>Create your first party and start sending invites.</p>
          <Link to="/dashboard/create" className="kb-btn kb-btn-primary" style={styles.emptyBtn}>
            + Create First Party
          </Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {events.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'var(--kb-bg)',
    padding: '40px 24px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 36,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  heading: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 34,
    fontWeight: 700,
    color: 'var(--kb-text)',
    margin: 0,
  },
  newBtn: {
    textDecoration: 'none',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 24,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid var(--kb-border)',
    borderTopColor: 'var(--kb-coral)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--kb-font-body)',
    color: 'var(--kb-text-muted)',
    fontSize: 15,
    margin: 0,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '80px 20px',
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    animation: 'floatBalloon 3s ease-in-out infinite',
  },
  emptyTitle: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--kb-text)',
    margin: 0,
  },
  emptyBody: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 16,
    color: 'var(--kb-text-muted)',
    margin: 0,
    maxWidth: 340,
  },
  emptyBtn: {
    textDecoration: 'none',
    marginTop: 8,
  },
};

const cardStyles = {
  card: {
    background: 'var(--kb-surface)',
    border: '1px solid var(--kb-border)',
    borderRadius: 20,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  themeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 36,
  },
  themeBadge: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--kb-text-muted)',
    background: 'var(--kb-surface-2)',
    padding: '4px 10px',
    borderRadius: 100,
  },
  name: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--kb-text)',
    margin: 0,
    lineHeight: 1.2,
  },
  date: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    margin: 0,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detail: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    margin: 0,
  },
  badges: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--kb-text)',
    background: 'var(--kb-surface-2)',
    padding: '5px 12px',
    borderRadius: 100,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  manageBtn: {
    textDecoration: 'none',
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  viewBtn: {
    textDecoration: 'none',
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--kb-text-muted)',
  },
};
