import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, functions } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { getDevSafeOrigin } from '../../utils/url';
import RsvpSettingsModal from '../../components/RsvpSettingsModal';
import { getTheme } from '../../theme/themes';
import ThemeIllustration from '../../theme/ThemeIllustration';
import EditGuestModal from '../../components/EditGuestModal';
import './GuestListPage.css';

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path>
  </svg>
);

// Inline SVGs for premium look
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const ExportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const WhatsAppIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" fill={color} viewBox="0 0 24 24">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.13-1.347a9.921 9.921 0 0 0 4.88 1.274h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.668-1.04-5.176-2.927-7.067A9.923 9.923 0 0 0 12.012 2zm5.72 14.12c-.244.69-1.21 1.258-1.748 1.312-.472.047-.978.077-2.766-.664-2.285-.947-3.76-3.275-3.874-3.428-.113-.153-.923-1.227-.923-2.33 0-1.103.577-1.644.783-1.87.206-.226.454-.282.605-.282.152 0 .304.002.435.008.138.006.322-.053.504.385.187.45.642 1.564.698 1.678.057.113.095.246.019.398-.075.153-.113.246-.226.377-.113.13-.238.293-.34.4-.113.113-.23.238-.1.46.13.226.577.95 1.238 1.54.85.76 1.563.996 1.785 1.11.222.113.35.094.48-.057.13-.15.565-.66.716-.886.15-.226.3-.189.504-.113s1.302.613 1.528.726c.227.113.377.17.434.264.057.094.057.546-.187 1.236z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const PaperPlaneIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#F59E0B' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function MetricCard({ label, value, color, percent, trend, trendColor, bg, border, icon, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        ...metricStyles.card, 
        background: bg, 
        borderColor: active ? color : border,
        boxShadow: active ? `0 8px 24px ${color}1A` : 'none',
        transform: active ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={metricStyles.topRow}>
        <div style={{...metricStyles.iconWrap, background: color}}>
          {icon}
        </div>
        <div style={metricStyles.textCol}>
          <div style={{...metricStyles.label, color: active ? color : 'var(--kb-text-muted)'}}>{label}</div>
          <div style={metricStyles.value}>{value}</div>
        </div>
      </div>
      <div style={metricStyles.bottomRow}>
        <div style={metricStyles.percent}>{percent}</div>
        <div style={{...metricStyles.trend, color: trendColor}}>{trend}</div>
      </div>
    </div>
  );
}

function AttendingBadge({ attending }) {
  const yes = attending === true || attending === 'yes';
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 100,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: 'var(--kb-font-ui)',
      background: yes ? 'rgba(6,214,160,0.15)' : 'rgba(255,107,107,0.12)',
      color: yes ? 'var(--kb-mint)' : 'var(--kb-coral)',
    }}>
      {yes ? 'Yes' : 'No'}
    </span>
  );
}

function exportCSV(rsvps, event) {
  const askAdultCount = event?.askAdultCount !== false;
  const showParentAttendance = event?.showParentAttendance !== false;
  const headers = ['Child Name', 'Child Age', 'Parent Name', 'Email', 'Phone', 'Attending'];
  if (showParentAttendance) headers.push('Stay/Drop-off');
  if (askAdultCount) headers.push('Adults Attending');
  headers.push('Siblings', 'Dietary Notes', 'Comments', 'Date');

  const rows = rsvps.map(r => {
    const isAttending = r.attending === true || r.attending === 'yes' || r.isAttending === true || r.isAttending === 'yes';
    const row = [
      r.childName ?? '',
      r.childAge ?? '',
      r.parentName ?? '',
      r.email ?? '',
      r.phone ?? '',
      isAttending ? 'Yes' : 'No',
    ];

    if (showParentAttendance) {
      row.push(r.stayOrDropOff === 'staying' ? 'Staying' : (r.stayOrDropOff === 'dropoff' ? 'Drop-off' : '—'));
    }

    if (askAdultCount) {
      const finalAdults = r.adultsCount === null
        ? 'Unsure'
        : (r.adultsCount !== undefined ? r.adultsCount : 1);
      row.push(finalAdults);
    }

    const sibsString = Array.isArray(r.siblings)
      ? r.siblings.map(s => `${s.name || 'Unnamed'}${s.age ? ` (${s.age}yo)` : ''}`).join('; ')
      : r.siblings ?? '';
    
    row.push(sibsString, r.dietary ?? '', r.comments ?? '', r.createdAt?.toDate?.()?.toLocaleDateString('en-AU') ?? '');
    return row;
  });
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rsvps.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV downloaded!');
}

export default function GuestListPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [rsvps, setRsvps] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'going', 'maybe', 'declined'
  
  // Advanced RSVP State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

  // Magic Parse State
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicText, setMagicText] = useState('');
  const [isParsingRsvp, setIsParsingRsvp] = useState(false);
  const [parsedRsvpPreview, setParsedRsvpPreview] = useState(null);

  // Estimate Edit States
  const [isEditingEstimates, setIsEditingEstimates] = useState(false);
  const [editKidsEst, setEditKidsEst] = useState('');
  const [editAdultsEst, setEditAdultsEst] = useState('');
  const [isHoveredEstimates, setIsHoveredEstimates] = useState(false);

  const askAdultCount = event?.askAdultCount !== false;
  const showParentAttendance = event?.showParentAttendance !== false;

  useEffect(() => {
    const q = query(
      collection(db, 'rsvps'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const unsubRsvps = onSnapshot(q, snap => {
      setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      toast.error('Failed to load RSVPs.');
      setLoading(false);
    });

    const unsubEvent = onSnapshot(doc(db, 'events', eventId), snap => {
      if (snap.exists()) setEvent({ id: snap.id, ...snap.data() });
    });

    return () => {
      unsubRsvps();
      unsubEvent();
    };
  }, [eventId]);

  const attending = rsvps.filter(r => r.attending === true || r.attending === 'yes' || r.isAttending === true || r.isAttending === 'yes');
  const declined = rsvps.filter(r => r.attending === false || r.attending === 'no' || r.isAttending === false || r.isAttending === 'no');
  const maybe = rsvps.filter(r => r.attending === 'maybe' || r.isAttending === 'maybe');
  const needsApproval = rsvps.filter(r => r.attending === 'needs_approval');
  
  const siblingCount = attending.reduce((acc, r) => acc + (r.siblings?.length || 0), 0);
  const totalKidsGoing = attending.length + siblingCount;
  const adultsCount = attending.reduce((acc, r) => {
    if (r.adultsCount === null) {
      return acc; // unsure, do not count towards confirmed
    }
    if (r.adultsCount !== undefined) {
      return acc + Number(r.adultsCount);
    }
    return acc + 1;
  }, 0);

  const eventDateStr = event?.date ? new Date(event.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '21 June 2026';
  const eventLocation = event?.location || 'Myuna Farm';
  const themeObj = getTheme(event?.theme || 'kids-dino', event?.themeColor || 'default');
  const eventTheme = event?.theme ? `${event.theme.charAt(0).toUpperCase() + event.theme.slice(1)} Theme` : 'Dino Theme';

  const inviteUrl = event?.slug ? `${getDevSafeOrigin()}/share/${event.slug}` : `${getDevSafeOrigin()}/share/...`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied!');
  };

  // Filter list of RSVPs
  const filteredRsvps = rsvps.filter(r => {
    const matchesSearch = 
      (r.childName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (r.parentName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    const isAttending = r.attending === true || r.attending === 'yes' || r.isAttending === true || r.isAttending === 'yes';
    const isDeclined = r.attending === false || r.attending === 'no' || r.isAttending === false || r.isAttending === 'no';
    const isMaybe = r.attending === 'maybe' || r.isAttending === 'maybe';
    const isNeedsApproval = r.attending === 'needs_approval';

    if (statusFilter === 'going') return isAttending;
    if (statusFilter === 'maybe') return isMaybe;
    if (statusFilter === 'declined') return isDeclined;
    if (statusFilter === 'needs_approval') return isNeedsApproval;
    return true;
  });

  // Flatten RSVPs to include siblings as separate rows
  const flattenedRsvps = [];
  filteredRsvps.forEach(r => {
    flattenedRsvps.push({ ...r, isSiblingRow: false });
    
    if (Array.isArray(r.siblings) && r.siblings.length > 0) {
      r.siblings.forEach((sib, idx) => {
        flattenedRsvps.push({
          id: `${r.id}-sib-${idx}`,
          childName: sib.name,
          childAge: sib.age,
          parentName: r.parentName,
          email: r.email,
          phone: r.phone,
          attending: r.attending,
          isAttending: r.isAttending,
          adultsCount: null, // Handled below to hide for siblings
          dietary: sib.dietary,
          comments: '', // Do not duplicate comments for siblings
          createdAt: r.createdAt,
          isImported: r.isImported,
          isSiblingRow: true,
          mainGuestId: r.id
        });
      });
    }
  });

  const toggleFilter = (filterType) => {
    if (statusFilter === filterType) {
      setStatusFilter('all');
    } else {
      setStatusFilter(filterType);
    }
  };

  const handleAddSingleGuest = async (e) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    try {
      await addDoc(collection(db, 'rsvps'), {
        eventId,
        childName: newGuestName.trim(),
        email: newGuestEmail.trim(),
        phone: newGuestPhone.trim(),
        isImported: true,
        attending: 'pending',
        createdAt: serverTimestamp(),
      });
      setNewGuestName('');
      setNewGuestEmail('');
      setNewGuestPhone('');
      setAddingGuest(false);
      toast.success('Guest added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add guest');
    }
  };

  const handleImportList = async () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    let importedCount = 0;
    
    // Simple CSV parser: Name, Email, Phone
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      const email = parts[1] || '';
      const phone = parts[2] || '';
      
      if (name) {
        await addDoc(collection(db, 'rsvps'), {
          eventId,
          childName: name,
          email,
          phone,
          isImported: true,
          attending: 'pending',
          createdAt: serverTimestamp(),
        });
        importedCount++;
      }
    }
    
    toast.success(`Imported ${importedCount} guests!`);
    setImportText('');
    setShowImportModal(false);
  };

  const handleSaveSettings = async (settings) => {
    if (!event) return;
    try {
      await updateDoc(doc(db, 'events', eventId), settings);
      toast.success('RSVP Settings saved!');
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  const handleToggleLock = async () => {
    if (!event) return;
    try {
      await updateDoc(doc(db, 'events', eventId), { lockDownRSVP: !event.lockDownRSVP });
      toast.success(event.lockDownRSVP ? 'RSVP list unlocked' : 'RSVP list locked');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lock status');
    }
  };

  const handleApproveGuest = async (guest) => {
    try {
      const guestDocRef = doc(db, 'rsvps', guest.id);
      await updateDoc(guestDocRef, { attending: guest.intendedAttending !== undefined ? guest.intendedAttending : true });
      toast.success('Guest approved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve guest');
    }
  };

  const handleDeclineGuest = async (guest) => {
    try {
      const guestDocRef = doc(db, 'rsvps', guest.id);
      await updateDoc(guestDocRef, { attending: false });
      toast.success('Guest declined!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to decline guest');
    }
  };

  const handleDeleteGuest = async (guest) => {
    const guestName = guest.childName || 'this guest';
    const confirmMsg = guest.isSiblingRow 
      ? `Remove sibling "${guestName}"?` 
      : `Delete entire RSVP for "${guestName}"? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (guest.isSiblingRow) {
        const sibIndex = parseInt(guest.id.split('-sib-')[1], 10);
        if (isNaN(sibIndex)) throw new Error('Invalid sibling row ID');

        const parentDocRef = doc(db, 'rsvps', guest.mainGuestId);
        const parentSnap = await getDoc(parentDocRef);
        if (!parentSnap.exists()) throw new Error('Parent RSVP not found');

        const newSiblings = [...(parentSnap.data().siblings || [])];
        newSiblings.splice(sibIndex, 1);

        await updateDoc(parentDocRef, { siblings: newSiblings });
        toast.success('Sibling removed!');
      } else {
        await deleteDoc(doc(db, 'rsvps', guest.id));
        toast.success('Guest deleted!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete guest');
    }
  };

  const handleSaveGuest = async (updatedGuest) => {
    try {
      if (updatedGuest.isSiblingRow) {
        const sibIndex = parseInt(updatedGuest.id.split('-sib-')[1], 10);
        if (isNaN(sibIndex)) throw new Error('Invalid sibling row ID');

        const parentDocRef = doc(db, 'rsvps', updatedGuest.mainGuestId);
        const parentSnap = await getDoc(parentDocRef);
        if (!parentSnap.exists()) throw new Error('Parent RSVP not found');

        const newSiblings = [...(parentSnap.data().siblings || [])];

        if (newSiblings[sibIndex]) {
          newSiblings[sibIndex] = {
            ...newSiblings[sibIndex],
            name: updatedGuest.childName,
            age: updatedGuest.childAge,
            dietary: updatedGuest.dietary
          };

          await updateDoc(parentDocRef, { siblings: newSiblings });
        }
      } else {
        const guestDocRef = doc(db, 'rsvps', updatedGuest.id);
        await updateDoc(guestDocRef, updatedGuest);
      }
      toast.success('Guest updated!');
      setEditingGuest(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update guest');
    }
  };

  const handleStartEditEstimates = () => {
    setEditKidsEst(event?.kidsEstimate ?? (event?.guestEstimate ? Math.floor(event?.guestEstimate / 2) : 10));
    setEditAdultsEst(event?.adultsEstimate ?? (event?.guestEstimate ? Math.ceil(event?.guestEstimate / 2) : 10));
    setIsEditingEstimates(true);
  };

  const handleSaveEstimates = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateDoc(doc(db, 'events', eventId), {
        kidsEstimate: Number(editKidsEst),
        adultsEstimate: Number(editAdultsEst)
      });
      toast.success('Estimates updated!');
      setIsEditingEstimates(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update estimates');
    }
  };

  const handleMagicParse = async () => {
    if (!magicText.trim()) return;
    setIsParsingRsvp(true);
    setParsedRsvpPreview(null);
    try {
      const parseRsvpMessage = httpsCallable(functions, 'parseRsvpMessage');
      const result = await parseRsvpMessage({ text: magicText });
      setParsedRsvpPreview(result.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse message. Please check logs.');
    } finally {
      setIsParsingRsvp(false);
    }
  };

  const handleSaveParsedRsvp = async () => {
    if (!parsedRsvpPreview) return;
    try {
      await addDoc(collection(db, 'rsvps'), {
        eventId,
        childName: parsedRsvpPreview.childName || 'Unknown Guest',
        parentName: parsedRsvpPreview.parentName || '',
        attending: parsedRsvpPreview.attending === true ? 'yes' : (parsedRsvpPreview.attending === false ? 'no' : 'maybe'),
        dietary: parsedRsvpPreview.dietary || '',
        adultsCount: parsedRsvpPreview.adultsCount !== undefined && parsedRsvpPreview.adultsCount !== null ? parsedRsvpPreview.adultsCount : null,
        isImported: true,
        createdAt: serverTimestamp(),
        siblings: Array.isArray(parsedRsvpPreview.siblings) ? parsedRsvpPreview.siblings : []
      });
      toast.success('Guest added successfully!');
      setShowMagicModal(false);
      setMagicText('');
      setParsedRsvpPreview(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save parsed guest');
    }
  };

  return (
    <div className="gl-root" style={{ minHeight: '100vh', background: 'var(--kb-bg)', fontFamily: 'var(--kb-font-body)' }}>
      <div style={styles.inner}>
        
        {/* Top Header Row */}
        <div style={styles.headerRow}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button onClick={() => navigate(`/dashboard/event/${eventId}`)} className="kb-btn kb-btn-secondary" style={styles.backBtn}>
              <BackIcon /> Back
            </button>
            <h1 style={styles.heading}>👥 RSVPs</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setShowSettingsModal(true)} style={{...styles.actionBtn, background: 'var(--kb-surface)', border: '1px solid var(--kb-border)'}}>
              ⚙️ RSVP Settings
            </button>
          </div>
        </div>

        {/* Banner */}
        <div className="gl-banner" style={{
          ...styles.banner,
          background: `${themeObj.patternSvg(themeObj.vars['--t-accent'])}, linear-gradient(135deg, ${themeObj.vars['--t-bg-from']} 0%, ${themeObj.vars['--t-bg-to']} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          borderColor: themeObj.vars['--t-border'],
        }}>
          <div style={{ position: 'absolute', right: '35%', top: '50%', transform: 'translateY(-50%)', width: '250px', opacity: 0.9, pointerEvents: 'none', zIndex: 0 }}>
             <ThemeIllustration theme={event?.theme || 'kids-dino'} themeColor={event?.themeColor || 'default'} />
          </div>
          <div style={{...styles.bannerContent, position: 'relative', zIndex: 1}}>
            <h2 style={{...styles.bannerTitle, color: themeObj.vars['--t-text']}}>{event?.name || 'Robins 3rd Birthday'} {themeObj.emoji}</h2>
            <div style={{...styles.bannerDetails, color: themeObj.vars['--t-text-light']}}>
              <span>📅 {eventDateStr}</span>
              <span>•</span>
              <span>📍 {eventLocation}</span>
              {(event?.hostName || event?.hostContact) && (
                <>
                  <span>•</span>
                  <span>👤 {[event.hostName, event.hostContact].filter(Boolean).join(' - ')}</span>
                </>
              )}
              <span>•</span>
              <span style={{...styles.themeTag, background: themeObj.vars['--t-soft-bg'], color: themeObj.vars['--t-primary']}}>{eventTheme}</span>
            </div>
          </div>
          {isEditingEstimates ? (
            <div 
              style={{
                ...styles.invitedBox, 
                position: 'relative', 
                zIndex: 1,
                borderColor: 'var(--kb-border-hover)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.invitedIconBg}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <form onSubmit={handleSaveEstimates} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div>
                        <input
                          type="number"
                          min="0"
                          required
                          value={editKidsEst}
                          onChange={e => setEditKidsEst(e.target.value)}
                          style={{ width: 65, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--kb-border)', background: 'var(--kb-surface-2)', color: 'var(--kb-text)', fontWeight: 800, fontSize: 16, textAlign: 'center' }}
                          className="kb-input"
                          autoFocus
                        />
                        <div style={{...styles.invitedLabel, marginTop: 4}}>Kids Est.</div>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          required
                          value={editAdultsEst}
                          onChange={e => setEditAdultsEst(e.target.value)}
                          style={{ width: 65, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--kb-border)', background: 'var(--kb-surface-2)', color: 'var(--kb-text)', fontWeight: 800, fontSize: 16, textAlign: 'center' }}
                          className="kb-input"
                        />
                        <div style={{...styles.invitedLabel, marginTop: 4}}>Adults Est.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingEstimates(false)} 
                        style={{ background: 'var(--kb-surface-2)', border: '1px solid var(--kb-border)', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: 'var(--kb-text)' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{ background: 'var(--kb-mint)', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: 'white' }}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={handleStartEditEstimates}
              onMouseEnter={() => setIsHoveredEstimates(true)}
              onMouseLeave={() => setIsHoveredEstimates(false)}
              style={{
                ...styles.invitedBox, 
                position: 'relative', 
                zIndex: 1,
                cursor: 'pointer',
                borderColor: isHoveredEstimates ? 'var(--kb-mint)' : 'var(--kb-border)',
                transform: isHoveredEstimates ? 'translateY(-2px)' : 'none',
                boxShadow: isHoveredEstimates ? 'var(--kb-shadow-md)' : 'var(--kb-shadow-sm)',
                transition: 'all 0.2s ease-in-out'
              }}
              title="Click to edit estimates"
            >
              {isHoveredEstimates && (
                <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 12, opacity: 0.6 }}>
                  ✏️
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.invitedIconBg}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{...styles.invitedValue, fontSize: 24}}>{event?.kidsEstimate ?? (event?.guestEstimate ? Math.floor(event?.guestEstimate / 2) : 10)}</div>
                        <div style={styles.invitedLabel}>Kids Est.</div>
                      </div>
                      <div>
                        <div style={{...styles.invitedValue, fontSize: 24}}>{event?.adultsEstimate ?? (event?.guestEstimate ? Math.ceil(event?.guestEstimate / 2) : 10)}</div>
                        <div style={styles.invitedLabel}>Adults Est.</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--kb-text)', fontWeight: 700, background: 'var(--kb-surface-2)', padding: '4px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                      Total: {(event?.kidsEstimate ?? (event?.guestEstimate ? Math.floor(event?.guestEstimate / 2) : 10)) + (event?.adultsEstimate ?? (event?.guestEstimate ? Math.ceil(event?.guestEstimate / 2) : 10))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metric Cards */}
        <h3 style={{ fontFamily: 'var(--kb-font-display)', fontSize: 20, margin: '32px 0 16px', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8 }}>📊 RSVP Overview</h3>
        <div style={styles.metrics}>
          <MetricCard 
            label="Going (Kids)" 
            value={totalKidsGoing} 
            color="#10B981" 
            trend={`${attending.length} main • ${siblingCount} sibs`} 
            trendColor="var(--kb-text-muted)"
            bg="rgba(16, 185, 129, 0.1)"
            border="rgba(16, 185, 129, 0.2)"
            icon={<CheckIcon />}
            active={statusFilter === 'going'}
            onClick={() => toggleFilter('going')}
          />
          <MetricCard 
            label="Maybe" 
            value={maybe.length} 
            color="#F59E0B" 
            trend="Unsure responses" 
            trendColor="var(--kb-text-muted)"
            bg="rgba(245, 158, 11, 0.1)"
            border="rgba(245, 158, 11, 0.2)"
            icon={<span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>?</span>}
            active={statusFilter === 'maybe'}
            onClick={() => toggleFilter('maybe')}
          />
          <MetricCard 
            label="Declined" 
            value={declined.length} 
            color="#EF4444" 
            trend="Can't make it" 
            trendColor="var(--kb-text-muted)"
            bg="rgba(239, 44, 44, 0.1)"
            border="rgba(239, 44, 44, 0.2)"
            icon={<CrossIcon />}
            active={statusFilter === 'declined'}
            onClick={() => toggleFilter('declined')}
          />
          {needsApproval.length > 0 && (
            <MetricCard 
              label="Needs Approval" 
              value={needsApproval.length} 
              color="#F97316" 
              trend="Pending host review" 
              trendColor="var(--kb-text-muted)"
              bg="rgba(249, 115, 22, 0.1)"
              border="rgba(249, 115, 22, 0.2)"
              icon={<span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>!</span>}
              active={statusFilter === 'needs_approval'}
              onClick={() => toggleFilter('needs_approval')}
            />
          )}
          {askAdultCount && (
            <MetricCard 
              label="Adults Attending" 
              value={adultsCount} 
              color="#8B5CF6" 
              percent="Accompanying adults" 
              trend={`${attending.filter(r => r.adultsCount === null).length} unsure`} 
              trendColor="var(--kb-text-muted)"
              bg="rgba(139, 92, 246, 0.1)"
              border="rgba(139, 92, 246, 0.2)"
              icon={<MailIcon />}
              active={false}
            />
          )}
        </div>

        {/* Age Breakdown Card (if any ages are captured) */}
        {attending.some(r => (r.childAge !== undefined && r.childAge !== null && r.childAge !== '') || (r.siblings && r.siblings.some(s => s.age))) && (
          <div style={styles.ageBreakdown}>
            <div style={styles.ageBreakdownTitle}>🎂 Kids' Age Mix</div>
            <div style={styles.ageBreakdownList}>
              {Object.entries(
                attending.reduce((acc, r) => {
                  if (r.childAge !== undefined && r.childAge !== null && r.childAge !== '') {
                    const age = Number(r.childAge);
                    acc[age] = (acc[age] || 0) + 1;
                  }
                  if (Array.isArray(r.siblings)) {
                    r.siblings.forEach(s => {
                      if (s.age !== undefined && s.age !== null && s.age !== '') {
                        const age = Number(s.age);
                        acc[age] = (acc[age] || 0) + 1;
                      }
                    });
                  }
                  return acc;
                }, {})
              )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([age, count]) => (
                <div key={age} style={styles.agePill}>
                  <span style={styles.agePillText}>{age} years old</span>
                  <span style={styles.agePillCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <h3 style={{ fontFamily: 'var(--kb-font-display)', fontSize: 20, margin: '32px 0 16px', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8 }}>📣 Share & Remind</h3>
        <div style={styles.actionBar}>
          <div style={styles.actionLeft}>
            <div style={styles.actionIcon}>🎉</div>
            <div>
              <div style={styles.actionTitle}>Get more responses!</div>
              <div style={styles.actionSub}>Share your invite link or send a reminder to guests.</div>
            </div>
          </div>
          <div style={styles.actionRight}>
            <a href={`https://wa.me/?text=You're invited!%20${encodeURIComponent(inviteUrl)}`} target="_blank" rel="noreferrer" style={{...styles.actionBtn, background: '#10B981', color: 'white', border: 'none', textDecoration: 'none'}}>
              <WhatsAppIcon color="white" /> Share Invite
            </a>
            <button onClick={copyLink} style={styles.actionBtn}>
              <LinkIcon /> Copy Link
            </button>
            <button style={styles.actionBtn}>
              <PaperPlaneIcon /> Send Reminder
            </button>
            <button style={{...styles.actionBtn, padding: '10px 14px'}}>•••</button>
          </div>
        </div>

        {/* Add Guest Inline Form */}
        {addingGuest && (
          <div style={{ background: 'var(--kb-surface)', padding: 16, borderRadius: 16, border: '1px solid var(--kb-mint)', marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 12px 0', fontFamily: 'var(--kb-font-ui)' }}>Add New Guest</h4>
            <form onSubmit={handleAddSingleGuest} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, color: 'var(--kb-text-muted)', marginBottom: 4, display: 'block' }}>Name *</label>
                <input required value={newGuestName} onChange={e => setNewGuestName(e.target.value)} placeholder="Guest Name" style={styles.searchInput} className="kb-input" />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, color: 'var(--kb-text-muted)', marginBottom: 4, display: 'block' }}>Email</label>
                <input type="email" value={newGuestEmail} onChange={e => setNewGuestEmail(e.target.value)} placeholder="Email Address" style={styles.searchInput} className="kb-input" />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, color: 'var(--kb-text-muted)', marginBottom: 4, display: 'block' }}>Phone</label>
                <input type="tel" value={newGuestPhone} onChange={e => setNewGuestPhone(e.target.value)} placeholder="Phone Number" style={styles.searchInput} className="kb-input" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setAddingGuest(false)} className="kb-btn kb-btn-secondary" style={{ padding: '10px 16px' }}>Cancel</button>
                <button type="submit" className="kb-btn kb-btn-primary" style={{ padding: '10px 16px', background: 'var(--kb-mint)', border: 'none' }}>Add</button>
              </div>
            </form>
          </div>
        )}

        {/* Guest Responses Table/Empty State */}
        <div style={styles.guestSection}>
          <div style={styles.guestHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h3 style={styles.guestTitle}>
                👥 Guest List
                <span style={styles.guestCount}>{filteredRsvps.length}</span>
              </h3>
              {statusFilter !== 'all' && (
                <span onClick={() => setStatusFilter('all')} style={styles.filterClearTag}>
                  Filtering by {statusFilter} ✕
                </span>
              )}
            </div>
            <div className="gl-guest-actions" style={styles.guestActions}>
              <div className="gl-guest-btns" style={{ display: 'flex', gap: 8, marginRight: 8, borderRight: '1px solid var(--kb-border)', paddingRight: 16 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button 
                    onClick={() => handleToggleLock()} 
                    style={{...styles.actionBtn, background: event?.lockDownRSVP ? 'rgba(239, 68, 68, 0.1)' : 'var(--kb-surface)', color: event?.lockDownRSVP ? '#EF4444' : 'var(--kb-text)', border: event?.lockDownRSVP ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--kb-border)', padding: '8px 14px'}}
                  >
                    {event?.lockDownRSVP ? <LockIcon /> : <UnlockIcon />}
                    {event?.lockDownRSVP ? 'Locked' : 'Unlocked'}
                  </button>
                  <div title="When locked, guests who are not already on your guest list will require your approval before being marked as 'Going'." style={{ position: 'absolute', top: -6, right: -6, background: 'var(--kb-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', color: 'var(--kb-text-muted)', cursor: 'help', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid var(--kb-border)' }}>
                    <InfoIcon />
                  </div>
                </div>
                <button onClick={() => setAddingGuest(true)} style={{...styles.actionBtn, background: 'var(--kb-mint)', color: 'white', border: 'none', padding: '8px 14px'}}>
                  + Add Guest
                </button>
                <button onClick={() => setShowMagicModal(true)} style={{...styles.actionBtn, background: '#3B82F6', color: 'white', border: 'none', padding: '8px 14px'}}>
                  <SparklesIcon /> Magic Paste
                </button>
                <button onClick={() => setShowImportModal(true)} style={{...styles.actionBtn, background: 'var(--kb-purple)', color: 'white', border: 'none', padding: '8px 14px'}}>
                  📋 Import List
                </button>
                <button onClick={() => exportCSV(rsvps, event)} style={{...styles.exportBtn, padding: '8px 14px', border: 'none', background: 'rgba(239, 68, 68, 0.1)'}} disabled={rsvps.length === 0}>
                  <ExportIcon /> Export CSV
                </button>
              </div>
              <div className="gl-search-wrap" style={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.searchIconPos}>
                  <SearchIcon />
                </div>
              </div>
              <button style={styles.filterBtn}>
                <FilterIcon /> Filter ⌄
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.center}>
              <div style={styles.spinner} />
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div style={styles.empty}>
              <img src="/images/purple_dino_empty.png" alt="Empty" style={{height: 180, marginBottom: 16}} />
              <h2 style={styles.emptyTitle}>No RSVPs yet</h2>
              <p style={styles.emptyBody}>Share your invite link with your guests.<br/>Responses will appear here.</p>
              <div style={styles.emptyActions}>
                <button onClick={copyLink} style={{...styles.actionBtn, background: '#10B981', color: 'white', border: 'none'}}>
                  <LinkIcon /> Copy Invite Link
                </button>
                <a href={`https://wa.me/?text=You're invited!%20${encodeURIComponent(inviteUrl)}`} target="_blank" rel="noreferrer" style={{...styles.actionBtn, textDecoration: 'none'}}>
                  <WhatsAppIcon color="#10B981" /> Share on WhatsApp
                </a>
              </div>
              <div style={styles.curvedArrowContainer}>
                <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
                  <path d="M10 5 Q 35 25, 50 15" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                  <path d="M46 22 L 50 15 L 42 16" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={styles.startSharingText}>Start sharing!</span>
              </div>
            </div>
          ) : (
            <>
            <div className="gl-table-desktop" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Name', 'Age', 'Parent Name', 'Email', 'Phone', 'Attending', showParentAttendance && 'Stay/Drop-off', askAdultCount && 'Adults', 'Dietary/Notes', 'Comments', 'Date', 'Action'].filter(Boolean).map(h => (
                       <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flattenedRsvps.map(r => {
                    let displayAdults = '—';
                    if (r.adultsCount === null) {
                      displayAdults = 'Unsure';
                    } else if (r.adultsCount !== undefined) {
                      displayAdults = r.adultsCount;
                    } else {
                      displayAdults = 1;
                    }
                    return (
                      <tr key={r.id} style={styles.tr}>
                        <td style={styles.td}><strong>{r.childName ?? '—'}</strong></td>
                        <td style={styles.td}>{r.childAge !== undefined && r.childAge !== null && r.childAge !== '' ? `${r.childAge} yo` : '—'}</td>
                        <td style={styles.td}>{r.parentName || '—'}</td>
                        <td style={styles.td}>{r.email || '—'}</td>
                        <td style={styles.td}>{r.phone || '—'}</td>
                        <td style={styles.td}>
                          {r.attending === 'pending' ? (
                            <span style={{ fontSize: 13, color: 'var(--kb-text-muted)', fontWeight: 600, padding: '4px 8px', background: 'var(--kb-surface-2)', borderRadius: 12 }}>Pending</span>
                          ) : r.attending === 'needs_approval' ? (
                            <span style={{ fontSize: 13, color: '#F97316', fontWeight: 600, padding: '4px 8px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: 12 }}>Needs Approval</span>
                          ) : (
                            <AttendingBadge attending={r.attending || r.isAttending} />
                          )}
                        </td>
                        {showParentAttendance && (
                          <td style={styles.td}>
                            {r.isSiblingRow ? (
                              <span style={{ fontSize: 13, color: 'var(--kb-text-muted)' }}>—</span>
                            ) : (
                              r.stayOrDropOff === 'staying' ? '🏠 Staying' : (r.stayOrDropOff === 'dropoff' ? '🚗 Drop-off' : '—')
                            )}
                          </td>
                        )}
                        {askAdultCount && (
                          <td style={styles.td}>
                            {r.isSiblingRow ? (
                              <span style={{ fontSize: 13, color: 'var(--kb-text-muted)' }}>—</span>
                            ) : (
                              r.isImported && r.attending === 'pending' ? '—' : displayAdults
                            )}
                          </td>
                        )}
                        <td style={{ ...styles.td, maxWidth: 200, wordBreak: 'break-word' }}>
                          {r.dietary && r.dietary.trim() ? (
                            <div style={{ color: 'var(--kb-coral)', fontWeight: '600', fontSize: 13 }}>{r.dietary}</div>
                          ) : '—'}
                        </td>
                        <td style={{ ...styles.td, maxWidth: 200, wordBreak: 'break-word' }}>
                          {r.comments && r.comments.trim() ? (
                            <div style={{ fontSize: 13 }}>{r.comments}</div>
                          ) : '—'}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap', color: 'var(--kb-text-muted)', fontSize: 13 }}>
                          {r.createdAt?.toDate?.()?.toLocaleDateString('en-AU') ?? '—'}
                        </td>
                        <td style={{ ...styles.td, display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {r.attending === 'needs_approval' ? (
                            <>
                              <button onClick={() => handleApproveGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap', color: 'white', background: 'var(--kb-mint)', border: 'none' }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => handleDeclineGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap', color: 'white', background: 'var(--kb-coral)', border: 'none' }}>
                                ✕ Decline
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditingGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap', color: 'var(--kb-text)', border: '1px solid var(--kb-border)' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDeleteGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }} title="Delete">
                                <TrashIcon />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="gl-cards-mobile">
              {flattenedRsvps.map(r => {
                const dateStr = r.createdAt?.toDate?.()?.toLocaleDateString('en-AU') ?? null;
                return (
                  <div key={r.id} className={`gl-guest-card${r.isSiblingRow ? ' gl-sibling-card' : ''}`}>
                    <div className="gl-card-top">
                      <div className="gl-card-identity">
                        {r.isSiblingRow && <span className="gl-sib-label">↳</span>}
                        <strong className="gl-card-name">{r.childName ?? '—'}</strong>
                        {(r.childAge != null && r.childAge !== '') && (
                          <span className="gl-card-age">{r.childAge}yo</span>
                        )}
                      </div>
                      <div>
                        {r.attending === 'pending' ? (
                          <span className="gl-card-status-pending">Pending</span>
                        ) : r.attending === 'needs_approval' ? (
                          <span className="gl-card-status-approval">Needs Approval</span>
                        ) : (
                          <AttendingBadge attending={r.attending || r.isAttending} />
                        )}
                      </div>
                    </div>
                    {(r.parentName || r.dietary?.trim()) && (
                      <div className="gl-card-details">
                        {r.parentName && <span className="gl-card-parent">{r.parentName}</span>}
                        {r.dietary?.trim() && <span className="gl-card-dietary">⚠️ {r.dietary}</span>}
                      </div>
                    )}
                    <div className="gl-card-footer">
                      {dateStr && <span className="gl-card-date">{dateStr}</span>}
                      <div className="gl-card-actions">
                        {r.attending === 'needs_approval' ? (
                          <>
                            <button onClick={() => handleApproveGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 12px', fontSize: 12, color: 'white', background: 'var(--kb-mint)', border: 'none' }}>✓ Approve</button>
                            <button onClick={() => handleDeclineGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 12px', fontSize: 12, color: 'white', background: 'var(--kb-coral)', border: 'none' }}>✕ Decline</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--kb-text)', border: '1px solid var(--kb-border)' }}>✏️ Edit</button>
                            <button onClick={() => handleDeleteGuest(r)} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }} title="Delete"><TrashIcon /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>

        {/* Tip Bar */}
        <div style={styles.tipBar}>
          <div style={styles.tipContent}>
            <StarIcon />
            <span><strong>Tip:</strong> Personalize your reminder to get better response rates!</span>
          </div>
          <button style={styles.tipBtn}>
            <PaperPlaneIcon color="#EF4444" /> Send Reminder
          </button>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: 'var(--kb-surface)', padding: 32, borderRadius: 24, width: '100%', maxWidth: 500, border: '1px solid var(--kb-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--kb-font-display)', color: 'var(--kb-text)' }}>📋 Import Guest List</h2>
              <p style={{ color: 'var(--kb-text-muted)', fontSize: 14, marginBottom: 16 }}>
                Paste your guest list below. Use commas to separate Name, Email, and Phone for each guest. Put each guest on a new line.
              </p>
              <div style={{ background: 'var(--kb-surface-2)', padding: 12, borderRadius: 12, fontSize: 13, fontFamily: 'monospace', color: 'var(--kb-text-muted)', marginBottom: 16 }}>
                Example:<br/>
                Alice, alice@email.com, 555-0101<br/>
                Bob, bob@email.com<br/>
                Charlie, , 555-0102
              </div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste your CSV data here..."
                style={{ width: '100%', height: 200, padding: 16, borderRadius: 12, border: '1px solid var(--kb-input-border)', background: 'var(--kb-input-bg)', color: 'var(--kb-text)', fontFamily: 'var(--kb-font-body)', resize: 'vertical', marginBottom: 24 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setShowImportModal(false)} className="kb-btn kb-btn-secondary">Cancel</button>
                <button onClick={handleImportList} className="kb-btn kb-btn-primary" style={{ background: 'var(--kb-purple)', border: 'none' }}>Import</button>
              </div>
            </div>
          </div>
        )}

        {/* Magic Parse Modal */}
        {showMagicModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: 'var(--kb-surface)', padding: 32, borderRadius: 24, width: '100%', maxWidth: 500, border: '1px solid var(--kb-border)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--kb-font-display)', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SparklesIcon /> Magic Paste RSVP
              </h2>
              
              {!parsedRsvpPreview ? (
                <>
                  <p style={{ color: 'var(--kb-text-muted)', fontSize: 14, marginBottom: 16 }}>
                    Paste a text message or email reply here, and our AI will automatically extract the guest's RSVP details.
                  </p>
                  <textarea
                    value={magicText}
                    onChange={e => setMagicText(e.target.value)}
                    placeholder="e.g. Hi! Thanks for the invite, Timmy and I will be there! No allergies."
                    style={{ width: '100%', height: 160, padding: 16, borderRadius: 12, border: '1px solid var(--kb-input-border)', background: 'var(--kb-input-bg)', color: 'var(--kb-text)', fontFamily: 'var(--kb-font-body)', resize: 'vertical', marginBottom: 24 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => setShowMagicModal(false)} className="kb-btn kb-btn-secondary" disabled={isParsingRsvp}>Cancel</button>
                    <button onClick={handleMagicParse} className="kb-btn kb-btn-primary" style={{ background: '#3B82F6', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }} disabled={isParsingRsvp || !magicText.trim()}>
                      {isParsingRsvp ? <div style={styles.spinner} /> : <SparklesIcon />}
                      {isParsingRsvp ? 'Parsing...' : 'Parse Message'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--kb-text-muted)', fontSize: 14, marginBottom: 16 }}>
                    Here's what we found. Review and edit before saving:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase' }}>Child Name</label>
                      <input type="text" value={parsedRsvpPreview.childName || ''} onChange={e => setParsedRsvpPreview({...parsedRsvpPreview, childName: e.target.value})} className="kb-input" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase' }}>Parent Name</label>
                      <input type="text" value={parsedRsvpPreview.parentName || ''} onChange={e => setParsedRsvpPreview({...parsedRsvpPreview, parentName: e.target.value})} className="kb-input" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase' }}>Attending</label>
                      <select value={parsedRsvpPreview.attending === true ? 'yes' : (parsedRsvpPreview.attending === false ? 'no' : 'maybe')} onChange={e => {
                        const val = e.target.value;
                        setParsedRsvpPreview({...parsedRsvpPreview, attending: val === 'yes' ? true : (val === 'no' ? false : null)});
                      }} className="kb-input">
                        <option value="yes">Yes, Attending</option>
                        <option value="no">No, Declined</option>
                        <option value="maybe">Unsure / Maybe</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase' }}>Dietary / Notes</label>
                      <input type="text" value={parsedRsvpPreview.dietary || ''} onChange={e => setParsedRsvpPreview({...parsedRsvpPreview, dietary: e.target.value})} className="kb-input" />
                    </div>
                    {askAdultCount && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase' }}>Adults Count</label>
                        <input type="number" min="0" value={parsedRsvpPreview.adultsCount ?? ''} onChange={e => setParsedRsvpPreview({...parsedRsvpPreview, adultsCount: e.target.value === '' ? null : Number(e.target.value)})} className="kb-input" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => setParsedRsvpPreview(null)} className="kb-btn kb-btn-secondary">Back</button>
                    <button onClick={handleSaveParsedRsvp} className="kb-btn kb-btn-primary" style={{ background: 'var(--kb-mint)', border: 'none' }}>
                      ✓ Save to List
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && event && (
          <RsvpSettingsModal 
            event={event} 
            onClose={() => setShowSettingsModal(false)} 
            onSave={handleSaveSettings} 
          />
        )}

        {/* Edit Guest Modal */}
        {editingGuest && (
          <EditGuestModal
            guest={editingGuest}
            askAdultCount={askAdultCount}
            showParentAttendance={showParentAttendance}
            onClose={() => setEditingGuest(null)}
            onSave={handleSaveGuest}
          />
        )}

      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', background: 'var(--kb-bg)', padding: '40px 24px', fontFamily: 'var(--kb-font-body)' },
  inner: { maxWidth: 1100, margin: '0 auto' },
  
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  backBtn: { background: 'var(--kb-surface)', border: '1px solid var(--kb-border)', borderRadius: '100px', padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--kb-font-ui)', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--kb-shadow-sm)' },
  heading: { margin: 0, fontSize: 26, fontFamily: 'var(--kb-font-display)', fontWeight: 800, color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8 },
  exportBtn: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--kb-font-ui)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
  
  banner: { borderRadius: 20, padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, border: '1px solid var(--kb-border)', flexWrap: 'wrap', gap: 24 },
  bannerContent: { display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 300 },
  bannerTitle: { margin: 0, fontSize: 32, fontFamily: 'var(--kb-font-display)', fontWeight: 800, color: 'var(--kb-text)' },
  bannerDetails: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600, color: 'var(--kb-text-muted)', flexWrap: 'wrap' },
  themeTag: { background: 'rgba(6, 214, 160, 0.15)', color: 'var(--kb-mint)', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: '700' },
  invitedBox: { background: 'var(--kb-surface)', borderRadius: 16, padding: '16px 24px', textAlign: 'center', boxShadow: 'var(--kb-shadow-sm)', border: '1px solid var(--kb-border)' },
  invitedIconBg: { background: 'var(--kb-surface-2)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  invitedValue: { fontSize: 28, fontFamily: 'var(--kb-font-display)', fontWeight: 800, color: 'var(--kb-text)', lineHeight: 1 },
  invitedLabel: { fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginTop: 2 },
  
  metrics: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  
  actionBar: { background: 'var(--kb-surface)', borderRadius: 16, border: '1px solid var(--kb-border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  actionLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  actionIcon: { background: 'var(--kb-surface-2)', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  actionTitle: { fontSize: 16, fontWeight: 700, color: 'var(--kb-text)', marginBottom: 4, fontFamily: 'var(--kb-font-display)' },
  actionSub: { fontSize: 14, color: 'var(--kb-text-muted)' },
  actionRight: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  actionBtn: { background: 'var(--kb-surface)', border: '1px solid var(--kb-border)', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--kb-font-ui)', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
  
  guestSection: { background: 'var(--kb-surface)', borderRadius: 20, border: '1px solid var(--kb-border)', overflow: 'hidden', marginBottom: 24 },
  guestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--kb-border)', flexWrap: 'wrap', gap: 16 },
  guestTitle: { margin: 0, fontSize: 18, fontFamily: 'var(--kb-font-display)', fontWeight: 700, color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 12 },
  guestCount: { background: 'var(--kb-surface-2)', color: 'var(--kb-text-muted)', padding: '2px 10px', borderRadius: 100, fontSize: 13, fontFamily: 'var(--kb-font-ui)' },
  filterClearTag: { fontSize: 12, color: '#EF4444', background: '#FEE2E2', borderRadius: 100, padding: '2px 10px', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' },
  guestActions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { border: '1px solid var(--kb-input-border)', borderRadius: 12, padding: '10px 16px 10px 36px', fontSize: 14, width: 220, fontFamily: 'var(--kb-font-ui)', background: 'var(--kb-input-bg)', color: 'var(--kb-text)', outline: 'none' },
  searchIconPos: { position: 'absolute', left: 12, display: 'flex', alignItems: 'center', pointerEvents: 'none' },
  filterBtn: { background: 'var(--kb-surface)', border: '1px solid var(--kb-border)', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--kb-font-ui)', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 8 },
  
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--kb-text-muted)', background: 'var(--kb-surface-2)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--kb-border)', fontFamily: 'var(--kb-font-ui)' },
  tr: { borderBottom: '1px solid var(--kb-border)' },
  td: { padding: '18px 24px', color: 'var(--kb-text)', verticalAlign: 'middle' },
  
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner: { width: 40, height: 40, border: '3px solid var(--kb-border)', borderTopColor: 'var(--kb-coral)', borderRadius: '50%', animation: 'kb-spin 0.8s linear infinite' },
  
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 20px', position: 'relative' },
  emptyTitle: { fontSize: 24, fontFamily: 'var(--kb-font-display)', fontWeight: 800, color: 'var(--kb-text)', margin: '0 0 12px' },
  emptyBody: { fontSize: 16, color: 'var(--kb-text-muted)', margin: '0 0 24px', lineHeight: 1.6 },
  emptyActions: { display: 'flex', gap: 12, marginBottom: 24, zIndex: 1 },
  curvedArrowContainer: { position: 'relative', marginTop: 12, height: 40, width: 220, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 },
  startSharingText: { fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#8B5CF6', fontSize: 16, fontWeight: 'bold', transform: 'rotate(-5deg)' },
  
  tipBar: { background: 'rgba(245, 158, 11, 0.1)', borderRadius: 16, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, border: '1px solid rgba(245, 158, 11, 0.25)', flexWrap: 'wrap' },
  tipContent: { fontSize: 15, color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: '500' },
  tipBtn: { background: 'var(--kb-surface)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', borderRadius: 100, padding: '8px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--kb-font-ui)', display: 'flex', alignItems: 'center', gap: 6 },
  ageBreakdown: { background: 'var(--kb-surface)', borderRadius: 20, border: '1px solid var(--kb-border)', padding: '20px 24px', marginBottom: 24 },
  ageBreakdownTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 16, fontWeight: 700, color: 'var(--kb-text)', marginBottom: 14 },
  ageBreakdownList: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  agePill: { background: 'var(--kb-surface-2)', border: '1px solid var(--kb-border)', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 },
  agePillText: { fontSize: 14, fontWeight: 600, color: 'var(--kb-text)' },
  agePillCount: { background: 'var(--kb-coral)', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
};

const metricStyles = {
  card: { borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--kb-border)', transition: 'all 0.2s', cursor: 'pointer' },
  topRow: { display: 'flex', alignItems: 'center', gap: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 'bold' },
  textCol: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 14, fontWeight: 700, fontFamily: 'var(--kb-font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  value: { fontSize: 32, fontWeight: 800, fontFamily: 'var(--kb-font-display)', color: 'var(--kb-text)', lineHeight: 1, marginTop: 4 },
  bottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, marginTop: 8 },
  percent: { color: 'var(--kb-text-muted)' },
  trend: { },
};
