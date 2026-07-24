/**
 * Custom hook to manage user exam preferences
 * Provides access to selected exam, language, and personalization
 */

import { useState, useEffect } from 'react';
import { getExamConfig, getExamIdFromName, hasMultipleLanguages, type ExamConfig } from '../data/exam-config';

export interface UserPreferences {
  selectedExam: string; // exam ID
  selectedLanguage: string; // language code
  examConfig: ExamConfig | undefined;
  supportsMultipleLanguages: boolean;
}

export function useUserPreferences(): UserPreferences & {
  setExam: (examId: string) => void;
  setLanguage: (languageCode: string) => void;
} {
  const [selectedExam, setSelectedExam] = useState<string>('jee-main');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Load preferences from storage on mount
  useEffect(() => {
    // Try to get exam from onboarding
    const onboardingExamsJson = sessionStorage.getItem('onboarding-exams');
    let examId = 'jee-main'; // default
    
    try {
      const exams = onboardingExamsJson ? JSON.parse(onboardingExamsJson) : [];
      if (exams.length > 0) {
        examId = getExamIdFromName(exams[0]);
      }
    } catch (e) {
      // Use default
    }

    // Check localStorage for persisted preference
    const savedExam = localStorage.getItem('selected-exam');
    if (savedExam) {
      examId = savedExam;
    }

    setSelectedExam(examId);

    // Get language preference
    const savedLanguage = sessionStorage.getItem('onboarding-language') || 
                         localStorage.getItem('selected-language') || 
                         'en';
    setSelectedLanguage(savedLanguage);
  }, []);

  // Get exam config
  const examConfig = getExamConfig(selectedExam);
  const supportsMultipleLanguages = hasMultipleLanguages(selectedExam);

  // Update exam preference
  const setExam = (examId: string) => {
    setSelectedExam(examId);
    localStorage.setItem('selected-exam', examId);
  };

  // Update language preference
  const setLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('selected-language', languageCode);
  };

  return {
    selectedExam,
    selectedLanguage,
    examConfig,
    supportsMultipleLanguages,
    setExam,
    setLanguage,
  };
}
