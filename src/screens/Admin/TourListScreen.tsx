import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Plus, Edit2, Trash2, Users } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTours, deleteTour } from '../../api/tourService';
import { TYPOGRAPHY } from '../../theme/Theme';
import { format } from 'date-fns';
import { Tour } from '../../types';

export const TourListScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTours((data, error) => {
      if (!error) setTours(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Tour',
      `Are you sure you want to delete "${name}"? This will delete all customers, members, and payments!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTour(id);
            if (!result.success) Alert.alert('Error', 'Failed to delete tour.');
          },
        },
      ]
    );
  };

  const renderTourCard = ({ item }: { item: Tour }) => {
    const formattedDate = item.createdAt?.seconds
      ? format(new Date(item.createdAt.seconds * 1000), 'MMM dd yyyy')
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('TourDetail', {
            tourId: item.id,
            tourName: item.name,
            pricePerHead: item.pricePerHead,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.tourName}>{item.name}</Text>
            {formattedDate ? <Text style={styles.tourDate}>Created: {formattedDate}</Text> : null}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EditTour', {
                  tourId: item.id,
                  currentName: item.name,
                  currentPrice: item.pricePerHead,
                })
              }
              style={styles.actionBtn}
            >
              <Edit2 color="#3D8EE8" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.name)}
              style={styles.actionBtn}
            >
              <Trash2 color="#EF4444" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.passengerRow}>
          <Users color="#3D8EE8" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.passengerText}>{item.passengerCount || 0} Passengers</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D8EE8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Admin Tours</Text>
          <Text style={styles.subtitle}>Manage all tours & expenses</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut color="#EF4444" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={renderTourCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tours created yet.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTour')}>
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitles: { flex: 1 },
  title: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  logoutBtn: { padding: 6 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { flex: 1, paddingRight: 8 },
  tourName: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  tourDate: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { padding: 2 },
  passengerRow: { flexDirection: 'row', alignItems: 'center' },
  passengerText: { fontFamily: TYPOGRAPHY.fontFamilyBold, color: '#3D8EE8', fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily, color: '#9CA3AF', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3D8EE8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3D8EE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
