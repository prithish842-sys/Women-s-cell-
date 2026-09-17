import api from '../utils/api.js';

export type EmergencyTriggerSource = 'IN_APP_SOS' | 'PRESS_AND_HOLD' | 'MULTI_TAP' | 'OTHER';

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface EmergencyContactRecord {
  _id: string;
  id?: string;
  name: string;
  phone: string;
  relationship: string;
  contactType: 'FAMILY' | 'FRIEND' | 'STAFF' | 'SUPPORT' | 'OTHER';
  isStaffContact: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyEventRecord {
  _id: string;
  id?: string;
  userId: string;
  userName: string;
  triggeredAt: string;
  triggerSource: EmergencyTriggerSource;
  locationStatus: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationLink?: string | null;
  messageContent?: string | null;
  notificationStatus: string;
  perContactStatus?: any;
  notificationDetail?: any;
  status: string;
  resolvedAt?: string | null;
  createdAt?: string;
}

export interface EmergencyTriggerResult {
  success: boolean;
  alreadyActive?: boolean;
  message?: string;
  data?: EmergencyEventRecord;
}

/**
 * Emergency geolocation resolver using the browser's Geolocation API.
 * Never runs unless an alert is actually being triggered.
 */
export function currentGeolocation(): Promise<EmergencyLocation | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      },
    );
  });
}

/**
 * Emergency trigger abstraction. Fire-and-forget geolocation capture then
 * dispatch through the authenticated backend route so it is never visible
 * client side and is always logged for audit review.
 */
export async function triggerEmergency(options: {
  triggerSource: EmergencyTriggerSource;
  location?: EmergencyLocation | null;
  message?: string;
  notifyStaffContactsOnly?: boolean;
}): Promise<EmergencyTriggerResult> {
  const payload: Record<string, unknown> = {
    triggerSource: options.triggerSource,
    message: options.message?.trim() || null,
    notifyStaffContactsOnly: Boolean(options.notifyStaffContactsOnly),
    latitude: options.location?.latitude ?? null,
    longitude: options.location?.longitude ?? null,
    locationAccuracy: options.location?.accuracy ?? null,
  };
  const response = await api.post('/emergency/me/trigger', payload);
  return response.data as EmergencyTriggerResult;
}