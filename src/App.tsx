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
  isTrialUser,
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
import { RhythmModal } from './components/RhythmModal';
import { UnlockModal } from './components/UnlockModal';
import { VideocorsoModal } from './components/VideocorsoModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockModalNotice, setUnlockModalNotice] = useState<string | undefined>(undefined);

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
  const [isRhythmOpen, setIsRhythmOpen] = useState(false);
  const [isVideocorsoOpen, setIsVideocorsoOpen] = useState(false);

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
      // Se è utente in prova con email, controlla e sincronizza dal server il conteggio delle domande
      if (isTrialUser(existing) && existing.email) {
        fetch(`/api/coach/trial-status?email=${encodeURIComponent(existing.email)}`)
          .then((res) => res.json())
          .then((data) => {
            if (typeof data.questionsUsed === 'number') {
              const synced = saveUserData({ trialCoachQuestionsUsed: data.questionsUsed }, existing.email);
              setUser(synced);
            }
          })
          .catch(() => {});
      }
      setMissionsProgress(getMissionsProgress(existing.email));
      setDiaryEntries(getDiaryEntries(existing.email));
    } else {
      setMissionsProgress(getMissionsProgress());
      setDiaryEntries(getDiaryEntries());
    }
    setIsInitialized(true);
  }, []);

  // Update missions and diary whenever active user email changes
  useEffect(() => {
    if (user?.email) {
      setMissionsProgress(getMissionsProgress(user.email));
      setDiaryEntries(getDiaryEntries(user.email));
    }
  }, [user?.email]);

  const refreshData = () => {
    const updatedUser = getUserData(user?.email);
    setUser(updatedUser);
    setMissionsProgress(getMissionsProgress(updatedUser?.email));
    setDiaryEntries(getDiaryEntries(updatedUser?.email));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#121622] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5B869] border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user not authenticated, show AuthScreen
  if (!user || !user.accessCode) {
    return (
      <AuthScreen
        onSuccess={(_name, _accessCode) => {
          const fresh = getUserData();
          setUser(fresh);
          if (fresh?.email) {
            setMissionsProgress(getMissionsProgress(fresh.email));
            setDiaryEntries(getDiaryEntries(fresh.email));
          }
        }}
      />
    );
  }

  const openUnlockWithNotice = (notice?: string) => {
    setUnlockModalNotice(notice);
    setIsUnlockModalOpen(true);
  };

  // Open any unit in Reader
  const handleOpenUnita = (id: string, targetHeading?: string) => {
    if (isTrialUser(user) && id !== 'intro' && id !== 'cap01') {
      const u = getUnita(id);
      const title = u?.titolo ? `"${u.titolo}"` : 'questo contenuto';
      openUnlockWithNotice(
        `Il capitolo ${title} fa parte della versione completa di Effetto Calamita. Sblocca tutti i 16 capitoli dell'ebook + i 6 bonus pratici!`
      );
      return;
    }
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
    <div className="min-h-screen bg-[#121622] text-[#f7f6f3] flex flex-col justify-between selection:bg-[#E5B869] selection:text-[#121622]">
      {/* Sticky Trial Banner for Demo Users */}
      {!activeUnit && isTrialUser(user) && (
        <div className="bg-gradient-to-r from-[#182033] via-[#121622] to-[#182033] border-b border-[#E5B869]/30 px-3 py-1.5 flex items-center justify-between text-xs text-slate-200 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E5B869] shrink-0" />
            <span className="truncate">
              Prova: <span className="text-[#E5B869] font-medium">{user.email || user.name}</span> •{' '}
              <strong className="text-white">
                {Math.max(0, 3 - (user.trialCoachQuestionsUsed || 0))}/3 domande Coach
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Esci da questo account e passa a un'altra email"
            >
              Cambia email
            </button>
            <button
              type="button"
              onClick={() => openUnlockWithNotice('Passa alla versione completa per sbloccare l\'app senza limiti!')}
              className="px-2.5 py-0.5 rounded-full gold-gradient-btn text-[11px] font-bold text-[#121622] hover:brightness-105 transition-all cursor-pointer"
            >
              Sblocca
            </button>
          </div>
        </div>
      )}

      {/* Top Header (Visible except when in full-screen reader) */}
      {!activeUnit && (
        <TopHeader
          onOpenReset={() => setIsResetOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isTrial={isTrialUser(user)}
          onOpenUpgrade={() => openUnlockWithNotice()}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-xl mx-auto">
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
                onOpenRhythm={() => setIsRhythmOpen(true)}
                onOpenUnita={handleOpenUnita}
                onOpenVideocorso={() => setIsVideocorsoOpen(true)}
              />
            )}

            {currentTab === 'libreria' && (
              <LibraryScreen
                user={user}
                onOpenUnita={handleOpenUnita}
                onUserDataUpdated={(updated) => setUser(updated)}
                onOpenVideocorso={() => setIsVideocorsoOpen(true)}
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
                onOpenUnlock={openUnlockWithNotice}
                onUserDataUpdated={(updated) => setUser(updated)}
              />
            )}

            {currentTab === 'piano' && (
              <PlanScreen
                onOpenUnita={handleOpenUnita}
                isTrial={isTrialUser(user)}
                onOpenUnlock={openUnlockWithNotice}
              />
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
          isTrial={isTrialUser(user)}
          onOpenUpgrade={() => openUnlockWithNotice()}
        />
      )}

      {/* Modals */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
      />

      <RhythmModal
        isOpen={isRhythmOpen}
        onClose={() => setIsRhythmOpen(false)}
        isTrial={isTrialUser(user)}
        onOpenUnlock={openUnlockWithNotice}
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
        onOpenRhythm={() => setIsRhythmOpen(true)}
        onOpenVideocorso={() => setIsVideocorsoOpen(true)}
        onLogout={handleLogout}
        onDataReset={handleDataReset}
      />

      {/* Videocorso Modal (Integrated 9 Modules Player) */}
      <VideocorsoModal
        isOpen={isVideocorsoOpen}
        onClose={() => setIsVideocorsoOpen(false)}
        user={user}
        onOpenUnlock={openUnlockWithNotice}
        onUserDataUpdated={(updated) => setUser(updated)}
      />

      {/* Global Unlock Modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        contextNotice={unlockModalNotice}
        isLimitExhausted={unlockModalNotice === 'Hai usato le domande gratuite di oggi.'}
        onUnlocked={() => {
          refreshData();
        }}
      />
    </div>
  );
}
