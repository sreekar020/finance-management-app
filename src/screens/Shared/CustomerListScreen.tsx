import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToCustomersByTour } from '../../api/customerService';
import { TYPOGRAPHY } from '../../theme/Theme';

const EMOJIS = ['✈️', '🎒', '🏕️', '🏖️', '🗺️', '⛰️', '🚢', '🚆', '🏜️'];

export const CustomerListScreen = ({ route, navigation }: any) => {
  const { tourId, tourName, pricePerHead } = route.params;
  const { role } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCustomersByTour(tourId, (data, error) => {
      if (!error && data) setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tourId]);

  const renderCustomerCard = ({ item, index }: { item: any; index: number }) => {
    const travelerText = item.membersCount === 1 ? 'Solo Traveler' : `${item.membersCount} Travelers`;
    const emoji = EMOJIS[index % EMOJIS.length];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CustomerDetail', { customer: item, tourName })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.customerName}>{item.headMemberName || 'Unknown Group'}</Text>
            <Text style={styles.travelerText}>{travelerText}</Text>
          </View>
          <ChevronRight color="#D1D5DB" size={20} />
        </View>

        <View style={styles.divider} />

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>₹{Number(item.totalAmount).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Paid</Text>
            <Text style={[styles.statValue, { color: '#9CA3AF' }]}>
              ₹{Number(item.paidAmount).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Due</Text>
            <Text style={[styles.statValue, { color: '#EF4444', fontSize: 18 }]}>
              ₹{Number(item.dueAmount).toLocaleString('en-IN')}
            </Text>
          </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{tourName}</Text>
          <Text style={styles.subtitle}>Customers & Bookings</Text>
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No customers booked for this tour.</Text>
          </View>
        }
      />

      {role === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddCustomer', { tourId, tourName, pricePerHead })}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
      )}
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
  backBtn: { marginRight: 12, padding: 4 },
  headerTitleContainer: { flex: 1 },
  title: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 13, color: '#9CA3AF', marginTop: 2 },
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
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 20 },
  nameContainer: { flex: 1 },
  customerName: { fontFamily: TYPOGRAPHY.fontFamilyBold, fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  travelerText: { fontFamily: TYPOGRAPHY.fontFamily, fontSize: 12, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  statsContainer: { gap: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontFamily: TYPOGRAPHY.fontFamilyMedium, fontSize: 12, color: '#6B7280' },
  statValue: { fontFamily: TYPOGRAPHY.monospace, fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
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
