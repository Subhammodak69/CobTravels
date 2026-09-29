import React, { useState, useEffect, useCallback } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Linking, Platform, StatusBar, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { COLORS, ThemeProvider, useColors, useAppColorScheme } from './src/theme/theme';
import {
  TourPackageSummary,
  EnquiryData,
  NotificationItem,
  NavScreen,
  TravelDocument,
} from './src/types';
import { fetchTourPackages, fetchMe, fetchEnquiries, fetchWishlist, fetchNotifications, markNotificationRead, markAllNotificationsRead as markAllNotificationsReadApi, getAccessToken, refreshSession, logout as logoutApi, identifyVisitor, getTrackedVisitorId, startVisitorSession, heartbeatVisitorSession, endVisitorSession, trackVisitorEvent, AuthUser, EnquiryRecord, addWishlistItem, removeWishlistItem, validateReferralCode, REFERRAL_CODE_KEY } from './src/api/tourApi';
import { createNotificationSocket, createVisitorSocket } from './src/realtime/socket';

// Components
import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';
import { DrawerMenu } from './src/components/DrawerMenu';

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
import { DocumentViewerScreen } from './src/screens/DocumentViewerScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { ReferralsScreen } from './src/screens/ReferralsScreen';
import { MyTripsScreen, MyEnquiriesScreen, BillsInvoicesScreen } from './src/screens/Tripsinvoicesenquiries';
import { InvoiceDetailsScreen } from './src/screens/InvoiceDetailsScreen';
import { EditEnquiryScreen } from './src/screens/EditEnquiryScreen';
import { EnquiryDetailsScreen } from './src/screens/EnquiryDetailsScreen';
import { BookingDetailsScreen } from './src/screens/BookingDetailsScreen';
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
  const isLoggedInRef = React.useRef(false);
  const authResolvedRef = React.useRef(false);
  const [visitorReady, setVisitorReady] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TravelDocument | null>(null);

  const setRootScreen = React.useCallback((screen: NavScreen) => {
    screenHistory.current = [screen];
    currentScreenRef.current = screen;
    setCurrentScreen(screen);
  }, []);

  const navigateTo = React.useCallback((screen: NavScreen) => {
    if (!isLoggedInRef.current && screen !== 'auth' && screen !== 'splash') {
      setRootScreen('auth');
      return;
    }
    setCurrentScreen(previous => {
      if (previous !== screen) {
        screenHistory.current = [...screenHistory.current, screen];
      }
      return screen;
    });
  }, [setRootScreen]);

  const finishSplash = React.useCallback(() => {
    if (!authResolvedRef.current) return;
    setRootScreen(isLoggedInRef.current ? 'home' : 'auth');
  }, [setRootScreen]);

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
  const [selectedTourSummary, setSelectedTourSummary] = useState<TourPackageSummary | null>(null);
  const [initialTourFilter, setInitialTourFilter] = useState<
    'ALL' | 'DOMESTIC' | 'INTERNATIONAL' | 'FEATURED'
  >('ALL');

  const [prefilledEnquiry, setPrefilledEnquiry] = useState<{
    tourSlug?: string;
    tourTitle?: string;
    variantName?: string;
    variantId?: string;
    packageId?: string;
    destinationId?: string;
    destinationName?: string;
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
        tourTitle: item.subject || item.destination_name || item.destination || 'Travel enquiry',
        destination: item.destination_name || item.destination,
        fullName: item.enquirer_name || '',
        mobile: item.enquirer_phone || '',
        email: item.enquirer_email || '',
        travelDate: item.travel_date || '',
        adults: Number(item.adult_count ?? item.pax_no ?? 0),
        children: Number(item.child_count || 0),
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

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetchNotifications();
      setNotifications((response.items || []).map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: (['OFFER', 'TOUR', 'SYSTEM', 'REMINDER'].includes(item.notification_type)
          ? item.notification_type
          : 'SYSTEM') as NotificationItem['type'],
        timestamp: item.created_at,
        read: Boolean(item.is_read),
        actionSlug: item.data?.slug || item.data?.tour_slug || undefined,
      })));
    } catch {
      setNotifications([]);
    }
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const realtimeSocketRef = React.useRef<any>(null);

  // Drawers and full-screen detail flows
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<import('./src/api/tourApi').CustomerTour | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<import('./src/api/tourApi').Invoice | null>(null);

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
          isLoggedInRef.current = Boolean(profile);
          setUser(profile);
          setIsLoggedIn(Boolean(profile));
          if (profile) {
            await Promise.all([loadWishlist(), loadNotifications()]);
          }
          setUserPhone(profile?.mobile || '');
          if (profile && mounted) {
            // A returning member should never be stopped at the guest splash screen.
            setRootScreen('home');
          }
        } catch {
          isLoggedInRef.current = false;
          setIsLoggedIn(false);
          setUser(null);
        }
        await loadEnquiries();
      }
      if (customerId) identifiedCustomerRef.current = customerId;
      await identifyVisitor(customerId);
      if (mounted) {
        authResolvedRef.current = true;
        if (currentScreenRef.current === 'splash') finishSplash();
        setVisitorReady(true);
      }
    })();
    return () => { mounted = false; };
  }, [finishSplash, loadTours, loadEnquiries, loadWishlist, loadNotifications, setRootScreen]);

  React.useEffect(() => {
    if (!visitorReady) return undefined;

    let mounted = true;
    let notificationSocket: WebSocket | null = null;

    const connect = async () => {
      const visitorSocket = await createVisitorSocket(user?.id || '');
      if (!mounted) {
        visitorSocket.disconnect();
        return;
      }
      realtimeSocketRef.current = visitorSocket;
      const trackedVid = await getTrackedVisitorId();
      visitorSocket.on('connect', () => {
        visitorSocket.emit('visitor_identify', {
          visitor_id: trackedVid || undefined,
          customer_id: user?.id || undefined,
          page: currentScreenRef.current,
          current_url: currentScreenRef.current,
        });
      });
      visitorSocket.on('notification.created', (item: any) => {
        if (!item?.id) return;
        setNotifications(previous => [{
          id: item.id,
          title: item.title,
          message: item.message,
          type: (['OFFER', 'TOUR', 'SYSTEM', 'REMINDER'].includes(item.notification_type)
            ? item.notification_type
            : 'SYSTEM') as NotificationItem['type'],
          timestamp: item.created_at || new Date().toISOString(),
          read: Boolean(item.is_read),
          actionSlug: item.data?.slug || item.data?.tour_slug || undefined,
        }, ...previous.filter(existing => existing.id !== item.id)]);
      });
      visitorSocket.on('connect_error', error => {
        console.warn('Realtime connection failed:', error?.message || error);
      });

      const token = await getAccessToken();
      if (token && mounted) {
        notificationSocket = createNotificationSocket(token, message => {
          if (message?.event !== 'notification.created' || !message?.data) return;
          const item = message.data;
          setNotifications(previous => [{
            id: item.id,
            title: item.title,
            message: item.message,
            type: (['OFFER', 'TOUR', 'SYSTEM', 'REMINDER'].includes(item.notification_type)
              ? item.notification_type
              : 'SYSTEM') as NotificationItem['type'],
            timestamp: item.created_at || new Date().toISOString(),
            read: false,
            actionSlug: item.data?.slug || item.data?.tour_slug || undefined,
          }, ...previous.filter(existing => existing.id !== item.id)]);
        });
      }
    };

    connect();
    return () => {
      mounted = false;
      realtimeSocketRef.current?.disconnect();
      realtimeSocketRef.current = null;
      notificationSocket?.close();
    };
  }, [visitorReady, user?.id]);

  React.useEffect(() => {
    const socket = realtimeSocketRef.current;
    if (socket?.connected) {
      socket.emit('page_view', { path: currentScreen, page: currentScreen });
    }
  }, [currentScreen]);

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
    markAllNotificationsReadApi().catch(() => {});
  };

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    markNotificationRead(item.id).catch(() => {});
    if (item.actionSlug) {
      setSelectedTourSlug(item.actionSlug);
      navigateTo('tour_detail');
    }
  };

  const handleSelectTour = (tour: TourPackageSummary) => {
    setSelectedTourSlug(tour.slug);
    setSelectedTourSummary(tour);
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
    variantId: string;
    destinationId: string;
    travelDate: string;
  }) => {
    const matchedTour = tours.find(t => t.slug === details.tourSlug) || null;
    setPrefilledEnquiry({
      tourSlug: details.tourSlug,
      tourTitle: details.tourTitle,
      variantName: details.variantName,
      variantId: details.variantId,
      packageId: matchedTour?.id || details.tourSlug,
      destinationId: (matchedTour as any)?.destination_id || details.destinationId || '',
      destinationName: matchedTour?.destination || matchedTour?.title || details.tourTitle,
      travelDate: details.travelDate || '',
    });
    navigateTo('enquiry');
    trackVisitorEvent('enquiry_started', currentScreenRef.current, details);
  };

  const handleOpenEnquiryForTour = (tour: import('./src/types').TourPackageSummary) => {
    setPrefilledEnquiry({
      tourSlug: tour.slug,
      tourTitle: tour.title,
      packageId: tour.id,
      destinationId: (tour as any).destination_id || '',
      destinationName: (tour as any).destination || tour.title,
      travelDate: '',
    });
    navigateTo('enquiry');
    trackVisitorEvent('enquiry_started', currentScreenRef.current, { tour_slug: tour.slug, tour_title: tour.title });
  };

  const handleEnquirySubmitted = (enq: EnquiryData) => {
    setEnquiries(prev => [enq, ...prev]);
    setPrefilledEnquiry(null);
    trackVisitorEvent('enquiry_submitted', 'enquiry', { tour_slug: enq.tourSlug, travel_date: enq.travelDate });
  };

  const openEnquiryDetails = (enquiry: EnquiryData) => { setSelectedEnquiry(enquiry); navigateTo('enquiry_details'); };
  const openEnquiryEditor = (enquiry: EnquiryData) => { setSelectedEnquiry(enquiry); navigateTo('edit_enquiry'); };
  const openBookingDetails = (booking: import('./src/api/tourApi').CustomerTour) => { setSelectedBooking(booking); navigateTo('booking_details'); };
  const openInvoiceDetails = (invoice: import('./src/api/tourApi').Invoice) => { setSelectedInvoice(invoice); navigateTo('invoice_details'); };

  const handleLoginSuccess = async (phone: string) => {
    await AsyncStorage.removeItem(REFERRAL_CODE_KEY);
    isLoggedInRef.current = true;
    setIsLoggedIn(true);
    setUserPhone(phone);
    await Promise.all([loadEnquiries(), loadNotifications()]);
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
    isLoggedInRef.current = false;
    setIsLoggedIn(false);
    setUserPhone('');
    setUser(null);
    setSavedTours([]);
    setEnquiries([]);
    identifiedCustomerRef.current = null;
    setDrawerVisible(false);
    setRootScreen('auth');
  };

  const protectedScreens: NavScreen[] = ['profile', 'profile_details', 'edit_profile', 'sessions', 'my_trips', 'my_enquiries', 'edit_enquiry', 'enquiry_details', 'bills_invoices', 'invoice_details', 'booking_details', 'documents', 'document_viewer', 'wishlist', 'referrals', 'notifications'];
  const navigateWithAuth = (screen: NavScreen) => {
    if (protectedScreens.includes(screen) && !isLoggedIn) { navigateTo('auth'); return; }
    navigateTo(screen);
  };

  const openDocumentViewer = (document: TravelDocument) => {
    setSelectedDocument(document);
    navigateTo('document_viewer');
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
            onOpenCustomTour={() => { setPrefilledEnquiry(null); navigateTo('enquiry'); }}
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
            initialTour={selectedTourSummary}
            onBack={goBack}
            onNavigate={navigateWithAuth}
            onStartEnquiry={handleStartEnquiry}
            isSaved={savedTours.includes(selectedTourSlug)}
            onToggleSave={() => toggleSaveTour(selectedTourSlug)}
            isLoggedIn={isLoggedIn}
          />
        );

      case 'enquiry':
        return (
          <EnquiryScreen
            onNavigate={navigateTo}
            onEnquirySubmitted={handleEnquirySubmitted}
            user={user}
            prefilled={prefilledEnquiry}
          />
        );

      case 'auth':
        return (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onSelectNotification={handleSelectNotification}
            onNavigate={navigateTo}
            onRefresh={loadNotifications}
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
          />
        );

      case 'profile_details':
        return <ProfileDetailsScreen user={user} onNavigate={navigateWithAuth} onLogout={handleLogout} onRefresh={async () => { const result = await fetchMe(); setUser(result.data || null); }} />;

      case 'edit_profile':
        return <EditProfileScreen user={user} onSaved={profile => { setUser(profile); setUserPhone(profile.mobile || ''); navigateTo('profile'); }} onNavigate={navigateWithAuth} />;

      case 'sessions':
        return <SessionsScreen onLogout={handleLogout} onNavigate={navigateWithAuth} />;

      case 'notification_settings':
        return <NotificationSettingsScreen isLoggedIn={isLoggedIn} />;

      case 'documents':
        return <DocumentsScreen onNavigate={navigateWithAuth} onOpenDocument={openDocumentViewer} />;

      case 'document_viewer':
        return selectedDocument ? (
          <DocumentViewerScreen
            document={selectedDocument}
            onBack={() => { setSelectedDocument(null); goBack(); }}
          />
        ) : <DocumentsScreen onNavigate={navigateWithAuth} onOpenDocument={openDocumentViewer} />;

      case 'wishlist':
        return <WishlistScreen tours={tours} savedTours={savedTours} onSelectTour={handleSelectTour} onToggleSave={toggleSaveTour} onRefresh={async () => { await Promise.all([loadTours(), loadWishlist()]); }} />;

      case 'referrals':
        return <ReferralsScreen />;

      case 'my_trips':
        return <MyTripsScreen onOpenBooking={openBookingDetails} />;

      case 'my_enquiries':
        return <MyEnquiriesScreen enquiries={enquiries} loading={loadingEnquiries} onRefresh={loadEnquiries} onViewEnquiry={openEnquiryDetails} onEditEnquiry={openEnquiryEditor} />;

      case 'edit_enquiry':
        return selectedEnquiry ? <EditEnquiryScreen enquiry={selectedEnquiry} onSaved={() => { setSelectedEnquiry(null); loadEnquiries(); setRootScreen('my_enquiries'); }} /> : <MyEnquiriesScreen enquiries={enquiries} loading={loadingEnquiries} onRefresh={loadEnquiries} onViewEnquiry={openEnquiryDetails} onEditEnquiry={openEnquiryEditor} />;

      case 'enquiry_details':
        return selectedEnquiry ? <EnquiryDetailsScreen enquiry={selectedEnquiry} onBack={goBack} onEdit={() => navigateTo('edit_enquiry')} /> : <MyEnquiriesScreen enquiries={enquiries} loading={loadingEnquiries} onRefresh={loadEnquiries} onViewEnquiry={openEnquiryDetails} onEditEnquiry={openEnquiryEditor} />;

      case 'bills_invoices':
        return <BillsInvoicesScreen onOpenInvoice={openInvoiceDetails} />;

      case 'invoice_details':
        return selectedInvoice ? <InvoiceDetailsScreen invoice={selectedInvoice} onBack={goBack} /> : <BillsInvoicesScreen onOpenInvoice={openInvoiceDetails} />;

      case 'booking_details':
        return selectedBooking ? <BookingDetailsScreen tour={selectedBooking} onBack={goBack} /> : <MyTripsScreen onOpenBooking={openBookingDetails} />;

      default:
        return (
          <HomeScreen
            tours={tours}
            loading={loadingTours}
            onRefresh={loadTours}
            onSelectTour={handleSelectTour}
            onNavigate={navigateWithAuth}
            onFilterType={handleFilterTours}
            onOpenCustomTour={() => { setPrefilledEnquiry(null); navigateTo('enquiry'); }}
            onEnquireTour={handleOpenEnquiryForTour}
            savedTours={savedTours}
            onToggleSave={toggleSaveTour}
          />
        );
    }
  };

  const bottomNavigationScreens: NavScreen[] = ['home', 'tours', 'enquiry', 'profile'];
  const showHeader = bottomNavigationScreens.includes(currentScreen);

  const showBottomNav =
    currentScreen !== 'splash' &&
    currentScreen !== 'auth' &&
    currentScreen !== 'tour_detail' &&
    currentScreen !== 'document_viewer' &&
    currentScreen !== 'edit_enquiry' &&
    currentScreen !== 'enquiry_details' &&
    currentScreen !== 'invoice_details' &&
    currentScreen !== 'booking_details';

  const getScreenStatusBarConfig = (): { bg: string; barStyle: 'light-content' | 'dark-content' } => {
    if (currentScreen === 'splash') {
      return { bg: appColors.primaryDark, barStyle: 'light-content' };
    }
    if (currentScreen === 'auth') {
      return {
        bg: colorScheme === 'dark' ? appColors.primaryDark : '#FFFFFF',
        barStyle: colorScheme === 'dark' ? 'light-content' : 'dark-content',
      };
    }
    // The shared brand header is used only by the bottom-navigation screens.
    if (showHeader) {
      return {
        bg: appColors.bg,
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

        <KeyboardAvoidingView
          style={[styles.content, {backgroundColor: appColors.bg}]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
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
        </KeyboardAvoidingView>

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={navigateWithAuth}
          />
        )}

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
