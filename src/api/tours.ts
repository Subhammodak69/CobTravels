import { Linking } from 'react-native';
import { request, authenticated, getAccessToken, BASE_API } from './client';
import {
  ApiEnvelope,
  TourPackageSelectData,
  UploadedFileData,
} from './types';
import {
  SeasonVariant,
  TourPackageDetail,
  TourPackageSummary,
  Review,
} from '../types';

export const OFFICIAL_WHATSAPP = '919832000000';

function formatVariant(v: any, i = 0): SeasonVariant {
  return {
    id: v.id || `variant-${i}`,
    key: v.slug || `variant-${i}`,
    display_order: i,
    variant_code: v.slug || '',
    name: v.name || '',
    badge: v.badge,
    season_type: '',
    season_name: v.season_name || '',
    cover_image: v.banner?.image || v.cover_image || '',
    banner_video: v.banner?.video || '',
    valid_from: v.valid_from || '',
    valid_to: v.valid_to || '',
    duration: `${v.duration_nights ?? 0}N | ${v.duration_days ?? 0}D`,
    duration_days: Number(v.duration_days || 0),
    duration_nights: Number(v.duration_nights || 0),
    price: Number(v.price || 0),
    currency: 'INR',
    starting_price: Number(v.price || 0),
    seats: Number(v.seats || 0),
    availability: v.availability || 'SOLD_OUT',
    is_active: true,
    is_default: i === 0,
    route: (v.route || []).map((x: any) => ({
      id: String(x.id || ''),
      place: x.city || x.place || '',
      nights: Number(x.nights || 0),
    } as any)),
    highlights: v.highlights || [],
    dates: (v.departure_dates || v.dates || []).map((x: any) => ({
      id: String(x.id || ''),
      date: x.date || '',
    })),
    gallery: (v.gallery || []).map((x: any) => ({
      id: String(x.id || ''),
      photoId: x.url || '',
      url: x.url,
      alt: x.alt,
      type: x.type,
      display_order: x.display_order,
    })),
    itinerary: (v.itinerary || []).map((x: any) => ({
      id: String(x.id || ''),
      day: String(x.day || ''),
      title: x.title,
      description: x.description || '',
    })),
    inclusions: v.inclusions || [],
    exclusions: v.exclusions || [],
  };
}

function formatSummary(x: any): TourPackageSummary {
  return {
    ...x,
    starting_price: Number(x.starting_price ?? x.price ?? 0),
    duration_days: Number(x.duration_days ?? 0),
    duration_nights: Number(x.duration_nights ?? 0),
    duration: x.duration || '',
    cover_image: x.cover_image || x.banner?.image || '',
    banner_video: x.banner_video || x.banner?.video || '',
    season_name: x.season_name || '',
    is_featured: Boolean(x.is_featured || x.featured || x.badge),
    is_active: x.is_active !== false,
    is_wishlist: Boolean(x.is_wishlist),
  };
}

export async function fetchTourPackages(): Promise<TourPackageSummary[]> {
  const r = await request<ApiEnvelope<any[]>>('/api/v1/tour-packages');
  return (Array.isArray(r.data) ? r.data : []).map(formatSummary);
}

export async function fetchTourDetail(slug: string): Promise<TourPackageDetail> {
  const r = await request<ApiEnvelope<any>>(`/api/v1/tour-packages/${encodeURIComponent(slug)}`);
  if (!r.data) throw new Error('Tour package was not found');
  const d = r.data;
  return {
    ...d,
    is_featured: Boolean(d.is_featured),
    is_active: d.is_active !== false,
    seasons: [d.default_variant, ...(d.other_variants || [])].filter(Boolean).map(formatVariant),
    reviews: (d.reviews || []).map((review: any) => ({
      ...review,
      is_verified: true,
      review_gallery: (review.review_gallery || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        alt: item.alt,
        type: item.type,
        photoId: item.url,
      })),
    })),
  };
}

export async function fetchTourVariant(slug: string, variantSlug: string) {
  const r = await request<ApiEnvelope<any>>(
    `/api/v1/tour-packages/${encodeURIComponent(slug)}/variants/${encodeURIComponent(variantSlug)}`
  );
  if (!r.data?.variant) throw new Error('Tour variant was not found');
  return {
    variant: formatVariant(r.data.variant),
    other_variants: r.data.other_variants || [],
  };
}

export async function fetchTourPackageSelect(slug: string): Promise<TourPackageSelectData> {
  const r = await request<ApiEnvelope<TourPackageSelectData>>(
    `/api/v1/tour-packages/select/${encodeURIComponent(slug)}`
  );
  if (!r.data) throw new Error('Package options not found');
  return r.data;
}

export async function fetchPackageReviews(
  slug: string,
  page = 1,
  pageSize = 10
): Promise<{ reviews: Review[]; pagination?: any }> {
  try {
    const r = await request<ApiEnvelope<any>>(
      `/api/v1/reviews/package/${encodeURIComponent(slug)}?page=${page}&page_size=${pageSize}`
    );
    const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
    const reviews: Review[] = items.map((review: any) => ({
      id: review.id,
      review_code: review.review_code || '',
      name: review.name || review.reviewer_by || 'Verified Traveler',
      rating: Number(review.rating || 5),
      review: review.review || '',
      is_verified: Boolean(review.is_verified ?? true),
      is_published: Boolean(review.is_published ?? true),
      reviewer_by: review.reviewer_by,
      reviewer_pic: review.reviewer_pic,
      review_gallery: (review.review_gallery || []).map((item: any) => ({
        id: item.id || item.url,
        url: item.url,
        alt: item.alt,
        type: item.type,
        photoId: item.url,
      })),
      created_at: review.created_at || new Date().toISOString(),
    }));
    return { reviews, pagination: (r as any).pagination };
  } catch {
    return { reviews: [] };
  }
}

export async function fetchReviewEligibility(
  slug: string
): Promise<{ can_review: boolean; has_reviewed: boolean; review?: any } | null> {
  try {
    const r = await authenticated<
      ApiEnvelope<{ package_id: string; can_review: boolean; has_reviewed: boolean; review?: any }>
    >(`/api/v1/reviews/eligibility/${encodeURIComponent(slug)}`);
    return r.data || null;
  } catch {
    return null;
  }
}

export async function submitReviewApi(payload: {
  package_id: string;
  rating: number;
  review: string;
  review_gallery?: any[];
}): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>('/api/v1/reviews', {
    method: 'POST',
    body: JSON.stringify({ ...payload, review_gallery: payload.review_gallery || [] }),
  });
}

export async function updateReviewApi(
  reviewId: string,
  payload: {
    rating?: number;
    review?: string;
    review_gallery?: any[];
  }
): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReviewApi(reviewId: string): Promise<ApiEnvelope<unknown>> {
  return authenticated<ApiEnvelope<unknown>>(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  });
}

export async function uploadFileApi(
  file: { uri: string; name?: string; type?: string } | FormData | any
): Promise<ApiEnvelope<UploadedFileData>> {
  const token = await getAccessToken();
  let body: any;

  if (file instanceof FormData) {
    body = file;
  } else if (file && typeof file === 'object' && file.uri) {
    const formData = new FormData();
    const uri = file.uri;
    const filename = file.name || uri.split('/').pop() || 'upload_file';
    let mimeType = file.type;
    if (!mimeType) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'doc') mimeType = 'application/msword';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else mimeType = 'application/octet-stream';
    }
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as any);
    body = formData;
  } else {
    body = file;
  }

  const res = await fetch(`${BASE_API}/api/v1/public/files/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const resBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(resBody?.message || `File upload failed (${res.status})`);
  }
  return resBody as ApiEnvelope<UploadedFileData>;
}

export function openWhatsAppChat(text: string, phone = OFFICIAL_WHATSAPP) {
  const encoded = encodeURIComponent(text);
  const app = `whatsapp://send?phone=${phone}&text=${encoded}`;
  Linking.canOpenURL(app)
    .then(ok => Linking.openURL(ok ? app : `https://wa.me/${phone}?text=${encoded}`))
    .catch(() => Linking.openURL(`https://wa.me/${phone}?text=${encoded}`));
}
