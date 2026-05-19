import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  role: UserRole;
}

export interface Tour {
  id: string;
  name: string;
  pricePerHead: number;
  passengerCount: number;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface Customer {
  id: string;
  tourId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  paidAmount: number;
  createdAt: Timestamp | null;
}

export interface Member {
  id: string;
  customerId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  createdAt: Timestamp | null;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  recordedBy: string;
  createdAt: Timestamp | null;
}

export interface Expense {
  id: string;
  tourId: string;
  userId: string;
  userEmail: string;
  amount: number;
  description: string;
  createdAt: Timestamp | null;
}
