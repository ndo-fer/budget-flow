import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../api/supabase';
import { useAuth } from './AuthContext';

const ONBOARDING_COMPLETED_KEY = 'has_completed_onboarding';
const CHECKLIST_HIDDEN_KEY = 'hide_onboarding_checklist';

const OnboardingContext = createContext();

const getUserMetadata = (user) => user?.user_metadata || {};

export const OnboardingProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isChecklistHidden, setIsChecklistHidden] = useState(false);
  const [error, setError] = useState(null);
  const hasCompletedOnboarding = Boolean(getUserMetadata(user)[ONBOARDING_COMPLETED_KEY]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsVisible(false);
      setIsChecklistHidden(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    const metadata = getUserMetadata(user);
    const hasCompletedOnboarding = Boolean(metadata[ONBOARDING_COMPLETED_KEY]);

    setIsVisible(!hasCompletedOnboarding);
    setIsChecklistHidden(Boolean(metadata[CHECKLIST_HIDDEN_KEY]));
    setError(null);
    setIsLoading(false);
  }, [authLoading, user]);

  const updateMetadata = async (updates) => {
    if (!user) {
      throw new Error('User session not found');
    }

    setIsSaving(true);
    setError(null);

    try {
      const nextMetadata = {
        ...getUserMetadata(user),
        ...updates,
      };

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: nextMetadata,
      });

      if (updateError) {
        throw updateError;
      }

      return data?.user;
    } catch (err) {
      setError(err.message || 'Failed to update onboarding settings.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const completeOnboarding = async () => {
    await updateMetadata({
      [ONBOARDING_COMPLETED_KEY]: true,
    });
    setIsVisible(false);
  };

  const openOnboarding = () => {
    setError(null);
    setIsVisible(true);
  };

  const closeOnboarding = () => {
    setError(null);
    setIsVisible(false);
  };

  const hideChecklist = async () => {
    await updateMetadata({
      [CHECKLIST_HIDDEN_KEY]: true,
    });
    setIsChecklistHidden(true);
  };

  const showChecklist = async () => {
    await updateMetadata({
      [CHECKLIST_HIDDEN_KEY]: false,
    });
    setIsChecklistHidden(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isLoading,
        isSaving,
        isVisible,
        isChecklistHidden,
        error,
        hasCompletedOnboarding,
        completeOnboarding,
        openOnboarding,
        closeOnboarding,
        hideChecklist,
        showChecklist,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }

  return context;
};
