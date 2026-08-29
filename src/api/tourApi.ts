import AsyncStorage from '@react-native-async-storage/async-storage';
import {Linking, Platform} from 'react-native';
import {SeasonVariant, TourPackageDetail, TourPackageSummary, Review, TravelDocument} from '../types';

export const BASE_API = 'https://coochbehar-travels.onrender.com';
export const OFFICIAL_WHATSAPP = '919832000000';
const ACCESS_TOKEN_KEY = '@cobtravels/access_token';
const REFRESH_TOKEN_KEY = '@cobtravels/refresh_token';
const VISITOR_ID_KEY = '@cobtravels/visitor_id';
export const REFERRAL_CODE_KEY = '@cobtravels/referral_code';
export type ApiEnvelope<T> = {success?: boolean; message?: string; data?: T};
export interface UploadedFileData {
  url: string;
  public_id: string;
  folder: string;
  resource_type: string;
  format: string;
  bytes: number;
}
export interface AuthUser {name:string; mobile:string; email:string; address:string; emergency_contact_name:string; emergency_contact_mobile:string; profile_pic:string; source:string; is_imported:boolean; id:string; customer_code:string; created_at:string; updated_at:string;}
export interface OtpRequestData {identifier:string; identifier_type:string; expires_in_sec:number;}
export interface AuthTokenData {access_token:string; token_type:string; expires_in:number;}
export class ApiError extends Error { constructor(message:string, public status:number) { super(message); this.name = 'ApiError'; } }
const headers = {'Accept':'application/json','Content-Type':'application/json'};

export async function getVisitorId() { let id=await AsyncStorage.getItem(VISITOR_ID_KEY); if(!id){id=`${Date.now()}-${Math.random().toString(36).slice(2,12)}`; await AsyncStorage.setItem(VISITOR_ID_KEY,id);} return id; }
export async function getAccessToken(){return AsyncStorage.getItem(ACCESS_TOKEN_KEY);}
export async function saveTokens(access?:string, refresh?:string){if(access)await AsyncStorage.setItem(ACCESS_TOKEN_KEY,access);if(refresh)await AsyncStorage.setItem(REFRESH_TOKEN_KEY,refresh);}
export async function clearTokens(){await Promise.all([AsyncStorage.removeItem(ACCESS_TOKEN_KEY),AsyncStorage.removeItem(REFRESH_TOKEN_KEY)]);}
async function request<T>(path:string, init:RequestInit={}, auth=false):Promise<T>{const token=auth?await getAccessToken():null;const url=`${BASE_API}${path}`;const res=await fetch(url,{...init,credentials:'include',headers:{...headers,...(token?{Authorization:`Bearer ${token}`}:{}),...(init.headers||{})}});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body?.message||`Request failed (${res.status})`);return body as T;}
function tokens(data:any){return {access:data?.access_token||data?.accessToken||data?.token||data?.data?.access_token,refresh:data?.refresh_token||data?.refreshToken||data?.data?.refresh_token};}
async function authenticated<T>(path:string, init:RequestInit={}):Promise<T>{
  try { return await request<T>(path,init,true); }
  catch (error) { if (await refreshSession()) return request<T>(path,init,true); throw error; }
}
async function getAuthVisitorId(){return (await getTrackedVisitorId()) || (await identifyVisitor()) || '';}
export async function getStoredReferralCode(){return AsyncStorage.getItem(REFERRAL_CODE_KEY);}
export async function requestOtp(identifier:string,purpose:'LOGIN'|'SIGNUP'='LOGIN',referralCode?:string){return request<ApiEnvelope<OtpRequestData>>('/api/v1/auth/otp/request',{method:'POST',body:JSON.stringify({identifier,purpose,visitor_id:await getAuthVisitorId(),...(referralCode?{referral_code:referralCode}:{})})});}
export async function verifyOtp(identifier:string,otp:string,name='',purpose:'LOGIN'|'SIGNUP'='LOGIN',referralCode?:string){const r=await request<ApiEnvelope<AuthTokenData>>('/api/v1/auth/otp/verify',{method:'POST',body:JSON.stringify({identifier,otp,name,purpose,visitor_id:await getAuthVisitorId(),...(referralCode?{referral_code:referralCode}:{})})});const t=tokens(r);if(!t.access)throw new Error('The server did not return an access token.');await saveTokens(t.access,t.refresh);return r;}
export async function refreshSession(){try{const r=await request<ApiEnvelope<AuthTokenData>>('/api/v1/sessions/refresh',{method:'POST'});const t=tokens(r);await saveTokens(t.access);return Boolean(t.access);}catch{return false;}}
export async function logout(all=false){try{await request(`/api/v1/sessions/${all?'logout-all':'logout'}`,{method:'POST'},true);}finally{await clearTokens();}}
export async function fetchMe(){return authenticated<ApiEnvelope<AuthUser>>('/api/v1/auth/me');}
export async function updateMe(payload:Partial<AuthUser>){return authenticated<ApiEnvelope<AuthUser>>('/api/v1/auth/me',{method:'PATCH',body:JSON.stringify(payload)});}
export async function fetchSessions(){return authenticated<ApiEnvelope<any[]>>('/api/v1/sessions/');}
export async function deleteSession(id:string){return authenticated(`/api/v1/sessions/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function fetchWishlist(){return authenticated<ApiEnvelope<any[]> & {pagination?: any}>('/api/v1/wishlist');}
export async function addWishlistItem(slug:string){return authenticated<ApiEnvelope<unknown>>(`/api/v1/wishlist/${encodeURIComponent(slug)}`,{method:'POST'});}
export async function removeWishlistItem(slug:string){return authenticated<ApiEnvelope<unknown>>(`/api/v1/wishlist/${encodeURIComponent(slug)}`,{method:'DELETE'});}
export async function fetchReferralCode(){return authenticated<ApiEnvelope<{referral_code:string}>>('/api/v1/referrals/code');}
export async function validateReferralCode(code:string){return request<ApiEnvelope<{referral_code:string;referrer_name:string}>>(`/api/v1/referrals/invite/${encodeURIComponent(code)}`);}
export async function fetchReferrals(){return authenticated<ApiEnvelope<any[]> & {pagination?: any}>('/api/v1/referrals');}
export async function fetchDocuments(){return authenticated<ApiEnvelope<TravelDocument[]> & {pagination?: any}>('/api/v1/documents');}
export async function uploadDocument(file:{uri:string;name?:string;type?:string}, documentType:string, title:string, description:string){const formData=new FormData();formData.append('file',{uri:file.uri,name:file.name||'document',type:file.type||'application/octet-stream'} as any);formData.append('document_type',documentType);formData.append('title',title);formData.append('description',description);return authenticated<ApiEnvelope<unknown>>('/api/v1/documents',{method:'POST',body:formData,headers:{'Content-Type':undefined as any}});}
export async function downloadDocument(id:string){return authenticated<ApiEnvelope<{document_id:string;file_name:string;download_url:string}>>(`/api/v1/documents/${encodeURIComponent(id)}/download`);}
export async function deleteDocument(id:string){return authenticated<ApiEnvelope<unknown>>(`/api/v1/documents/${encodeURIComponent(id)}`,{method:'DELETE'});}
const VISITOR_SERVER_ID_KEY='@cobtravels/visitor_server_id';
const VISITOR_SESSION_ID_KEY='@cobtravels/visitor_session_id';
const FINGERPRINT_KEY='@cobtravels/fingerprint';
async function getFingerprint(){let value=await AsyncStorage.getItem(FINGERPRINT_KEY);if(!value){value=`mobile-${Date.now()}-${Math.random().toString(36).slice(2,14)}`;await AsyncStorage.setItem(FINGERPRINT_KEY,value);}return value;}
async function getTrackedVisitorId(){return AsyncStorage.getItem(VISITOR_SERVER_ID_KEY);}
export async function identifyVisitor(customerId=''){try{const payload:any={fingerprint:await getFingerprint(),ip_address:'',country:'',state:'',city:'',browser:'',os:Platform.OS,device:'mobile'};if(customerId)payload.customer_id=customerId;const r=await request<ApiEnvelope<any>>('/api/v1/visitors/identify',{method:'POST',body:JSON.stringify(payload)});const id=r.data?.visitor?.id;if(id)await AsyncStorage.setItem(VISITOR_SERVER_ID_KEY,id);return id||await getTrackedVisitorId();}catch{return getTrackedVisitorId();}}
export async function startVisitorSession(landingPage='splash'){const visitor=await getTrackedVisitorId();if(!visitor)return null;try{const r=await request<ApiEnvelope<any>>('/api/v1/visitors/sessions/start',{method:'POST',body:JSON.stringify({visitor_id:visitor,landing_page:landingPage,referrer:'',utm_source:'',utm_medium:'',utm_campaign:'',utm_term:''})});const id=r.data?.id;if(id)await AsyncStorage.setItem(VISITOR_SESSION_ID_KEY,id);return id||null;}catch{return null;}}
export async function heartbeatVisitorSession(currentPage='home',pageViewsDelta=0){const id=await AsyncStorage.getItem(VISITOR_SESSION_ID_KEY);if(!id)return null;try{const r=await request<ApiEnvelope<any>>(`/api/v1/visitors/sessions/${encodeURIComponent(id)}/heartbeat`,{method:'POST',body:JSON.stringify({current_page:currentPage,page_views_delta:pageViewsDelta})});return r.data||null;}catch{return null;}}
export async function endVisitorSession(exitPage=''){const id=await AsyncStorage.getItem(VISITOR_SESSION_ID_KEY);if(!id)return null;await AsyncStorage.removeItem(VISITOR_SESSION_ID_KEY);try{const r=await request<ApiEnvelope<any>>(`/api/v1/visitors/sessions/${encodeURIComponent(id)}/end`,{method:'POST',body:JSON.stringify({exit_page:exitPage})});return r.data||null;}catch{return null;}}
export async function trackVisitorEvent(eventName:string,page='home',eventMetadata:Record<string,any>={}){const visitor=await getTrackedVisitorId();const session=await AsyncStorage.getItem(VISITOR_SESSION_ID_KEY);if(!visitor||!session)return null;try{const r=await request<ApiEnvelope<any>>('/api/v1/visitors/events',{method:'POST',body:JSON.stringify({visitor_id:visitor,session_id:session,event_name:eventName,page,event_metadata:eventMetadata})});return r.data||null;}catch{return null;}}
export async function trackVisitorEventsBatch(events:any[]){if(!events.length)return null;try{const r=await request<ApiEnvelope<any>>('/api/v1/visitors/events/batch',{method:'POST',body:JSON.stringify({events})});return r.data||null;}catch{return null;}}
function variant(v:any,i=0):SeasonVariant{return {id:v.id||`variant-${i}`,key:v.slug||`variant-${i}`,display_order:i,variant_code:v.slug||'',name:v.name||'',badge:v.badge,season_type:'',season_name:v.season_name||'',cover_image:v.banner?.image||v.cover_image||'',banner_video:v.banner?.video||'',valid_from:v.valid_from||'',valid_to:v.valid_to||'',duration:`${v.duration_nights??0}N | ${v.duration_days??0}D`,duration_days:Number(v.duration_days||0),duration_nights:Number(v.duration_nights||0),price:Number(v.price||0),currency:'INR',starting_price:Number(v.price||0),seats:Number(v.seats||0),availability:v.availability||'SOLD_OUT',is_active:true,is_default:i===0,route:(v.route||[]).map((x:any)=>({id:String(x.id||''),place:x.city||x.place||'',nights:Number(x.nights||0)} as any)),highlights:v.highlights||[],dates:(v.departure_dates||v.dates||[]).map((x:any)=>({id:String(x.id||''),date:x.date||''})),gallery:(v.gallery||[]).map((x:any)=>({id:String(x.id||''),photoId:x.url||'',url:x.url,alt:x.alt,type:x.type,display_order:x.display_order})),itinerary:(v.itinerary||[]).map((x:any)=>({id:String(x.id||''),day:String(x.day||''),title:x.title,description:x.description||''})),inclusions:v.inclusions||[],exclusions:v.exclusions||[]};}
function summary(x:any):TourPackageSummary{return {...x,starting_price:Number(x.starting_price??x.price??0),duration_days:Number(x.duration_days??0),duration_nights:Number(x.duration_nights??0),duration:x.duration||'',cover_image:x.cover_image||x.banner?.image||'',banner_video:x.banner_video||x.banner?.video||'',season_name:x.season_name||'',is_featured:Boolean(x.is_featured||x.featured||x.badge),is_active:x.is_active!==false,is_wishlist:Boolean(x.is_wishlist)};}
export async function fetchTourPackages(){const r=await request<ApiEnvelope<any[]>>('/api/v1/tour-packages');return (Array.isArray(r.data)?r.data:[]).map(summary);}
export async function fetchTourDetail(slug:string):Promise<TourPackageDetail>{const r=await request<ApiEnvelope<any>>(`/api/v1/tour-packages/${encodeURIComponent(slug)}`);if(!r.data)throw new Error('Tour package was not found');const d=r.data;return {...d,is_featured:Boolean(d.is_featured),is_active:d.is_active!==false,seasons:[d.default_variant,...(d.other_variants||[])].filter(Boolean).map(variant),reviews:(d.reviews||[]).map((review:any)=>({...review,is_verified:true,review_gallery:(review.review_gallery||[]).map((item:any)=>({id:item.id,url:item.url,alt:item.alt,type:item.type,photoId:item.url}))}))};}
export async function fetchTourVariant(slug:string,variantSlug:string){const r=await request<ApiEnvelope<any>>(`/api/v1/tour-packages/${encodeURIComponent(slug)}/variants/${encodeURIComponent(variantSlug)}`);if(!r.data?.variant)throw new Error('Tour variant was not found');return {variant:variant(r.data.variant),other_variants:r.data.other_variants||[]};}
export interface EnquiryRecord {
  id: string;
  enquiry_type?: string;
  channel?: string;
  package_id?: string;
  variant_id?: string;
  subject?: string;
  message?: string;
  enquiry_code?: string;
  visitor_id?: string;
  customer_id?: string;
  status?: string;
  enquirer_name?: string;
  enquirer_phone?: string;
  room_id?: string;
  vehicle_id?: string;
  destination?: string;
  travel_date?: string;
  travel_duration?: string;
  pax_no?: number;
  no_room?: number;
  vehicle_type?: string;
  meal_plan?: string;
  special_requirements?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export async function fetchEnquiries(): Promise<EnquiryRecord[]> {
  const response = await authenticated<ApiEnvelope<EnquiryRecord[]>>('/api/v1/enquiries');
  return Array.isArray(response.data) ? response.data : [];
}

export interface TourPackageSelectData {
  id: string;
  title: string;
  banner?: {
    image?: string;
    video?: string;
  };
  variants: Array<{
    id: string;
    name: string;
    season_name?: string;
  }>;
}

export async function fetchTourPackageSelect(slug: string): Promise<TourPackageSelectData> {
  const r = await request<ApiEnvelope<TourPackageSelectData>>(`/api/v1/tour-packages/select/${encodeURIComponent(slug)}`);
  if (!r.data) throw new Error('Package options not found');
  return r.data;
}

export async function fetchPackageReviews(slug: string, page = 1, pageSize = 10): Promise<{ reviews: Review[]; pagination?: any }> {
  try {
    const r = await request<ApiEnvelope<any>>(`/api/v1/reviews/package/${encodeURIComponent(slug)}?page=${page}&page_size=${pageSize}`);
    const items = Array.isArray(r.data) ? r.data : (r.data?.items || []);
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

export async function fetchReviewEligibility(slug: string): Promise<{ can_review: boolean; has_reviewed: boolean; review?: any } | null> {
  try {
    const r = await authenticated<ApiEnvelope<{ package_id: string; can_review: boolean; has_reviewed: boolean; review?: any }>>(`/api/v1/reviews/eligibility/${encodeURIComponent(slug)}`);
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

export async function updateReviewApi(reviewId: string, payload: {
  rating?: number;
  review?: string;
  review_gallery?: any[];
}): Promise<ApiEnvelope<unknown>> {
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

export function openWhatsAppChat(text:string,phone=OFFICIAL_WHATSAPP){const encoded=encodeURIComponent(text);const app=`whatsapp://send?phone=${phone}&text=${encoded}`;Linking.canOpenURL(app).then(ok=>Linking.openURL(ok?app:`https://wa.me/${phone}?text=${encoded}`)).catch(()=>Linking.openURL(`https://wa.me/${phone}?text=${encoded}`));}
