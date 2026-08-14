import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from './src/theme/theme';
import {
  TourPackageSummary,
  EnquiryData,
  NotificationItem,
  NavScreen,
} from './src/types';
import { fetchTourPackages } from './src/api/tourApi';
import { MOCK_NOTIFICATIONS } from './src/data/mockTours';

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('splash');
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
  const [userPhone, setUserPhone] = useState('');
  const [savedTours, setSavedTours] = useState<string[]>([
    'kashmir-paradise-tour',
  ]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([
    {
      id: 'COB-ENQ-819204',
      tourTitle: 'Kashmir Paradise Tour',
      destination: 'Kashmir',
      travelDate: '23 Mar 2026',
      adults: 2,
      children: 1,
      fullName: 'Guest Traveller',
      mobile: '9832000000',
      message: 'Interested in Tulip season standard package',
      status: 'CONFIRMED',
      createdAt: '2026-08-14T10:00:00Z',
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // Modals & Drawers
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [customTourModalVisible, setCustomTourModalVisible] = useState(false);

  // Load tour packages from API
  const loadTours = useCallback(async () => {
    setLoadingTours(true);
    const data = await fetchTourPackages();
    setTours(data);
    setLoadingTours(false);
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  // Wishlist toggle
  const toggleSaveTour = (slug: string) => {
    setSavedTours(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
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
      setCurrentScreen('tour_detail');
    }
  };

  const handleSelectTour = (tour: TourPackageSummary) => {
    setSelectedTourSlug(tour.slug);
    setCurrentScreen('tour_detail');
  };

  const handleFilterTours = (
    type: 'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED'
  ) => {
    setInitialTourFilter(type);
    setCurrentScreen('tours');
  };

  const handleStartEnquiry = (details: {
    tourSlug: string;
    tourTitle: string;
    variantName: string;
    travelDate: string;
  }) => {
    setPrefilledEnquiry(details);
    setCurrentScreen('enquiry');
  };

  const handleEnquirySubmitted = (enq: EnquiryData) => {
    setEnquiries(prev => [enq, ...prev]);
  };

  const handleLoginSuccess = (phone: string) => {
    setIsLoggedIn(true);
    setUserPhone(phone);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserPhone('');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onGetStarted={() => setCurrentScreen('home')}
            onLogin={() => setCurrentScreen('auth')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={setCurrentScreen}
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
            onNavigate={setCurrentScreen}
            initialFilter={initialTourFilter}
            savedTours={savedTours}
            onToggleSave={toggleSaveTour}
          />
        );

      case 'tour_detail':
        return (
          <TourDetailScreen
            slug={selectedTourSlug}
            onBack={() => setCurrentScreen('tours')}
            onNavigate={setCurrentScreen}
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
            onNavigate={setCurrentScreen}
            onEnquirySubmitted={handleEnquirySubmitted}
          />
        );

      case 'auth':
        return (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onSkip={() => setCurrentScreen('home')}
            onNavigate={setCurrentScreen}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onSelectNotification={handleSelectNotification}
            onNavigate={setCurrentScreen}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            isLoggedIn={isLoggedIn}
            userPhone={userPhone}
            enquiries={enquiries}
            savedTours={savedTours}
            allTours={tours}
            onNavigate={setCurrentScreen}
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
            onNavigate={setCurrentScreen}
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
            onBack={() => setCurrentScreen('home')}
            onOpenMenu={() => setDrawerVisible(true)}
            onOpenNotifications={() => setCurrentScreen('notifications')}
            unreadCount={unreadCount}
          />
        )}

        <View style={styles.content}>{renderScreen()}</View>

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            enquiryCount={enquiries.length}
          />
        )}

        {/* Drawer Side Menu */}
        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onNavigate={setCurrentScreen}
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
