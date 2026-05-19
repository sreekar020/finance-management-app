import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { COLORS, SPACE, ROUNDING, SHADOWS } from '../theme/Theme';

export const ExpenseCard = ({ expense, isAdmin, onDelete, onEdit }: any) => {
  // Format date safely
  const formattedDate = expense.createdAt?.seconds 
    ? format(new Date(expense.createdAt.seconds * 1000), 'MMM dd, yyyy')
    : 'Pending sync...';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Text style={styles.description} numberOfLines={2}>
              {expense.description}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
            {isAdmin && (expense.userEmail || expense.userId) && (
              <Text style={styles.userBadge}>Paid by: {expense.userEmail || expense.userId.substring(0, 8)}</Text>
            )}
          </View>
          
          <View style={styles.rightContent}>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>₹{expense.amount?.toFixed(2)}</Text>
            </View>
            
            {isAdmin && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => onEdit && onEdit(expense)} style={styles.textBtn}>
                  <Text style={styles.textBtnLabel}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete && onDelete(expense.id)} style={styles.textBtn}>
                  <Text style={[styles.textBtnLabel, { color: COLORS.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: SPACE.sm,
    marginHorizontal: SPACE.md,
    borderRadius: ROUNDING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: ROUNDING.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    marginRight: SPACE.md,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  date: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  userBadge: {
    marginTop: SPACE.xs,
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACE.sm,
    gap: SPACE.md,
  },
  textBtn: {
    paddingVertical: 4,
  },
  textBtnLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold'
  }
});
