import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Expense, UserRole } from '../types';

const EXPENSES_COLLECTION = 'expenses';
const USERS_COLLECTION = 'users';

// Subscribe to expenses for a SPECIFIC TOUR
export const subscribeToExpensesByTour = (tourId: string, userId: string, role: UserRole | string, callback: (expenses: Expense[] | null, error: any) => void) => {
  let q;
  const expensesRef = collection(db, EXPENSES_COLLECTION);
  
  if (role === 'admin') {
    // Admin gets all expenses for this tour
    q = query(expensesRef, where('tourId', '==', tourId));
  } else {
    // Staff gets only their expenses for this tour
    q = query(expensesRef, where('tourId', '==', tourId), where('userId', '==', userId));
  }

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Expense, 'id'>)
    })) as Expense[];
    
    // Sort locally to ensure latest first without requiring a specific composite index
    expenses.sort((a, b) => {
      const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return timeB - timeA;
    });

    callback(expenses, null);
  }, (error) => {
    console.error("Snapshot error:", error);
    callback(null, error);
  });
};

export const addExpense = async (tourId: string, userId: string, userEmail: string, amount: string | number, description: string) => {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      tourId,
      userId,
      userEmail,
      amount: Number(amount),
      description: description.trim(),
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { success: false, error };
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error };
  }
};

export const updateExpense = async (expenseId: string, amount: string | number, description: string) => {
  try {
    const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await updateDoc(expenseRef, {
      amount: Number(amount),
      description: description.trim()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error };
  }
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};
