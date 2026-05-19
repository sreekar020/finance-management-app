import { collection, addDoc, onSnapshot, query, where, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Payment } from '../types';

const PAYMENTS_COLLECTION = 'payments';
const CUSTOMERS_COLLECTION = 'customers';

export const subscribeToPaymentsByCustomer = (customerId: string, callback: (payments: Payment[] | null, error: any) => void) => {
  const q = query(collection(db, PAYMENTS_COLLECTION), where('customerId', '==', customerId));
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Payment, 'id'>) })) as Payment[];
    payments.sort((a,b) => {
      const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return timeB - timeA;
    });
    callback(payments, null);
  }, error => callback(null, error));
};

export const addPayment = async (customerId: string, amount: number | string, mode: string, receiverName: string, receiverPhone: string, currentDue: number, currentPaid: number, addedByEmail: string) => {
  try {
    const payAmt = Number(amount);
    if (payAmt <= 0) return { success: false, error: "Payment must be positive" };
    
    // Batch to ensure consistency
    const batch = writeBatch(db);
    
    // 1. Payment doc
    const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
    
    const paymentData: any = {
      customerId,
      amount: payAmt,
      mode: mode || 'cash',
      receiverName: receiverName || '',
      addedBy: addedByEmail,
      createdAt: serverTimestamp()
    };
    
    if (mode === 'online') {
      paymentData.receiverPhone = receiverPhone || '';
    }

    batch.set(paymentRef, paymentData);

    // 2. Update customer doc
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    batch.update(customerRef, {
      paidAmount: currentPaid + payAmt,
      dueAmount: currentDue - payAmt
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("Error adding payment", error);
    return { success: false, error };
  }
};

export const deletePayment = async (paymentId: string, customerId: string, amount: number | string) => {
  try {
    const payAmt = Number(amount);
    const batch = writeBatch(db);
    
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    batch.delete(paymentRef);
    
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    batch.update(customerRef, {
      paidAmount: increment(-payAmt),
      dueAmount: increment(payAmt)
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment", error);
    return { success: false, error };
  }
};
