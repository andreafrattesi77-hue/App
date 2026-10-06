import React, { useState, useEffect } from 'react';
import { UserData, EveningEntry, MissionProgress } from './types';
import { ProfileType } from './config';
import { getUnita, Unita } from '../content/index';
import {
  getUserData,
  saveUserData,
  clearUserData,
  getMissionsProgress,
  getDiaryEntries,
} from './services/storage';
import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { ReaderScreen } from './components/ReaderScreen';
import { CoachScreen } from './components/CoachScreen';
import { RitualScreen } from './components/RitualScreen';
import { PlanScreen } from './components/PlanScreen';
import { DiaryScreen } from './components/DiaryScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResetModal } from './components/ResetModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // App Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Reader state
  const [activeUnit, setActiveUnit] = useState<Unita | null>(null);
  const [readerTargetHeading, setReaderTargetHeading] = useState<string | undefined>(undefined);

  // Modals & Subscreens
  const [isQuizView, setIsQuizView] = useState(false);
  const [isRitualView, setIsRitualView] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cross-screen data
  const [missionsProgress, setMissionsProgress] = useState<Record<number, MissionProgress>>({});
  const [diaryEntries, setDiaryEntries] = useState<EveningEntry[]>([]);
  const [coachInitialPrompt, setCoachInitialPrompt] = useState<string>('');
  const [coachActiveUnitId, setCoachActiveUnitId] = useState<string | undefined>(undefined);

  // Initial load
  useEffect(() => {
    const existing = getUserData();
    if (existing && existing.accessCode) {
      setUser(existing);
    }
    setMissionsProgress(getMissionsProgress());
    setDiaryEntries(getDiaryEntries());
    setIsInitialized(true);
  }, []);

  const refreshData = () => {
    const updatedUser = getUserData();
    setUser(updatedUser);
    setMissionsProgress(getMissionsProgress());
    setDiaryEntries(getDiaryEntries());
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#042B58] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-[#F9C03E] border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user not authenticated, show AuthScreen
  if (!user || !user.accessCode) {
    return (
      <AuthScreen
        onSuccess={(name, accessCode) => {
          const fresh = saveUserData({ name, accessCode });
          setUser(fresh);
        }}
      />
    );
  }

  // Open any unit in Reader
  const handleOpenUnita = (id: string, targetHeading?: string) => {
    const u = getUnita(id);
    if (u) {
      setActiveUnit(u);
      setReaderTargetHeading(targetHeading);
    }
  };

  const handleProfileAssigned = (profile: ProfileType) => {
    const updated = saveUserData({ profile });
    setUser(updated);
    refreshData();
  };

  const handleAskCoachWithPrompt = (prompt: string, unitId?: string) => {
    setCoachInitialPrompt(prompt);
    setCoachActiveUnitId(unitId);
    setActiveUnit(null);
    setIsQuizView(false);
    setIsRitualView(false);
    setCurrentTab('coach');
  };

  const handleLogout = () => {
    clearUserData();
    setUser(null);
    setIsSettingsOpen(false);
  };

  const handleDataReset = () => {
    refreshData();
    setIsSettingsOpen(false);
    setActiveUnit(null);
    setIsQuizView(false);
    setIsRitualView(false);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen bg-[#042B58] text-slate-100 flex flex-col justify-between selection:bg-[#F9C03E] selection:text-[#042B58]">
      {/* Top Header (Visible except when in full-screen reader) */}
      {!activeUnit && (
        <TopHeader
          onOpenReset={() => setIsResetOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {/* Full-screen Reader view */}
        {activeUnit ? (
          <ReaderScreen
            unita={activeUnit}
            user={user}
            targetHeading={readerTargetHeading}
            onBack={() => {
              setActiveUnit(null);
              setReaderTargetHeading(undefined);
              refreshData();
            }}
            onOpenUnita={(newId, newHeading) => handleOpenUnita(newId, newHeading)}
            onAskCoachWithPrompt={handleAskCoachWithPrompt}
            onOpenVideocorso={(moduleNum) => {
              setActiveUnit(null);
              setCurrentTab('libreria');
            }}
            onUserDataUpdated={(updated) => setUser(updated)}
          />
        ) : isQuizView ? (
          <QuizScreen
            initialProfile={user.profile}
            onProfileAssigned={handleProfileAssigned}
            onAskCoachWithPrompt={(prompt) => handleAskCoachWithPrompt(prompt)}
            onOpenUnita={(id) => {
              setIsQuizView(false);
              handleOpenUnita(id);
            }}
            onBackToHome={() => setIsQuizView(false)}
          />
        ) : isRitualView ? (
          <RitualScreen
            onFinishRitual={() => {
              refreshData();
              setIsRitualView(false);
              setCurrentTab('home');
            }}
            onExit={() => setIsRitualView(false)}
            onOpenUnita={(id) => {
              setIsRitualView(false);
              handleOpenUnita(id);
            }}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                user={user}
                missionsProgress={missionsProgress}
                diaryEntries={diaryEntries}
                onNavigateTab={(tab) => {
                  setCurrentTab(tab);
                  refreshData();
                }}
                onOpenReset={() => setIsResetOpen(true)}
                onOpenQuiz={() => setIsQuizView(true)}
                onOpenRitual={() => setIsRitualView(true)}
                onOpenUnita={handleOpenUnita}
                onOpenVideocorsoTab={() => setCurrentTab('libreria')}
              />
            )}

            {currentTab === 'libreria' && (
              <LibraryScreen
                user={user}
                onOpenUnita={handleOpenUnita}
                onUserDataUpdated={(updated) => setUser(updated)}
              />
            )}

            {currentTab === 'coach' && (
              <CoachScreen
                user={user}
                initialPrompt={coachInitialPrompt}
                activeUnitId={coachActiveUnitId}
                onClearInitialPrompt={() => {
                  setCoachInitialPrompt('');
                  setCoachActiveUnitId(undefined);
                }}
                onOpenUnita={handleOpenUnita}
                onGoToRitual={() => setIsRitualView(true)}
                onGoToLibrary={() => setCurrentTab('libreria')}
              />
            )}

            {currentTab === 'piano' && (
              <PlanScreen onOpenUnita={handleOpenUnita} />
            )}

            {currentTab === 'diario' && (
              <DiaryScreen user={user} onOpenUnita={handleOpenUnita} />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Visible except in full-screen Reader or Quiz/Ritual) */}
      {!activeUnit && !isQuizView && !isRitualView && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            refreshData();
          }}
        />
      )}

      {/* Modals */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onNameUpdate={(newName) => {
          setUser((prev) => (prev ? { ...prev, name: newName } : null));
        }}
        onRetakeQuiz={() => {
          setIsSettingsOpen(false);
          setIsQuizView(true);
        }}
        onLogout={handleLogout}
        onDataReset={handleDataReset}
      />
    </div>
  );
}
