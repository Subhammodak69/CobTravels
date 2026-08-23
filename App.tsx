import React, { useState, useEffect, useCallback } from 'react';
import { AppState, BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { COLORS } from './src/theme/theme';
import {
  TourPackageSummary,
  EnquiryData,
  NotificationItem,
  NavScreen,
} from './src/types';
import { fetchTourPackages, fetchMe, getAccessToken, refreshSession, logout as logoutApi, identifyVisitor, startVisitorSession, heartbeatVisitorSession, endVisitorSession, trackVisitorEvent, AuthUser } from './src/api/tourApi';

// Components
import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';
import { DrawerMenu } from './src/components/DrawerMenu';
import { CustomTourModal } from './src/components/CustomTourModal';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TourListScreen } from './src/screens/TourListScreen';
import { TourDetailScreen } from './src/screens/TourDetailScreen';
import { EnquiryScreen } from './src/screens/EnquiryScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { toastConfig } from './src/components/AppToast';
import { showApiError } from './src/utils/toast';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('splash');
  const screenHistory = React.useRef<NavScreen[]>(['splash']);
  const currentScreenRef = React.useRef<NavScreen>('splash');
  const visitorSessionRef = React.useRef<string | null>(null);
  const visitorBootstrapRef = React.useRef(false);
  const identifiedCustomerRef = React.useRef<string | null>(null);
  const [visitorReady, setVisitorReady] = useState(false);

  const navigateTo = React.useCallback((screen: NavScreen) => {
    setCurrentScreen(previous => {
      if (previous !== screen) {
        screenHistory.current = [...screenHistory.current, screen];
      }
      return screen;
    });
  }, []);

  const goBack = React.useCallback(() => {
    if (screenHistory.current.length <= 1) return false;
    screenHistory.current = screenHistory.current.slice(0, -1);
    setCurrentScreen(screenHistory.current[screenHistory.current.length - 1]);
    return true;
  }, []);

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [goBack]);

  React.useEffect(() => { currentScreenRef.current = currentScreen; if (visitorSessionRef.current) { heartbeatVisitorSession(currentScreen, 1); trackVisitorEvent('screen_view', currentScreen, { screen: currentScreen }); } }, [currentScreen]);
  React.useEffect(() => {
    let mounted = true;
    const startTracking = async () => {
      if (!visitorReady || visitorSessionRef.current) return;
      const session = await startVisitorSession(currentScreenRef.current);
      if (mounted && session) { visitorSessionRef.current = session; trackVisitorEvent('session_started', currentScreenRef.current); }
    };
    startTracking();
    const interval = setInterval(() => { if (visitorSessionRef.current) heartbeatVisitorSession(currentScreenRef.current, 0); else startTracking(); }, 30000);
    const subscription = AppState.addEventListener('change', nextState => { if (nextState === 'active') startTracking(); else if (visitorSessionRef.current) { endVisitorSession(currentScreenRef.current); visitorSessionRef.current = null; } });
    return () => { mounted = false; clearInterval(interval); subscription.remove(); if (visitorSessionRef.current) { endVisitorSession(currentScreenRef.current); visitorSessionRef.current = null; } };
  }, [visitorReady]);
  const [tours, setTours] = useState<TourPackageSummary[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  const [selectedTourSlug, setSelectedTourSlug] = useState<string>('kashmir-paradise-tour');
  const [initialTourFilter, setInitialTourFilter] = useState<
    'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED'
  >('ALL');

  const [prefilledEnquiry, setPrefilledEnquiry] = useState<{
    tourSlug?: string;
    tourTitle?: string;
    variantName?: string;
    travelDate?: string;
  } | null>(null);

  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userPhone, setUserPhone] = useState('');
  const [savedTours, setSavedTours] = useState<string[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals & Drawers
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [customTourModalVisible, setCustomTourModalVisible] = useState(false);

  // Load tour packages from API
  const loadTours = useCallback(async () => {
    setLoadingTours(true);
    try { setTours(await fetchTourPackages()); }
    catch (error) { setTours([]); showApiError(error, 'We could not load the tours.'); }
    setLoadingTours(false);
  }, []);

  useEffect(() => {
    if (visitorBootstrapRef.current) return;
    visitorBootstrapRef.current = true;
    let mounted = true;
    loadTours();
    (async () => {
      let customerId = '';
      let token = await getAccessToken();
      if (!token) token = (await refreshSession()) ? await getAccessToken() : null;
      if (token) {
        try { const result = await fetchMe(); const profile = result.data || null; customerId = profile?.id || ''; setUser(profile); setIsLoggedIn(Boolean(profile)); setUserPhone(profile?.mobile || ''); } catch { setIsLoggedIn(false); setUser(null); }
      }
      if (customerId) identifiedCustomerRef.current = customerId;
      await identifyVisitor(customerId);
      if (mounted) setVisitorReady(true);
    })();
    return () => { mounted = false; };
  }, [loadTours]);

  // Wishlist toggle
  const toggleSaveTour = (slug: string) => {
    setSavedTours(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
    trackVisitorEvent('wishlist_toggled', currentScreenRef.current, { tour_slug: slug });
  };

  // Notification actions
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.actionSlug) {
      setSelectedTourSlug(item.actionSlug);
      navigateTo('tour_detail');
    }
  };

  const handleSelectTour = (tour: TourPackageSummary) => {
    setSelectedTourSlug(tour.slug);
    trackVisitorEvent('tour_selected', currentScreenRef.current, { tour_slug: tour.slug, tour_title: tour.title });
    navigateTo('tour_detail');
  };

  const handleFilterTours = (
    type: 'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED'
  ) => {
    setInitialTourFilter(type);
    navigateTo('tours');
  };

  const handleStartEnquiry = (details: {
    tourSlug: string;
    tourTitle: string;
    variantName: string;
    travelDate: string;
  }) => {
    setPrefilledEnquiry(details);
    trackVisitorEvent('enquiry_started', currentScreenRef.current, details);
    navigateTo('enquiry');
  };

  const handleEnquirySubmitted = (enq: EnquiryData) => {
    setEnquiries(prev => [enq, ...prev]);
    trackVisitorEvent('enquiry_submitted', 'enquiry', { tour_slug: enq.tourSlug, travel_date: enq.travelDate });
  };

  const handleLoginSuccess = async (phone: string) => {
    setIsLoggedIn(true);
    setUserPhone(phone);
    try { const result = await fetchMe(); setUser(result.data || null); } catch { setUser(null); }
    trackVisitorEvent('login_success', 'auth', { identifier_type: 'mobile' });
    fetchMe().then(result => { const customerId = result.data?.id || ''; if (customerId && identifiedCustomerRef.current !== customerId) { identifiedCustomerRef.current = customerId; identifyVisitor(customerId); } }).catch(() => {});
    navigateTo('home');
  };

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    setIsLoggedIn(false);
    setUserPhone('');
    setUser(null);
    if (currentScreenRef.current === 'profile' || currentScreenRef.current === 'notifications') navigateTo('home');
  };

  const protectedScreens: NavScreen[] = ['profile', 'notifications'];
  const navigateWithAuth = (screen: NavScreen) => {
    if (protectedScreens.includes(screen) && !isLoggedIn) { navigateTo('auth'); return; }
    navigateTo(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onGetStarted={() => navigateTo('home')}
            onLogin={() => navigateTo('auth')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateWithAuth}
            onFilterType={handleFilterTours}
            onOpenCustomTour={() => setCustomTourModalVisible(true)}
            savedTours={savedTours}
            onToggleSave={toggleSaveTour}
          />
        );

      case 'tours':
        return (
          <TourListScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateWithAuth}
            initialFilter={initialTourFilter}
            savedTours={savedTours}
            onToggleSave={toggleSaveTour}
          />
        );

      case 'tour_detail':
        return (
          <TourDetailScreen
            slug={selectedTourSlug}
            onBack={goBack}
            onNavigate={navigateWithAuth}
            onStartEnquiry={handleStartEnquiry}
            isSaved={savedTours.includes(selectedTourSlug)}
            onToggleSave={() => toggleSaveTour(selectedTourSlug)}
          />
        );

      case 'enquiry':
        return (
          <EnquiryScreen
            tours={tours}
            prefilledTour={prefilledEnquiry}
            onNavigate={navigateTo}
            onEnquirySubmitted={handleEnquirySubmitted}
          />
        );

      case 'auth':
        return (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onSkip={() => navigateTo('home')}
            onNavigate={navigateTo}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onSelectNotification={handleSelectNotification}
            onNavigate={navigateTo}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            isLoggedIn={isLoggedIn}
            user={user}
            userPhone={userPhone}
            enquiries={enquiries}
            savedTours={savedTours}
            allTours={tours}
            onNavigate={navigateWithAuth}
            onSelectTour={handleSelectTour}
            onLogout={handleLogout}
            onOpenCustomTour={() => setCustomTourModalVisible(true)}
          />
        );

      default:
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateWithAuth}
            onFilterType={handleFilterTours}
            onOpenCustomTour={() => setCustomTourModalVisible(true)}
            savedTours={savedTours}
            onToggleSave={toggleSaveTour}
          />
        );
    }
  };

  const showHeader =
    currentScreen !== 'splash' &&
    currentScreen !== 'auth' &&
    currentScreen !== 'tour_detail';

  const showBottomNav =
    currentScreen !== 'splash' &&
    currentScreen !== 'auth' &&
    currentScreen !== 'tour_detail';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

        {showHeader && (
          <Header
            title="COOCHBEHAR TRAVEL"
            showBack={currentScreen !== 'home'}
            onBack={goBack}
            onOpenMenu={() => setDrawerVisible(true)}
            onOpenNotifications={() => navigateWithAuth('notifications')}
            unreadCount={unreadCount}
          />
        )}

        <View style={styles.content}>{renderScreen()}</View>

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateWithAuth}
            enquiryCount={enquiries.length}
          />
        )}

        {/* Drawer Side Menu */}
        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onNavigate={navigateWithAuth}
          onFilterTours={handleFilterTours}
          onOpenCustomTour={() => {
            setDrawerVisible(false);
            setCustomTourModalVisible(true);
          }}
          isLoggedIn={isLoggedIn}
          userPhone={userPhone}
        />

        {/* Custom Tour Planner Modal */}
        <CustomTourModal
          visible={customTourModalVisible}
          onClose={() => setCustomTourModalVisible(false)}
          onSubmitSuccess={handleEnquirySubmitted}
        />
      </SafeAreaView>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
