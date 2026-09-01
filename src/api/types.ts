import { TravelDocument } from '../types';

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  pagination?: any;
};

export interface UploadedFileData {
  url: string;
  public_id: string;
  folder: string;
  resource_type: string;
  format: string;
  bytes: number;
}

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_mobile: string;
  profile_pic: string;
  source: string;
  is_imported: boolean;
  customer_code: string;
  created_at: string;
  updated_at: string;
}

export interface OtpRequestData {
  identifier: string;
  identifier_type: string;
  expires_in_sec: number;
  dev_otp?: string;
}

export interface AuthTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export type CustomerOtpPurpose =
  | 'LOGIN'
  | 'SIGNUP'
  | 'VERIFY_MOBILE'
  | 'VERIFY_EMAIL'
  | 'DELETE_ACCOUNT';

export interface SessionItem {
  id: string;
  actor_type?: string;
  user_agent?: string;
  ip_address?: string;
  device_name?: string;
  device?: string;
  browser?: string;
  os?: string;
  created_at?: string;
  last_used_at?: string;
  updated_at?: string;
  last_seen?: string;
  expires_at?: string;
  is_current?: boolean;
}

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

export interface Trip {
  id: string;
  enquiry_code?: string;
  destination?: string;
  travel_date?: string;
  pax_no?: number;
  status?: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UserStats {
  journeys_taken: number;
  countries_visited: number;
  total_travel_days: number;
  member_since?: string;
  total_spent?: number;
}

export interface NotificationPreferences {
  push_notifications: boolean;
  newsletter: boolean;
  sms_alerts: boolean;
  email_updates: boolean;
}

export interface Invoice {
  id: string;
  invoice_code?: string;
  destination?: string;
  amount?: number;
  currency?: string;
  booking_date?: string;
  status?: string;
  travel_date?: string;
  [key: string]: any;
}
