import React, { useState, useEffect, useCallback } from 'react';
import { AppState, BackHandler, Linking, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { COLORS, ThemeProvider, useColors, useAppColorScheme } from './src/theme/theme';
import {
  TourPackageSummary,
  EnquiryData,
  NotificationItem,
  NavScreen,
} from './src/types';
import { fetchTourPackages, fetchMe, fetchEnquiries, fetchWishlist, getAccessToken, refreshSession, logout as logoutApi, identifyVisitor, startVisitorSession, heartbeatVisitorSession, endVisitorSession, trackVisitorEvent, AuthUser, EnquiryRecord, addWishlistItem, removeWishlistItem, validateReferralCode, REFERRAL_CODE_KEY } from './src/api/tourApi';

// Components
import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';
import { DrawerMenu } from './src/components/DrawerMenu';
import { EnquiryModal } from './src/components/EnquiryModal';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TourListScreen } from './src/screens/TourListScreen';
import { TourDetailScreen } from './src/screens/TourDetailScreen';
import { EnquiryScreen } from './src/screens/EnquiryScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProfileDetailsScreen } from './src/screens/ProfileDetailsScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { SessionsScreen } from './src/screens/SessionsScreen';
import { NotificationSettingsScreen } from './src/screens/NotificationSettingsScreen';
import { DocumentsScreen } from './src/screens/DocumentsScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { ReferralsScreen } from './src/screens/ReferralsScreen';
import { MyTripsScreen, MyEnquiriesScreen, BillsInvoicesScreen } from './src/screens/Tripsinvoicesenquiries';
import { toastConfig } from './src/components/AppToast';
import { showApiError } from './src/utils/toast';
import { decodeReferral } from './src/utils/referral';
import { AppDialogProvider } from './src/components/AppDialog';

function AppInner() {
  const appColors = useColors();
  const colorScheme = useAppColorScheme();
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

  const finishSplash = React.useCallback(() => {
    screenHistory.current = ['home'];
    currentScreenRef.current = 'home';
    setCurrentScreen('home');
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
  const wishlistActionRef = React.useRef<string | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  const loadEnquiries = useCallback(async () => {
    if (!(await getAccessToken())) { setEnquiries([]); return; }
    setLoadingEnquiries(true);
    try {
      const records = await fetchEnquiries();
      setEnquiries(records.map((item: EnquiryRecord) => ({
        ...item,
        id: item.id,
        tourTitle: item.subject || item.destination || 'Travel enquiry',
        destination: item.destination,
        fullName: item.enquirer_name || '',
        mobile: item.enquirer_phone || '',
        travelDate: item.travel_date || '',
        adults: Number(item.pax_no || 0),
        children: 0,
        message: item.message || item.special_requirements || '',
        status: item.status as EnquiryData['status'],
        createdAt: item.created_at,
      })));
    } catch (error) {
      showApiError(error, 'We could not load your enquiries.');
    } finally { setLoadingEnquiries(false); }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const response = await fetchWishlist();
      const items: any = Array.isArray(response.data) ? response.data : [];
      setSavedTours(items.map((item: any) => item.slug).filter(Boolean));
    } catch (error) { showApiError(error, 'We could not load your wishlist.'); }
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals & Drawers
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryModalTour, setEnquiryModalTour] = useState<import('./src/types').TourPackageSummary | null>(null);
  const [enquiryModalPackageId, setEnquiryModalPackageId] = useState('');
  const [enquiryModalVariantId, setEnquiryModalVariantId] = useState('');

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
        try {
          const result = await fetchMe();
          const profile = result.data || null;
          customerId = profile?.id || '';
          setUser(profile);
          setIsLoggedIn(Boolean(profile));
          if (profile) await loadWishlist();
          setUserPhone(profile?.mobile || '');
          if (profile && mounted) {
            // A returning member should never be stopped at the guest splash screen.
            screenHistory.current = ['home'];
            currentScreenRef.current = 'home';
            setCurrentScreen('home');
          }
        } catch { setIsLoggedIn(false); setUser(null); }
        await loadEnquiries();
      }
      if (customerId) identifiedCustomerRef.current = customerId;
      await identifyVisitor(customerId);
      if (mounted) setVisitorReady(true);
    })();
    return () => { mounted = false; };
  }, [loadTours, loadEnquiries, loadWishlist]);

  useEffect(() => {
    const processUrl = async (url: string | null | undefined) => {
      if (!url) return;
      const encoded = url.match(/[?&]r=([^&]+)/)?.[1];
      if (!encoded) return;
      try {
        const decoded = decodeURIComponent(encoded);
        const code = decodeReferral(decoded);
        const result = await validateReferralCode(code);
        const validCode = result.data?.referral_code;
        if (validCode) await AsyncStorage.setItem(REFERRAL_CODE_KEY, validCode);
      } catch { /* Invalid invite links should not interrupt normal navigation. */ }
    };
    Linking.getInitialURL().then(processUrl).catch(() => {});
    const subscription = Linking.addEventListener('url', event => { processUrl(event.url); });
    return () => subscription.remove();
  }, []);

  // Wishlist toggle
  const toggleSaveTour = (slug: string) => {
    if (!isLoggedIn) { navigateTo('auth'); return; }
    if (wishlistActionRef.current === slug) return;
    const isSaved = savedTours.includes(slug);
    setSavedTours(prev => isSaved ? prev.filter(s => s !== slug) : [...prev, slug]);
    wishlistActionRef.current = slug;
    (isSaved ? removeWishlistItem(slug) : addWishlistItem(slug)).catch(error => {
      setSavedTours(prev => isSaved ? [...prev, slug] : prev.filter(s => s !== slug));
      showApiError(error, 'We could not update your wishlist.');
    }).finally(() => { wishlistActionRef.current = null; });
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
    // Find the tour summary to pass to the modal
    const matchedTour = tours.find(t => t.slug === details.tourSlug) || null;
    setEnquiryModalTour(matchedTour);
    // Pass actual UUID (matchedTour.id) so the modal can send it; also keep slug available via tour.slug for /select/{slug}
    setEnquiryModalPackageId(matchedTour?.id || details.tourSlug);
    setEnquiryModalVariantId(details.variantName);
    setEnquiryModalVisible(true);
    trackVisitorEvent('enquiry_started', currentScreenRef.current, details);
  };

  const handleOpenEnquiryForTour = (tour: import('./src/types').TourPackageSummary) => {
    setEnquiryModalTour(tour);
    setEnquiryModalPackageId(tour.id);
    setEnquiryModalVariantId('');
    setEnquiryModalVisible(true);
    trackVisitorEvent('enquiry_started', currentScreenRef.current, { tour_slug: tour.slug, tour_title: tour.title });
  };

  const handleEnquirySubmitted = (enq: EnquiryData) => {
    setEnquiries(prev => [enq, ...prev]);
    trackVisitorEvent('enquiry_submitted', 'enquiry', { tour_slug: enq.tourSlug, travel_date: enq.travelDate });
  };

  const handleLoginSuccess = async (phone: string) => {
    await AsyncStorage.removeItem(REFERRAL_CODE_KEY);
    setIsLoggedIn(true);
    setUserPhone(phone);
    await loadEnquiries();
    try { const result = await fetchMe(); setUser(result.data || null); } catch { setUser(null); }
    trackVisitorEvent('login_success', 'auth', { identifier_type: 'mobile' });
    fetchMe().then(result => { const customerId = result.data?.id || ''; if (customerId && identifiedCustomerRef.current !== customerId) { identifiedCustomerRef.current = customerId; identifyVisitor(customerId); } }).catch(() => {});
    navigateTo('profile');
  };

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {}
    setIsLoggedIn(false);
    setUserPhone('');
    setUser(null);
    setSavedTours([]);
    setEnquiries([]);
    identifiedCustomerRef.current = null;
    navigateTo('home');
  };

  const protectedScreens: NavScreen[] = ['profile', 'profile_details', 'edit_profile', 'sessions', 'my_trips', 'my_enquiries', 'bills_invoices', 'documents', 'wishlist', 'referrals', 'notifications'];
  const navigateWithAuth = (screen: NavScreen) => {
    if (protectedScreens.includes(screen) && !isLoggedIn) { navigateTo('auth'); return; }
    navigateTo(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onFinished={finishSplash}
          />
        );

      case 'home':
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateTo}
            onFilterType={handleFilterTours}
            onOpenCustomTour={() => navigateTo('enquiry')}
            onEnquireTour={handleOpenEnquiryForTour}
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
            onEnquireTour={handleOpenEnquiryForTour}
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
            onNavigate={navigateTo}
            onEnquirySubmitted={handleEnquirySubmitted}
            user={user}
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
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        );

      case 'profile_details':
        return <ProfileDetailsScreen user={user} onNavigate={navigateWithAuth} />;

      case 'edit_profile':
        return <EditProfileScreen user={user} onSaved={profile => { setUser(profile); setUserPhone(profile.mobile || ''); navigateTo('profile'); }} onNavigate={navigateWithAuth} />;

      case 'sessions':
        return <SessionsScreen onLogout={handleLogout} onNavigate={navigateWithAuth} />;

      case 'notification_settings':
        return <NotificationSettingsScreen isLoggedIn={isLoggedIn} />;

      case 'documents':
        return <DocumentsScreen onNavigate={navigateWithAuth} />;

      case 'wishlist':
        return <WishlistScreen tours={tours} savedTours={savedTours} onSelectTour={handleSelectTour} onToggleSave={toggleSaveTour} />;

      case 'referrals':
        return <ReferralsScreen />;

      case 'my_trips':
        return <MyTripsScreen />;

      case 'my_enquiries':
        return <MyEnquiriesScreen enquiries={enquiries} loading={loadingEnquiries} onRefresh={loadEnquiries} />;

      case 'bills_invoices':
        return <BillsInvoicesScreen />;

      default:
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateWithAuth}
            onFilterType={handleFilterTours}
            onOpenCustomTour={() => navigateTo('enquiry')}
            onEnquireTour={handleOpenEnquiryForTour}
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

  const getScreenStatusBarConfig = (): { bg: string; barStyle: 'light-content' | 'dark-content' } => {
    if (currentScreen === 'splash') {
      return { bg: '#072421', barStyle: 'light-content' };
    }
    if (currentScreen === 'auth') {
      return {
        bg: colorScheme === 'dark' ? appColors.primaryDark : '#FFFFFF',
        barStyle: colorScheme === 'dark' ? 'light-content' : 'dark-content',
      };
    }
    // Screens with top Header (Home, TourList, Enquiry, Profile, Notifications, etc.)
    if (showHeader) {
      return {
        bg: colorScheme === 'dark' ? appColors.primaryDark : '#FFFFFF',
        barStyle: colorScheme === 'dark' ? 'light-content' : 'dark-content',
      };
    }
    // Tour Detail and other full-bleed screens
    return {
      bg: appColors.bg,
      barStyle: colorScheme === 'dark' ? 'light-content' : 'dark-content',
    };
  };

  const statusConfig = getScreenStatusBarConfig();

  return (
    <>
      <AppDialogProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: statusConfig.bg },
        ]}
        edges={currentScreen === 'splash' ? [] : ['top', 'left', 'right']}
      >
        <StatusBar barStyle={statusConfig.barStyle} />

        {showHeader && (
          <Header
            title="COOCHBEHAR TRAVEL"
            showBack={currentScreen !== 'home'}
            onBack={goBack}
            onOpenMenu={() => setDrawerVisible(v => !v)}
            menuOpen={drawerVisible}
            onOpenNotifications={() => navigateWithAuth('notifications')}
            unreadCount={unreadCount}
          />
        )}

        <View style={[styles.content, {backgroundColor: appColors.bg}]}>
          {renderScreen()}

          {/* Drawer Side Menu positioned within main content area (under header, above bottom nav) */}
          <DrawerMenu
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onNavigate={navigateWithAuth}
            onFilterTours={handleFilterTours}
            onOpenCustomTour={() => {
              setDrawerVisible(false);
              navigateTo('enquiry');
            }}
            isLoggedIn={isLoggedIn}
            userPhone={userPhone}
          />
        </View>

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateWithAuth}
          />
        )}

        {/* Fixed Tour Enquiry Modal */}
        <EnquiryModal
          visible={enquiryModalVisible}
          onClose={() => { setEnquiryModalVisible(false); setEnquiryModalTour(null); }}
          tour={enquiryModalTour}
          packageId={enquiryModalPackageId}
          variantId={enquiryModalVariantId}
          user={user}
        />
      </SafeAreaView>
      <Toast config={toastConfig} />
      </AppDialogProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
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
