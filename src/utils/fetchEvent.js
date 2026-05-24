// src/utils/fetchEvent.js
// Resolves an event document from Firestore by slug
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function fetchEventBySlug(slug) {
  if (!slug) return null;
  const q = query(
    collection(db, 'events'),
    where('slug', '==', slug),
    where('published', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}
