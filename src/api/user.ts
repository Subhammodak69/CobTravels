import { request, authenticated } from './client';
import {
  ApiEnvelope,
  EnquiryRecord,
  Trip,
  Invoice,
  UserStats,
  NotificationPreferences,
  CustomerTour,
  CustomerTourDetail,
  CustomerTourListResult,
  CustomerTourPagination,
  BookingTraveller,
  BookingTravellerInput,
  EnquiryCreateInput,
  EnquiryUpdateInput,
} from './types';
import { TravelDocument } from '../types';

// ── Enquiries ──────────────────────────────────────────────────────────
export async function fetchEnquiries(skip = 0, limit = 50): Promise<EnquiryRecord[]> {
  const response = await authenticated<ApiEnvelope<EnquiryRecord[]>>(
    `/api/v1/enquiries?skip=${skip}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function createEnquiry(payload: EnquiryCreateInput): Promise<ApiEnvelope<EnquiryRecord>> {
  return request<ApiEnvelope<EnquiryRecord>>('/api/v1/enquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEnquiry(
  id: string,
  payload: EnquiryUpdateInput
): Promise<ApiEnvelope<EnquiryRecord>> {
  return authenticated<ApiEnvelope<EnquiryRecord>>(`/api/v1/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEnquiry(id: string): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/enquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Wishlist ───────────────────────────────────────────────────────────
export async function fetchWishlist(): Promise<ApiEnvelope<any[]>> {
  return authenticated<ApiEnvelope<any[]>>('/api/v1/wishlist');
}

export async function addWishlistItem(slug: string): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/wishlist/${encodeURIComponent(slug)}`, {
    method: 'POST',
  });
}

export async function removeWishlistItem(slug: string): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/wishlist/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

// ── Referrals ──────────────────────────────────────────────────────────
export async function fetchReferralCode(): Promise<ApiEnvelope<{ referral_code: string }>> {
  return authenticated<ApiEnvelope<{ referral_code: string }>>('/api/v1/referrals/code');
}

export async function validateReferralCode(
  code: string
): Promise<ApiEnvelope<{ referral_code: string; referrer_name: string }>> {
  return request<ApiEnvelope<{ referral_code: string; referrer_name: string }>>(
    `/api/v1/referrals/invite/${encodeURIComponent(code)}`
  );
}

export async function fetchReferrals(): Promise<ApiEnvelope<any[]>> {
  return authenticated<ApiEnvelope<any[]>>('/api/v1/referrals');
}

// ── Documents ──────────────────────────────────────────────────────────
export async function fetchDocuments(): Promise<ApiEnvelope<TravelDocument[]>> {
  return authenticated<ApiEnvelope<TravelDocument[]>>('/api/v1/documents');
}

export async function uploadDocument(
  file: { uri: string; name?: string; type?: string },
  documentType: string,
  title: string,
  description: string
): Promise<ApiEnvelope<unknown>> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'document',
    type: file.type || 'application/octet-stream',
  } as any);
  formData.append('document_type', documentType);
  formData.append('title', title);
  formData.append('description', description);

  return authenticated<ApiEnvelope<unknown>>('/api/v1/documents', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': undefined as any },
  });
}

export async function downloadDocument(
  id: string
): Promise<ApiEnvelope<{ document_id: string; file_name: string; download_url: string }>> {
  return authenticated<ApiEnvelope<{ document_id: string; file_name: string; download_url: string }>>(
    `/api/v1/documents/${encodeURIComponent(id)}/download`
  );
}

export async function deleteDocument(id: string): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Trips, Invoices, User Stats, Notification Preferences ──────────────
export async function fetchCustomerTours(
  page = 1,
  pageSize = 20
): Promise<CustomerTourListResult> {
  const response = await authenticated<ApiEnvelope<CustomerTour[]>>(
    `/api/v1/customer-tours?page=${page}&page_size=${pageSize}`
  );
  return {
    items: Array.isArray(response.data) ? response.data : [],
    pagination: response.pagination as CustomerTourPagination | undefined,
  };
}

export async function fetchCustomerTour(id: string): Promise<CustomerTourDetail | null> {
  const response = await authenticated<ApiEnvelope<CustomerTour | CustomerTour[]>>(
    `/api/v1/customer-tours/${encodeURIComponent(id)}`
  );
  if (Array.isArray(response.data)) return response.data[0] || null;
  return response.data || null;
}

export async function addCustomerTourTraveller(
  bookingId: string,
  payload: BookingTravellerInput
): Promise<ApiEnvelope<BookingTraveller>> {
  return authenticated<ApiEnvelope<BookingTraveller>>(
    `/api/v1/customer-tours/${encodeURIComponent(bookingId)}/travellers`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function updateCustomerTourTraveller(
  bookingId: string,
  travellerId: string,
  payload: Partial<BookingTravellerInput>
): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(
    `/api/v1/customer-tours/${encodeURIComponent(bookingId)}/travellers/${encodeURIComponent(travellerId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
}

export async function deleteCustomerTourTraveller(
  bookingId: string,
  travellerId: string
): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(
    `/api/v1/customer-tours/${encodeURIComponent(bookingId)}/travellers/${encodeURIComponent(travellerId)}`,
    { method: 'DELETE' }
  );
}

export async function fetchTrips(): Promise<Trip[]> {
  try {
    const response = await fetchCustomerTours();
    return response.items.map((tour) => ({
      ...tour,
      id: tour.id,
      enquiry_code: tour.booking_code,
      destination: tour.destination_name || tour.package?.name || '',
      travel_date: tour.departure_date || '',
      pax_no: tour.travellers?.length || 1,
      subject: tour.variant?.name || tour.package?.name || '',
      status: tour.status || undefined,
    }));
  } catch {
    try {
      const response = await fetchEnquiries();
      return (response || []).filter((trip: Trip) => trip.travel_date || trip.destination);
    } catch {
      return [];
    }
  }
}

export async function fetchUserStats(): Promise<UserStats> {
  try {
    const response = await authenticated<ApiEnvelope<UserStats>>('/api/v1/auth/me/stats');
    return response.data || { journeys_taken: 0, countries_visited: 0, total_travel_days: 0 };
  } catch {
    const trips = await fetchTrips();
    const uniqueDestinations = new Set(trips.map(t => t.destination).filter(Boolean));
    return {
      journeys_taken: trips.length,
      countries_visited: uniqueDestinations.size,
      total_travel_days: 0,
      member_since: new Date().toISOString(),
    };
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await authenticated<ApiEnvelope<NotificationPreferences>>(
      '/api/v1/auth/me/notifications'
    );
    return response.data || {
      push_notifications: true,
      newsletter: true,
      sms_alerts: false,
      email_updates: true,
    };
  } catch {
    return {
      push_notifications: true,
      newsletter: true,
      sms_alerts: false,
      email_updates: true,
    };
  }
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await authenticated<ApiEnvelope<NotificationPreferences>>(
    '/api/v1/auth/me/notifications',
    {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }
  );
  return (response.data || prefs) as NotificationPreferences;
}

export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const response = await authenticated<ApiEnvelope<Invoice[]>>('/api/v1/invoices');
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
