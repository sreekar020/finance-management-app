import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, User, Star, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMembersByCustomer } from '../../api/memberService';
import { subscribeToPaymentsByCustomer, addPayment, deletePayment } from '../../api/paymentService';
import { TYPOGRAPHY } from '../../theme/Theme';
import { format } from 'date-fns';

export const CustomerDetailScreen = ({ route, navigation }: any) => {
  const { customer, tourName } = route.params;
  const { user, role } = useAuth();

  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentPaid, setCurrentPaid] = useState(customer.paidAmount || 0);
  const [currentDue, setCurrentDue] = useState(customer.dueAmount || 0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const unsubMembers = subscribeToMembersByCustomer(customer.id, (data) => {
      if (data) setMembers(data);
    });
    const unsubPayments = subscribeToPaymentsByCustomer(customer.id, (data) => {
      if (data) {
        setPayments(data);
        const totPaid = data.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        setCurrentPaid(totPaid);
        setCurrentDue(customer.totalAmount - totPaid);
      }
    });
    return () => { unsubMembers(); unsubPayments(); };
  }, [customer.id, customer.totalAmount]);

  const handleAddPayment = async () => {
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Invalid Input', 'Please enter a valid amount.');
    if (amt > currentDue) return Alert.alert('Invalid Amount', 'Payment cannot exceed due amount.');
    if (!receiverName.trim()) return Alert.alert('Invalid Input', 'Receiver name is required.');
    if (mode === 'online' && !receiverPhone.trim())
      return Alert.alert('Invalid Input', 'Receiver phone required for online payments.');
    setPaying(true);
    const result = await addPayment(
      customer.id, amt, mode, receiverName, receiverPhone,
      currentDue, currentPaid, user?.email || user?.uid || ''
    );
    if (result.success) {
      setPaymentAmount(''); setMode('cash'); setReceiverName(''); setReceiverPhone('');
      Alert.alert('Success', 'Payment recorded!');
    } else {
      Alert.alert('Error', (result.error as any)?.message || 'Failed to add payment.');
    }
    setPaying(false);
  };

  const handleDeletePayment = (paymentId: string, amount: number) => {
    Alert.alert('Delete Payment', `Delete payment of ₹${amount}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const result = await deletePayment(paymentId, customer.id, amount);
          if (!result.success) Alert.alert('Error', 'Failed to delete payment.');
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{customer.headMemberName}'s Group</Text>
          <Text style={styles.subtitle}>{tourName}</Text>
        </View>
        <Users color="#3D8EE8" size={24} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          <LinearGradient colors={['#5B8DEE', '#3B6DD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Total Package</Text>
              <Text style={styles.sumValue}>₹{customer.totalAmount}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Paid Amount</Text>
              <Text style={styles.sumValue}>₹{currentPaid}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={[styles.sumRow, { marginBottom: 0 }]}>
              <Text style={styles.sumLabelDue}>Due Amount</Text>
              <Text style={styles.sumValueDue}>₹{currentDue}</Text>
            </View>
          </LinearGradient>

          {currentDue > 0 && (
            <View style={styles.payCard}>
              <Text style={styles.cardTitle}>Add Payment</Text>
              <TextInput style={styles.payInput} placeholder={`Amount (Max: ₹${currentDue})`} placeholderTextColor="#9CA3AF" keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount} />
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, mode === 'cash' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setMode('cash')}>
                  <Text style={[styles.toggleText, mode === 'cash' ? styles.toggleTextActive : styles.toggleTextInactive]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, mode === 'online' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setMode('online')}>
                  <Text style={[styles.toggleText, mode === 'online' ? styles.toggleTextActive : styles.toggleTextInactive]}>Online</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.payInput} placeholder={mode === 'cash' ? 'Receiver Name (Collector)' : 'Receiver Name'} placeholderTextColor="#9CA3AF" value={receiverName} onChangeText={setReceiverName} />
              {mode === 'online' && (
                <TextInput style={[styles.payInput, { marginTop: 0 }]} placeholder="Receiver Phone" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={receiverPhone} onChangeText={setReceiverPhone} />
              )}
              <TouchableOpacity onPress={handleAddPayment} disabled={paying} style={styles.payBtn}>
                {paying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Pay</Text>}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <View style={styles.membersCard}>
            {members.map((m, index) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}><User color="#FFF" size={20} /></View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberMeta}>{m.age} yrs • {m.gender.toUpperCase()}</Text>
                </View>
                {m.id === customer.headMemberId && (
                  <LinearGradient colors={['#5B8DEE', '#3B6DD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headBadge}>
                    <Star color="#FFF" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.headBadgeText}>Head</Text>
                  </LinearGradient>
                )}
                {index < members.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments made yet.</Text>
          ) : payments.map((p) => {
            const d = p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'MMM dd yyyy hh:mm a') : 'Just now';
            return (
              <View key={p.id} style={styles.paymentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.payDate}>{d}</Text>
                  <Text style={styles.payMeta}>{p.mode === 'online' ? 'Online' : 'Cash'} • {p.receiverName}</Text>
                </View>
                {(role === 'admin' || role === 'manager') && (
                  <TouchableOpacity onPress={() => handleDeletePayment(p.id, p.amount)} style={{ padding: 6 }}>
                    <Trash2 color="#EF4444" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 14, color: '#9CA3AF', marginTop: 2 },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 80 },
  summaryCard: { paddingHorizontal: 22, paddingVertical: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#3B6DD9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sumLabel: { fontFamily: TYPOGRAPHY.fontFamily, color: '#FFFFFF', opacity: 0.9, fontSize: 14 },
  sumValue: { fontFamily: TYPOGRAPHY.monospace, color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  sumLabelDue: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  sumValueDue: { fontFamily: TYPOGRAPHY.monospace, color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  payCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  cardTitle: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  payInput: { height: 48, backgroundColor: '#FAFAFA', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 15, color: '#1F2937', fontFamily: TYPOGRAPHY.fontFamily, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  toggleBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  toggleActive: { backgroundColor: '#EBF4FF', borderColor: '#3D8EE8', borderWidth: 2 },
  toggleInactive: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  toggleText: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 15 },
  toggleTextActive: { color: '#3D8EE8' },
  toggleTextInactive: { color: '#6B7280' },
  payBtn: { backgroundColor: '#3D8EE8', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  payBtnText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  membersCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 4, marginBottom: 20 },
  memberRow: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, position: 'relative' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  memberMeta: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  headBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  headBadgeText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  rowDivider: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 1, backgroundColor: '#F3F4F6' },
  paymentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  payAmount: { fontFamily: TYPOGRAPHY.monospace, fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  payDate: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  payMeta: { fontFamily: TYPOGRAPHY.fontFamilyMedium, fontSize: 12, color: '#3D8EE8' },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily, color: '#9CA3AF', fontSize: 15, paddingVertical: 20, textAlign: 'center' },
});
