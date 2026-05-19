import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Member } from '../types';

const MEMBERS_COLLECTION = 'members';

export const subscribeToMembersByCustomer = (customerId: string, callback: (members: Member[] | null, error: any) => void) => {
  const q = query(collection(db, MEMBERS_COLLECTION), where('customerId', '==', customerId));
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Member, 'id'>) })) as Member[];
    callback(members, null);
  }, error => callback(null, error));
};
