import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import CategoryEditModal from '../components/CategoryEditModal';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { getCategories } from '../api/categoryService';
import supabase from '../api/supabase';
import { getCurrentUserId } from '../api/queryUtils';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ onOpenTutorial }) {
  const { user, signOut } = useAuth();
  const { showChecklist } = useOnboarding();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [currency] = useState('IDR');

  useEffect(() => {
    loadCategories();
  }, []);

  const categorySummary = useMemo(() => {
    const totalBudget = categories.reduce((sum, category) => sum + (category.budget_amount || 0), 0);
    const topCategory = categories.reduce((highest, current) => {
      if (!highest || (current.priority || 0) > (highest.priority || 0)) {
        return current;
      }
      return highest;
    }, null);

    return {
      count: categories.length,
      totalBudget,
      topCategory,
    };
  }, [categories]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryModalVisible(true);
  };

  const handleCategoryModalClose = async () => {
    setCategoryModalVisible(false);
    setSelectedCategory(null);
    await loadCategories();
  };

  const handleExportData = async () => {
    try {
      const userId = await getCurrentUserId();
      setIsExporting(true);

      const { data: expenses, error: expenseError } = await supabase
        .from('daily_expenses')
        .select(`
          *,
          budget_categories (name, color)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (expenseError) throw expenseError;

      let csvContent = 'Date,Category,Amount,Note,Month\n';
      (expenses || []).forEach((exp) => {
        const date = exp.date;
        const category = exp.budget_categories?.name || 'Unknown';
        const amount = exp.amount;
        const note = exp.note?.replace(/,/g, ';') || '';
        const month = date.substring(0, 7);
        csvContent += `"${date}","${category}","${amount}","${note}","${month}"\n`;
      });

      const fileName = `budget_flow_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Success', `Data exported to ${fileName}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePassword = () => {
    if (Platform.OS !== 'ios' || typeof Alert.prompt !== 'function') {
      Alert.alert(
        'Password Change',
        'Password change from this screen is currently supported on iOS only.'
      );
      return;
    }

    Alert.prompt(
      'Change Password',
      'Enter new password (min 6 characters)',
      [
        { text: 'Cancel' },
        {
          text: 'Change',
          onPress: async (password) => {
            if (!password || password.length < 6) {
              Alert.alert('Error', 'Password must be at least 6 characters');
              return;
            }

            try {
              const { error } = await supabase.auth.updateUser({
                password,
              });

              if (error) throw error;
              Alert.alert('Success', 'Password changed');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleOpenTutorial = async () => {
    try {
      await showChecklist();
      if (onOpenTutorial) {
        onOpenTutorial();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAccentTop} />
          <View style={styles.heroAccentBottom} />
          <Text style={styles.heroEyebrow}>Settings</Text>
          <Text style={styles.heroTitle}>Biar app ini terasa makin pas dengan ritmemu.</Text>
          <Text style={styles.heroMeta}>
            {categorySummary.count} kategori aktif dengan total budget Rp{' '}
            {categorySummary.totalBudget.toLocaleString('id-ID')}
          </Text>
          <Text style={styles.heroHint}>
            {categorySummary.topCategory
              ? `Prioritas tertinggi sekarang: ${categorySummary.topCategory.name}`
              : 'Belum ada kategori yang aktif. Tambah satu supaya tracking lebih rapi.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>{user?.email || 'Unknown user'}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleChangePassword}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingHint}>Jaga akunmu tetap aman dan mudah diingat.</Text>
              </View>
              <Text style={styles.settingAction}>Open</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
              <View style={styles.rowText}>
                <Text style={[styles.settingLabel, styles.dangerText]}>Logout</Text>
                <Text style={styles.settingHint}>Keluar dari device ini kapan saja.</Text>
              </View>
              <Text style={[styles.settingAction, styles.dangerText]}>Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingHint}>Placeholder preferensi reminder untuk device ini.</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.borderStrong, true: colors.primarySoft }}
                thumbColor={notifications ? colors.primary : colors.surface}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleOpenTutorial}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Lihat Tutorial Lagi</Text>
                <Text style={styles.settingHint}>Buka onboarding dan tampilkan starter checklist lagi.</Text>
              </View>
              <Text style={styles.settingAction}>Open</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingHint}>Format nominal yang dipakai di seluruh app.</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currency}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.rowText}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.sectionSubtitle}>Tap category untuk edit budget, warna, atau priority.</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <TouchableOpacity style={styles.emptyCategoryCard} onPress={handleAddCategory}>
              <Image source={illustrationAssets.emptyCategory} style={styles.emptyCategoryImage} resizeMode="contain" />
              <Text style={styles.emptyCategoryTitle}>Belum ada kategori aktif</Text>
              <Text style={styles.emptyCategorySubtitle}>
                Tambah kategori pertamamu supaya expense bisa lebih cepat diorganisir.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.categoriesList}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, index === categories.length - 1 && styles.categoryItemLast]}
                  onPress={() => handleEditCategory(cat)}
                >
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDotWrap, { backgroundColor: `${cat.color}22` }]}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryBudget}>
                        Rp {cat.budget_amount.toLocaleString('id-ID')} | Priority {cat.priority || 3}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.settingAction}>Edit</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.settingRow, isExporting && styles.buttonDisabled]}
              onPress={handleExportData}
              disabled={isExporting}
            >
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>Export Expenses (CSV)</Text>
                <Text style={styles.settingHint}>Unduh salinan transaksi untuk dibagikan atau dicek lagi.</Text>
              </View>
              <Text style={styles.settingAction}>{isExporting ? 'Working...' : 'Export'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.rowText}>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingHint}>Current local build</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{APP_VERSION}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <CategoryEditModal
        visible={categoryModalVisible}
        onClose={handleCategoryModalClose}
        onSave={handleCategoryModalClose}
        category={selectedCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  heroCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroAccentTop: {
    position: 'absolute',
    top: -24,
    right: -12,
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
  },
  heroAccentBottom: {
    position: 'absolute',
    bottom: -34,
    left: -18,
    width: 110,
    height: 110,
    borderRadius: borderRadius.full,
    backgroundColor: colors.skySoft,
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroMeta: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  heroHint: {
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowText: {
    flex: 1,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  settingValue: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  settingHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  settingAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  dangerText: {
    color: colors.error,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  addBtn: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoriesList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemLast: {
    borderBottomWidth: 0,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryDotWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  categoryName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryBudget: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  emptyCategoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCategoryImage: {
    width: '100%',
    height: 180,
    marginBottom: spacing.md,
  },
  emptyCategoryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCategorySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
