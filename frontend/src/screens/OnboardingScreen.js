import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

const SLIDES = [
  {
    title: 'Catat pengeluaran secepat kebiasaanmu belanja.',
    description:
      'Setiap transaksi kecil bisa langsung masuk tanpa bikin kamu berhenti lama di tengah hari.',
    accent: colors.coral,
    accentSoft: colors.coralSoft,
    badge: 'Step 1',
    icon: '01',
    art: illustrationAssets.onboardingTrack,
  },
  {
    title: 'Lihat budget dengan bahasa yang lebih gampang dicerna.',
    description:
      'Budget Flow bantu kasih konteks, bukan cuma angka, jadi kamu tahu mana yang masih aman dan mana yang perlu dijaga.',
    accent: colors.mango,
    accentSoft: colors.mangoSoft,
    badge: 'Step 2',
    icon: '02',
    art: illustrationAssets.onboardingBudget,
  },
  {
    title: 'Rapikan kategori dan rencana, lalu biarkan app bantu ritmemu.',
    description:
      'Setelah awalnya rapi, dashboard dan checklist akan lebih relevan buat dipakai tiap hari.',
    accent: colors.sky,
    accentSoft: colors.skySoft,
    badge: 'Step 3',
    icon: '03',
    art: illustrationAssets.onboardingPlan,
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding, closeOnboarding, hasCompletedOnboarding, isSaving, error } = useOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const slide = SLIDES[activeIndex];
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const helperText = useMemo(() => {
    if (isLastSlide) {
      return 'Setelah ini kamu langsung masuk ke home dan bisa pakai checklist ringan buat mulai.';
    }

    return 'Ringkas saja. Cukup buat bantu kamu tidak kagok pas pertama buka app.';
  }, [isLastSlide]);

  const handleFinish = async () => {
    setSubmitError('');

    try {
      await completeOnboarding();
    } catch (err) {
      setSubmitError(err.message || 'Gagal menyimpan progress onboarding.');
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: slide.accentSoft }]}>
            <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
          </View>

          <TouchableOpacity
            style={[styles.skipButton, isSaving && styles.buttonDisabled]}
            onPress={handleSkip}
            disabled={isSaving}
          >
            <Text style={styles.skipButtonText}>Lewati</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.heroPanel, { backgroundColor: slide.accentSoft, borderColor: slide.accent }]}>
          <Image source={slide.art} style={styles.heroArtwork} resizeMode="contain" />

          <View style={[styles.iconBubble, { backgroundColor: slide.accent }]}>
            <Text style={styles.iconText}>{slide.icon}</Text>
          </View>

          <Text style={styles.heroTitle}>{slide.title}</Text>
          <Text style={styles.heroDescription}>{slide.description}</Text>

          <View style={styles.miniCardsRow}>
            <View style={styles.miniCard}>
              <Text style={styles.miniCardLabel}>Fokus</Text>
              <Text style={styles.miniCardText}>Cepat dicatat</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniCardLabel}>Hasil</Text>
              <Text style={styles.miniCardText}>Lebih kebayang</Text>
            </View>
          </View>
        </View>

        <Text style={styles.helperText}>{helperText}</Text>

        {(submitError || error) ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError || error}</Text>
          </View>
        ) : null}

        <View style={styles.dotsRow}>
          {SLIDES.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                index === activeIndex ? [styles.dotActive, { backgroundColor: slide.accent }] : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, activeIndex === 0 && styles.buttonDisabled]}
            onPress={() => setActiveIndex((current) => Math.max(current - 1, 0))}
            disabled={activeIndex === 0 || isSaving}
          >
            <Text style={styles.secondaryButtonText}>Kembali</Text>
          </TouchableOpacity>

          {isLastSlide ? (
            <TouchableOpacity
              style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Mulai Pakai App</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: slide.accent }]}
              onPress={() => setActiveIndex((current) => Math.min(current + 1, SLIDES.length - 1))}
            >
              <Text style={styles.primaryButtonText}>Lanjut</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasCompletedOnboarding ? (
          <TouchableOpacity style={styles.linkButton} onPress={closeOnboarding} disabled={isSaving}>
            <Text style={styles.linkButtonText}>Tutup tutorial</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  topGlow: {
    position: 'absolute',
    top: 60,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mangoSoft,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(92,174,196,0.14)' } : shadows.card),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  heroPanel: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  heroArtwork: {
    width: '100%',
    height: 220,
    marginBottom: spacing.lg,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  heroDescription: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  miniCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  miniCardLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  miniCardText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  helperText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#F3C8BE',
    backgroundColor: colors.errorSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 54,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  linkButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
