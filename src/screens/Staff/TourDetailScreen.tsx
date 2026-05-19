import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users, ChevronDown } from 'lucide-react-native';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { subscribeToExpensesByTour, addExpense } from '../../api/expenseService';
import { TYPOGRAPHY } from '../../theme/Theme';
import { format } from 'date-fns';

const expenseSchema = z.object({ amount: z.number().positive('Amount must be positive') });

const CATEGORIES = [
  { id: 'Food', label: 'Food', emoji: '🍔' },
  { id: 'Transport', label: 'Transport', emoji: '🚗' },
  { id: 'Hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'Other', label: 'Other', emoji: '🛍️' },
];

export const TourDetailScreen = ({ route, navigation }: any) => {
  const { tourId, tourName } = route.params;
  const { user, role } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    if (!user || !tourId) return;
    const unsubscribe = subscribeToExpensesByTour(tourId, user?.uid || '', role || '', (data, error) => {
      if (error) { Alert.alert('Database Error', error.message); setLoading(false); return; }
      setExpenses(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, role, tourId]);

  const handleAddExpense = async () => {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Validation Error', 'Amount must be a positive number.');
    setAddingExpense(true);
    const result = await addExpense(tourId, user?.uid || '', user?.email || '', amt, category.label);
    if (result.success) { setAmount(''); Alert.alert('Success', 'Expense submitted!'); }
    else Alert.alert('Error', 'Failed to add expense');
    setAddingExpense(false);
  };

  const getEmoji = (desc: string) => CATEGORIES.find(c => c.label.toLowerCase() === desc.toLowerCase())?.emoji || '📝';

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3D8EE8" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>{tourName}</Text>
          <Text style={styles.subtitle}>My Expenses</Text>
        </View>
        <Users color="#3D8EE8" size={24} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          <View style={styles.addCard}>
            <Text style={styles.addHeading}>Add Expense for {tourName}</Text>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput style={styles.input} placeholder="Amount (₹)" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <Text style={styles.inputLabel}>Description</Text>
            <TouchableOpacity style={styles.dropdownBtn} activeOpacity={0.8} onPress={() => setDropdownOpen(!dropdownOpen)}>
              <Text style={styles.dropdownBtnText}>{category.emoji}   {category.label}</Text>
              <ChevronDown color="#6B7280" size={20} />
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.dropdownItem} onPress={() => { setCategory(cat); setDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>{cat.emoji}   {cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddExpense} disabled={addingExpense}>
              {addingExpense ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>+ Submit</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.listHeading}>My Recent Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>You haven't logged any expenses yet.</Text>
          ) : expenses.map(item => {
            const d = item.createdAt?.seconds ? format(new Date(item.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'Just now';
            return (
              <View key={item.id} style={styles.expenseCard}>
                <View style={styles.emojiContainer}><Text style={styles.emojiText}>{getEmoji(item.description)}</Text></View>
                <View style={styles.expenseMiddle}>
                  <Text style={styles.expenseName}>{item.description}</Text>
                  <Text style={styles.expenseDate}>{d}</Text>
                </View>
                <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 80 },
  addCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 24 },
  addHeading: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  inputLabel: { fontFamily: TYPOGRAPHY.fontFamilyMedium, fontSize: 13, color: '#6B7280', marginBottom: 6 },
  input: { height: 48, backgroundColor: '#FAFAFA', paddingHorizontal: 14, borderRadius: 10, fontSize: 15, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16, fontFamily: TYPOGRAPHY.fontFamily },
  dropdownBtn: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 16 },
  dropdownBtnText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 15, color: '#1F2937' },
  dropdownMenu: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', padding: 6, marginBottom: 16, gap: 4 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  dropdownItemText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 15, color: '#1F2937' },
  submitBtn: { backgroundColor: '#3D8EE8', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  listHeading: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  expenseCard: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emojiContainer: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emojiText: { fontSize: 20 },
  expenseMiddle: { flex: 1 },
  expenseName: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  expenseDate: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF' },
  expenseAmount: { fontFamily: TYPOGRAPHY.monospace, fontSize: 16, fontWeight: 'bold', color: '#3D8EE8' },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily, color: '#9CA3AF', fontSize: 15, textAlign: 'center', paddingVertical: 20 },
});
