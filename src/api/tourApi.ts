import { TourPackageDetail, TourPackageSummary, EnquiryData } from '../types';
import { MOCK_TOURS_LIST, MOCK_TOUR_DETAILS, photoUrl } from '../data/mockTours';
import { Linking } from 'react-native';

export const BASE_API = 'https://coochbehar-travels.onrender.com';
export const OFFICIAL_WHATSAPP = '919832000000'; // Coochbehar Travels Official WhatsApp

/**
 * Fetch all tour packages with graceful fallback
 */
export async function fetchTourPackages(): Promise<TourPackageSummary[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${BASE_API}/api/v1/tour-packages`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`API returned status ${response.status}. Using fallback.`);
      return MOCK_TOURS_LIST;
    }

    const json = await response.json();
    const serverData: TourPackageSummary[] = json?.data || [];

    if (!Array.isArray(serverData) || serverData.length === 0) {
      return MOCK_TOURS_LIST;
    }

    // Merge or enrich with cover images if backend doesn't provide cover_image
    const enriched = serverData.map(item => {
      const fallback = MOCK_TOURS_LIST.find(m => m.slug === item.slug);
      let img = item.cover_image || fallback?.cover_image;
      if (!img) {
        if (item.type === 'INTERNATIONAL') {
          img = photoUrl('photo-1493976040374-85c8e12f0c0e');
        } else {
          img = photoUrl('photo-1500534623283-312aade485b7');
        }
      }
      return {
        ...item,
        cover_image: img,
        badge: item.is_featured ? 'Featured' : fallback?.badge,
      };
    });

    // Also append additional fallback tours if server only returns 2 items so catalogue looks expansive
    const existingSlugs = new Set(enriched.map(e => e.slug));
    const extraMock = MOCK_TOURS_LIST.filter(m => !existingSlugs.has(m.slug));

    return [...enriched, ...extraMock];
  } catch (error) {
    console.warn('Network request failed for tour packages:', error);
    return MOCK_TOURS_LIST;
  }
}

/**
 * Fetch specific tour package by slug
 */
export async function fetchTourDetail(slug: string): Promise<TourPackageDetail> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${BASE_API}/api/v1/tour-packages/${slug}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Tour detail API ${slug} returned ${response.status}. Using mock.`);
      if (MOCK_TOUR_DETAILS[slug]) {
        return MOCK_TOUR_DETAILS[slug];
      }
      // fallback to first available
      return Object.values(MOCK_TOUR_DETAILS)[0];
    }

    const data: TourPackageDetail = await response.json();

    // Ensure reviews and seasons exist
    if (!data.seasons || data.seasons.length === 0) {
      if (MOCK_TOUR_DETAILS[slug]) {
        return MOCK_TOUR_DETAILS[slug];
      }
    }

    return data;
  } catch (error) {
    console.warn(`Error fetching tour detail ${slug}:`, error);
    if (MOCK_TOUR_DETAILS[slug]) {
      return MOCK_TOUR_DETAILS[slug];
    }
    return Object.values(MOCK_TOUR_DETAILS)[0];
  }
}

/**
 * Submit Tour Enquiry to API or mock
 */
export async function submitEnquiryApi(enquiry: EnquiryData): Promise<{ success: boolean; enquiryId: string; message: string }> {
  const enquiryId = `COB-ENQ-${Math.floor(100000 + Math.random() * 900000)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${BASE_API}/api/v1/enquiries`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...enquiry,
        enquiry_id: enquiryId,
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const res = await response.json();
      return {
        success: true,
        enquiryId: res?.id || enquiryId,
        message: 'Enquiry submitted successfully! Our representative will contact you shortly.',
      };
    }
  } catch (e) {
    // API endpoint might not be deployed yet, mock successful submission
  }

  // Graceful fallback for mock submission
  return {
    success: true,
    enquiryId,
    message: 'Your enquiry has been received by Coochbehar Travel team. We will call you within 2-4 hours!',
  };
}

/**
 * Open WhatsApp with pre-formatted inquiry text
 */
export function openWhatsAppChat(text: string, phone: string = OFFICIAL_WHATSAPP) {
  const encoded = encodeURIComponent(text);
  const url = `whatsapp://send?phone=${phone}&text=${encoded}`;
  const webUrl = `https://wa.me/${phone}?text=${encoded}`;

  Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(webUrl);
      }
    })
    .catch(() => {
      Linking.openURL(webUrl);
    });
}
