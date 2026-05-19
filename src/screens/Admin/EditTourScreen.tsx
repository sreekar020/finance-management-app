import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { updateTour } from '../../api/tourService';
import { COLORS, SPACE, ROUNDING } from '../../theme/Theme';
import { z } from 'zod';

const tourSchema = z.object({
  name: z.string().min(3, "Tour name must be at least 3 characters long"),
  pricePerHead: z.number().positive("Price must be greater than 0")
});

export const EditTourScreen = ({ route, navigation }) => {
  const { tourId, currentName, currentPrice } = route.params;
  const [name, setName] = useState(currentName || '');
  const [pricePerHead, setPricePerHead] = useState(currentPrice ? String(currentPrice) : '');
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleUpdate = async () => {
    setErrors({});
    const parsedPrice = Number(pricePerHead);
    
    const validationResult = tourSchema.safeParse({
      name: name.trim(),
      pricePerHead: isNaN(parsedPrice) ? 0 : parsedPrice
    });

    if (!validationResult.success) {
      const formattedErrors = {};
      validationResult.error.errors.forEach(err => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setUpdating(true);
    const result = await updateTour(tourId, validationResult.data.name, validationResult.data.pricePerHead);
    if (result.success) {
      Alert.alert("Success", "Tour updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert("Error", "Failed to update tour.");
    }
    setUpdating(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.label}>Tour Name</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="e.g. Summer Vacation 2026"
        placeholderTextColor={COLORS.textLight}
        value={name}
        onChangeText={setName}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      
      <Text style={styles.label}>Price Per Head (₹)</Text>
      <TextInput
        style={[styles.input, errors.pricePerHead && styles.inputError, { marginBottom: errors.pricePerHead ? SPACE.xs : SPACE.lg }]}
        placeholder="e.g. 500"
        placeholderTextColor={COLORS.textLight}
        value={pricePerHead}
        onChangeText={setPricePerHead}
        keyboardType="numeric"
      />
      {errors.pricePerHead && <Text style={[styles.errorText, { marginBottom: SPACE.lg }]}>{errors.pricePerHead}</Text>}

      <TouchableOpacity onPress={handleUpdate} disabled={updating} style={styles.btn}>
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGradient}>
          {updating ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Update Tour</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACE.xl, backgroundColor: COLORS.white },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: SPACE.sm },
  input: {
    backgroundColor: '#f8fafc', padding: SPACE.md, borderRadius: ROUNDING.md,
    fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: SPACE.lg
  },
  inputError: { borderColor: COLORS.danger, marginBottom: SPACE.xs },
  errorText: { color: COLORS.danger, fontSize: 12, marginBottom: SPACE.md },
  btn: { borderRadius: ROUNDING.md, overflow: 'hidden' },
  btnGradient: { padding: SPACE.md, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});
