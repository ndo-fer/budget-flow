import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { colors } from '../constants/colors';
import { brandAssets } from '../constants/assets';

export default function AuthScreen() {
  const { signUp, signIn, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAuth = async () => {
    clearMessages();

    if (!email || !password) {
      setErrorMessage('Email dan password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Konfirmasi password belum cocok.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isSignUp) {
        await signUp(email, password);
        setSuccessMessage('Akun berhasil dibuat. Cek email untuk verifikasi lalu lanjut login.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        setSuccessMessage('Login berhasil.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Autentikasi gagal. Coba lagi ya.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroWrap}>
        <View style={styles.heroGlowCoral} />
        <View style={styles.heroGlowSky} />

        <Image source={brandAssets.logoHorizontal} style={styles.logo} resizeMode="contain" />
        <Text style={styles.eyebrow}>Budget Flow</Text>
        <Text style={styles.title}>Atur uang harianmu tanpa bikin kepala penuh.</Text>
        <Text style={styles.subtitle}>
          Catat pengeluaran, lihat sisa budget, dan bangun kebiasaan finansial yang lebih ringan.
        </Text>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, styles.pillCoral]}>
            <Text style={styles.pillText}>Quick daily tracking</Text>
          </View>
          <View style={[styles.pill, styles.pillTeal]}>
            <Text style={styles.pillText}>Friendly budget alerts</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
            onPress={() => {
              clearMessages();
              setPassword('');
              setConfirmPassword('');
              setIsSignUp(false);
            }}
            disabled={isBusy}
          >
            <Text style={[styles.modeButtonText, !isSignUp && styles.modeButtonTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
            onPress={() => {
              clearMessages();
              setPassword('');
              setConfirmPassword('');
              setIsSignUp(true);
            }}
            disabled={isBusy}
          >
            <Text style={[styles.modeButtonText, isSignUp && styles.modeButtonTextActive]}>
              Daftar
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.formTitle}>
          {isSignUp ? 'Bikin akun baru' : 'Masuk dan lanjutkan pencatatanmu'}
        </Text>
        <Text style={styles.formSubtitle}>
          {isSignUp
            ? 'Mulai dengan akun yang sederhana, lalu app akan bantu pandu langkah awalmu.'
            : 'Semua progress dan tutorialmu akan tetap mengikuti akun ini.'}
        </Text>

        {errorMessage ? (
          <View style={[styles.messageBox, styles.errorBox]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={[styles.messageBox, styles.successBox]}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="nama@email.com"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errorMessage || successMessage) {
              clearMessages();
            }
          }}
          editable={!isBusy}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimal 6 karakter"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errorMessage || successMessage) {
              clearMessages();
            }
          }}
          editable={!isBusy}
          secureTextEntry
        />

        {isSignUp && (
          <>
            <Text style={styles.inputLabel}>Konfirmasi Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Ulangi password"
              placeholderTextColor={colors.textTertiary}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (errorMessage || successMessage) {
                  clearMessages();
                }
              }}
              editable={!isBusy}
              secureTextEntry
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, isBusy && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Buat Akun' : 'Masuk Sekarang'}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          {isSignUp
            ? 'Sesudah daftar, kamu akan dapat email verifikasi sebelum mulai.'
            : 'Belum punya akun? Pindah ke tab Daftar di atas.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  heroWrap: {
    position: 'relative',
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 188,
    height: 56,
    marginBottom: spacing.md,
  },
  heroGlowCoral: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 110,
    height: 110,
    borderRadius: borderRadius.full,
    backgroundColor: colors.coralSoft,
  },
  heroGlowSky: {
    position: 'absolute',
    top: 34,
    right: 96,
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mangoSoft,
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    maxWidth: 320,
  },
  subtitle: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillCoral: {
    backgroundColor: colors.coralSoft,
  },
  pillTeal: {
    backgroundColor: colors.tealSoft,
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0 22px 44px rgba(92,174,196,0.14)' } : shadows.card),
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
  },
  modeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: colors.coral,
  },
  formTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  formSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  messageBox: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: colors.errorSoft,
    borderColor: '#F3C8BE',
  },
  successBox: {
    backgroundColor: colors.successSoft,
    borderColor: '#BEE8E4',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: colors.teal,
    fontSize: 14,
    lineHeight: 20,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    minHeight: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
});
