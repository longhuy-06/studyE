/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, LearningProfile } from './types';
import { api, getToken, clearToken } from './services/api';

// Layouts
import { Shell } from './components/layout/Shell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { ListeningPage } from './pages/ListeningPage';
import { WritingPage } from './pages/WritingPage';
import { ConversationPage } from './pages/ConversationPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function normalizePath(rawPath: string): string {
  if (!rawPath) return '/';
  let p = rawPath.trim();
  if (!p.startsWith('/')) p = '/' + p;
  // Handle route aliases
  if (p === '/landing') return '/';
  if (p === '/overview') return '/dashboard';
  if (p === '/chat' || p === '/chatbot') return '/conversation';
  return p;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Initialize path and session on mount
  useEffect(() => {
    const initial = normalizePath(window.location.pathname || '/');
    setCurrentPath(initial);

    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', handlePopState);

    initAuth();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const initAuth = async () => {
    setLoadingInitial(true);
    const token = getToken();
    if (token) {
      try {
        const data = await api.getCurrentUser();
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        clearToken();
        setUser(null);
        setProfile(null);
      }
    }
    setLoadingInitial(false);
  };

  const navigate = (rawPath: string) => {
    const path = normalizePath(rawPath);
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (loggedInUser: User, loggedInProfile: LearningProfile | null) => {
    setUser(loggedInUser);
    setProfile(loggedInProfile);
    if (!loggedInProfile) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error(err);
    }
    clearToken();
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0650cc] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1b1b1f]">LinguaNext</h2>
            <p className="text-xs text-[#74777f] mt-1">Đang kết nối hệ thống học thông minh...</p>
          </div>
        </div>
      </div>
    );
  }

  const isAuth = !!user;

  if (currentPath === '/') {
    return (
      <LandingPage
        onNavigate={navigate}
        isAuthenticated={isAuth}
      />
    );
  }

  if (currentPath === '/login') {
    if (isAuth) {
      navigate('/dashboard');
      return null;
    }
    return (
      <LoginPage
        onNavigate={navigate}
        onLoginSuccess={handleLoginSuccess}
        isAuthenticated={false}
      />
    );
  }

  if (currentPath === '/register') {
    if (isAuth) {
      navigate('/dashboard');
      return null;
    }
    return (
      <RegisterPage
        onNavigate={navigate}
        onLoginSuccess={handleLoginSuccess}
        isAuthenticated={false}
      />
    );
  }

  if (currentPath === '/onboarding') {
    if (!isAuth) {
      navigate('/login');
      return null;
    }
    return (
      <OnboardingPage
        onNavigate={navigate}
        user={user}
        profile={profile}
        onProfileUpdated={(p) => setProfile(p)}
      />
    );
  }

  if (!isAuth) {
    return (
      <LoginPage
        onNavigate={navigate}
        onLoginSuccess={handleLoginSuccess}
        isAuthenticated={false}
      />
    );
  }

  // Render Screens within Authenticated Shell
  const renderAppScreen = () => {
    switch (currentPath) {
      case '/dashboard':
        return (
          <DashboardPage
            user={user}
            profile={profile}
            onNavigate={navigate}
          />
        );
      case '/vocabulary':
        return <VocabularyPage onNavigate={navigate} />;
      case '/listening':
        return <ListeningPage />;
      case '/writing':
        return <WritingPage />;
      case '/conversation':
        return <ConversationPage />;
      case '/progress':
        return <ProgressPage user={user} profile={profile} />;
      case '/profile':
        return (
          <SettingsPage
            user={user}
            profile={profile}
            onProfileUpdated={(p) => setProfile(p)}
            onUserUpdated={(u) => setUser(u)}
            activeTab="profile"
            onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/settings')}
          />
        );
      case '/settings':
        return (
          <SettingsPage
            user={user}
            profile={profile}
            onProfileUpdated={(p) => setProfile(p)}
            onUserUpdated={(u) => setUser(u)}
            activeTab="settings"
            onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/settings')}
          />
        );
      default:
        return (
          <NotFoundPage
            onNavigate={navigate}
            isAuthenticated={isAuth}
          />
        );
    }
  };

  return (
    <Shell
      currentPath={currentPath}
      onNavigate={navigate}
      user={user}
      profile={profile}
      onLogout={handleLogout}
    >
      {renderAppScreen()}
    </Shell>
  );
}
