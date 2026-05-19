import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { createTour } from '../../api/tourService';
import { TYPOGRAPHY } from '../../theme/Theme';
import { z } from 'zod';

const tourSchema = z.object({
  name: z.string().min(3, 'Tour name must be at least 3 characters long'),
  pricePerHead: z.number().positive('Price must be greater than 0'),
});

export const CreateTourScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [pricePerHead, setPricePerHead] = useState('');
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    setErrors({});
    const parsedPrice = Number(pricePerHead);
    const validationResult = tourSchema.safeParse({ name: name.trim(), pricePerHead: isNaN(parsedPrice) ? 0 : parsedPrice });
    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: z.ZodIssue) => { formattedErrors[err.path[0] as string] = err.message; });
      setErrors(formattedErrors);
      return;
    }
    setCreating(true);
    const result = await createTour(validationResult.data.name, validationResult.data.pricePerHead, user?.uid || '');
    if (result.success) navigation.goBack();
    else Alert.alert('Error', 'Failed to create tour.');
    setCreating(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Tour</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.label}>Tour Name</Text>
            <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="e.g. Summer Vacation 2026" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            <View style={{ height: 16 }} />
            <Text style={styles.label}>Price Per Head (₹)</Text>
            <View style={[styles.prefixRow, errors.pricePerHead && styles.inputError]}>
              <Text style={styles.prefixSymbol}>₹</Text>
              <TextInput style={styles.prefixInput} placeholder="e.g. 500" placeholderTextColor="#9CA3AF" value={pricePerHead} onChangeText={setPricePerHead} keyboardType="numeric" />
            </View>
            {errors.pricePerHead && <Text style={styles.errorText}>{errors.pricePerHead}</Text>}
            <View style={{ height: 24 }} />
            <TouchableOpacity onPress={handleCreate} disabled={creating} style={styles.createBtn}>
              {creating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Create Tour</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 24 },
  label: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  input: { height: 48, backgroundColor: '#FAFAFA', paddingHorizontal: 14, borderRadius: 10, fontSize: 15, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB', fontFamily: TYPOGRAPHY.fontFamily },
  prefixRow: { height: 48, backgroundColor: '#FAFAFA', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  prefixSymbol: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 18, fontWeight: 'bold', color: '#3D8EE8', marginRight: 8 },
  prefixInput: { flex: 1, height: '100%', fontSize: 15, color: '#1F2937', fontFamily: TYPOGRAPHY.fontFamily },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontFamily: TYPOGRAPHY.fontFamily, color: '#EF4444', fontSize: 12, marginTop: 4 },
  createBtn: { height: 52, backgroundColor: '#3D8EE8', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  createBtnText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
