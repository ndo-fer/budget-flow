import React from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import BudgetVsActualScreen from '../screens/BudgetVsActualScreen';
import IncomeTrackingScreen from '../screens/IncomeTrackingScreen';
import RecurringExpensesScreen from '../screens/RecurringExpensesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductScreen from '../screens/ProductScreen';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { useAuth } from '../context/AuthContext';
import { brandAssets, profileAssets, statusAssets } from '../constants/assets';

const MOBILE_TABS = [
  { key: 'home', label: 'Home', short: 'HM' },
  { key: 'budget', label: 'Budget', short: 'BG' },
  { key: 'income', label: 'Income', short: 'IN' },
  { key: 'history', label: 'History', short: 'HS' },
  { key: 'recurring', label: 'Repeat', short: 'RP' },
  { key: 'catalog', label: 'Shop', short: 'SP' },
  { key: 'settings', label: 'Settings', short: 'ST' },
];

const WEB_TABS = [
  { key: 'home', label: 'Home', short: 'HM' },
  { key: 'budget', label: 'Budget', short: 'BG' },
  { key: 'income', label: 'Income', short: 'IN' },
  { key: 'history', label: 'History', short: 'HS' },
  { key: 'recurring', label: 'Repeat', short: 'RP' },
  { key: 'catalog', label: 'Shop', short: 'SP' },
];

const isWeb = Platform.OS === 'web';

export default function MainTabNavigator({ onOpenTutorial }) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = React.useState('home');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);

  const renderScreen = () => {
    if (activeTab === 'home') return <HomeScreen onNavigateTab={setActiveTab} />;
    if (activeTab === 'budget') return <BudgetVsActualScreen />;
    if (activeTab === 'income') return <IncomeTrackingScreen />;
    if (activeTab === 'history') return <ExpenseHistoryScreen />;
    if (activeTab === 'recurring') return <RecurringExpensesScreen />;
    if (activeTab === 'catalog') return <ProductScreen />;
    if (activeTab === 'settings') return <SettingsScreen onOpenTutorial={onOpenTutorial} />;
    return <HomeScreen onNavigateTab={setActiveTab} />;
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false);
    Alert.alert('Edit Profile', 'Profile editing belum dibuat. Untuk sekarang kita bisa arahkan perubahan akun lewat Settings.');
  };

  const financialStatus = activeTab === 'budget' || activeTab === 'history' ? 'Watch' : 'Healthy';
  const financialStatusColor = financialStatus === 'Healthy' ? colors.teal : financialStatus === 'Watch' ? colors.mango : colors.expense;
  const financialStatusAsset = financialStatus === 'Healthy' ? statusAssets.healthy : financialStatus === 'Watch' ? statusAssets.watch : statusAssets.alert;
  const profileLabel = user?.email || 'Profile';

  if (!isWeb) {
    return (
      <View style={styles.container}>
        {renderScreen()}

        <View style={styles.tabShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {MOBILE_TABS.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
                      {tab.short}
                    </Text>
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.webShell}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brandBlock}>
            <Image source={brandAssets.logoHorizontal} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandEyebrow}>Budget Flow</Text>
            <Text style={styles.brandTitle}>Daily finance companion</Text>
          </View>

          <View style={styles.webNavList}>
            {WEB_TABS.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.webNavItem, isActive && styles.webNavItemActive]}
                  onPress={() => {
                    setIsProfileMenuOpen(false);
                    setActiveTab(tab.key);
                  }}
                >
                  <View style={[styles.webNavBadge, isActive && styles.webNavBadgeActive]}>
                    <Text style={[styles.webNavBadgeText, isActive && styles.webNavBadgeTextActive]}>
                      {tab.short}
                    </Text>
                  </View>
                  <Text style={[styles.webNavLabel, isActive && styles.webNavLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.profileArea}>
          <TouchableOpacity
            style={styles.profileTrigger}
            onPress={() => setIsProfileMenuOpen((current) => !current)}
          >
            <View style={styles.avatarCircle}>
              <Image source={profileAssets.avatarPlaceholder} style={styles.avatarImage} resizeMode="cover" />
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName} numberOfLines={1}>{profileLabel}</Text>
              <Text style={styles.profileHint}>Open account menu</Text>
            </View>
          </TouchableOpacity>

          {isProfileMenuOpen ? (
            <View style={styles.profileMenu}>
              <View style={styles.profileMenuHeader}>
                <View style={styles.avatarCircleLarge}>
                  <Image source={profileAssets.avatarPlaceholder} style={styles.avatarImageLarge} resizeMode="cover" />
                </View>
                <View style={styles.profileMenuCopy}>
                  <Text style={styles.profileMenuName} numberOfLines={1}>{profileLabel}</Text>
                  <Text style={styles.profileMenuEmail}>Budget Flow account</Text>
                </View>
              </View>

              <View style={[styles.statusPill, { backgroundColor: `${financialStatusColor}22` }]}>
                <Image source={financialStatusAsset} style={styles.statusIcon} resizeMode="contain" />
                <Text style={[styles.statusText, { color: financialStatusColor }]}>{financialStatus}</Text>
              </View>

              <TouchableOpacity style={styles.profileMenuItem} onPress={handleEditProfile}>
                <Text style={styles.profileMenuItemText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setIsProfileMenuOpen(false);
                  setActiveTab('settings');
                }}
              >
                <Text style={styles.profileMenuItemText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileMenuItem} onPress={handleLogout}>
                <Text style={[styles.profileMenuItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.webContent}
        onPress={() => {
          if (isProfileMenuOpen) {
            setIsProfileMenuOpen(false);
          }
        }}
      >
        {renderScreen()}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabShell: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tabBar: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  tab: {
    minWidth: 82,
    minHeight: 68,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  activeTab: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.primarySoft,
  },
  tabBadge: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  activeTabBadge: {
    backgroundColor: colors.primary,
  },
  tabBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  activeTabBadgeText: {
    color: colors.surface,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  activeLabel: {
    color: colors.text,
  },
  webShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 248,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  brandBlock: {
    marginBottom: spacing.xl,
  },
  brandLogo: {
    width: 150,
    height: 48,
    marginBottom: spacing.sm,
  },
  brandEyebrow: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  webNavList: {
    gap: spacing.sm,
  },
  webNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  webNavItemActive: {
    backgroundColor: colors.surfaceSoft,
  },
  webNavBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavBadgeActive: {
    backgroundColor: colors.primary,
  },
  webNavBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  webNavBadgeTextActive: {
    color: colors.surface,
  },
  webNavLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  webNavLabelActive: {
    color: colors.text,
  },
  profileArea: {
    position: 'relative',
  },
  profileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  profileHint: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  profileMenu: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
    zIndex: 20,
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%',
  },
  profileMenuCopy: {
    flex: 1,
  },
  profileMenuName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  profileMenuEmail: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  statusIcon: {
    width: 18,
    height: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileMenuItem: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  profileMenuItemText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutText: {
    color: colors.expense,
  },
  webContent: {
    flex: 1,
    minWidth: 0,
  },
});
