import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, Plus, Edit2, Trash2 } from 'lucide-react-native';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { subscribeToExpensesByTour, deleteExpense, addExpense, updateExpense } from '../../api/expenseService';
import { TYPOGRAPHY } from '../../theme/Theme';
import { format } from 'date-fns';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
});

export const TourDetailScreen = ({ route, navigation }: any) => {
  const { tourId, tourName, pricePerHead } = route.params;
  const { user, role } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !tourId) return;
    const unsubscribe = subscribeToExpensesByTour(tourId, user?.uid || '', role || '', (data: any, error: any) => {
      if (error) { Alert.alert('Database Error', error.message); setLoading(false); return; }
      setExpenses(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, role, tourId]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const result = await deleteExpense(id);
        if (!result.success) Alert.alert('Error', 'Failed to delete expense');
      }},
    ]);
  };

  const handleEdit = (expense: any) => {
    setEditingExpenseId(expense.id);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingExpenseId(null);
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const validated = expenseSchema.parse({ amount: Number(amount), description: description.trim() });
      setAddingExpense(true);
      const result = editingExpenseId
        ? await updateExpense(editingExpenseId, validated.amount, validated.description)
        : await addExpense(tourId, user?.uid || '', user?.email || '', validated.amount, validated.description);
      if (result.success) { setModalVisible(false); setAmount(''); setDescription(''); }
      else Alert.alert('Error', 'Failed to save expense');
    } catch (error) {
      if (error instanceof z.ZodError) Alert.alert('Validation Error', (error as z.ZodError).issues[0].message);
      else Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setAddingExpense(false);
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const renderExpenseItem = ({ item }: { item: any }) => {
    const d = item.createdAt?.seconds ? format(new Date(item.createdAt.seconds * 1000), 'MMM dd yyyy hh:mm a') : 'Just now';
    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseTopRow}>
          <Text style={styles.expenseName}>{item.description}</Text>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.expenseBottomRow}>
          <View>
            <Text style={styles.expenseDate}>{d}</Text>
            <Text style={styles.expenseUser}>{item.userEmail || 'Staff user'}</Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}><Edit2 color="#9CA3AF" size={18} /></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}><Trash2 color="#EF4444" size={18} /></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3D8EE8" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title} numberOfLines={1}>{tourName}</Text>
          <Text style={styles.subtitle}>All Tour Expenses</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerList', { tourId, tourName, pricePerHead })}>
          <Users color="#3D8EE8" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <LinearGradient colors={['#5B8DEE', '#3B6DD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Expenses</Text>
              <Text style={styles.heroAmount}>₹{totalAmount.toFixed(2)}</Text>
            </LinearGradient>
          </View>
        }
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No expenses logged yet.</Text></View>}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.formTitle}>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={styles.input} placeholder="e.g., Flight, Food..." placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={addingExpense}>
                {addingExpense ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{editingExpenseId ? 'UPDATE' : 'ADD EXPENSE'}</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={handleAddNew}><Plus color="#FFFFFF" size={24} /></TouchableOpacity>
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
  listHeader: { paddingHorizontal: 16, paddingTop: 8, marginBottom: 20 },
  heroCard: { borderRadius: 16, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', shadowColor: '#3B6DD9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroLabel: { fontFamily: TYPOGRAPHY.fontFamily, color: '#FFFFFF', opacity: 0.8, fontSize: 14, marginBottom: 8 },
  heroAmount: { fontFamily: TYPOGRAPHY.monospace, color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  listContainer: { paddingBottom: 100 },
  expenseCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, marginHorizontal: 16, marginBottom: 10 },
  expenseTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseName: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  expenseAmount: { fontFamily: TYPOGRAPHY.monospace, fontSize: 16, fontWeight: 'bold', color: '#3D8EE8' },
  expenseBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  expenseDate: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  expenseUser: { fontFamily: TYPOGRAPHY.fontFamilyMedium, fontSize: 12, color: '#3D8EE8' },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily, color: '#9CA3AF', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3D8EE8', justifyContent: 'center', alignItems: 'center', shadowColor: '#3D8EE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formCard: { backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  closeText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#9CA3AF', fontSize: 16 },
  inputLabel: { fontFamily: TYPOGRAPHY.fontFamilyMedium, fontSize: 14, color: '#1F2937', marginBottom: 6 },
  input: { height: 48, backgroundColor: '#FAFAFA', paddingHorizontal: 14, borderRadius: 10, fontSize: 15, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16, fontFamily: TYPOGRAPHY.fontFamily },
  submitButton: { height: 52, backgroundColor: '#3D8EE8', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
