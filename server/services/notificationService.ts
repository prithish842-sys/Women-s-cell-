export interface EmergencyRecipient {
  name: string;
  phone: string;
  relationship: string;
  contactType: EmergencyContactTypeValue;
  isStaffContact: boolean;
}

export type EmergencyContactTypeValue = 'FAMILY' | 'FRIEND' | 'STAFF' | 'SUPPORT' | 'OTHER';

export interface EmergencyNotification {
  recipientName: string;
  phone: string;
  channel: 'PUSH' | 'SMS' | 'EMAIL';
  status: 'SENT' | 'NOT_CONFIGURED' | 'FAILED' | 'BLOCKED';
  detail: string;
  deliveredAt?: Date;
}

export interface EmergencyDispatchResult {
  contact: EmergencyRecipient;
  notifications: EmergencyNotification[];
}

export interface NotificationProvider {
  readonly id: string;
  readonly label: string;
  readonly channel: 'PUSH' | 'SMS' | 'EMAIL';
  isConfigured(): boolean;
  send(options: { to: string; subject: string; body: string }): Promise<void>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Abstraction over outbound notification channels (SMS, e-mail). Providers
 * report whether they are configured from environment variables so the portal
 * never pretends an alert was delivered when no real channel is wired up.
 */
class EmergencyEmailProvider implements NotificationProvider {
  readonly id = 'email';
  readonly label = 'E-mail';
  readonly channel = 'EMAIL' as const;

  isConfigured(): boolean {
    return Boolean(process.env.EMERGENCY_EMAIL_WEBHOOK_URL);
  }

  async send(options: { to: string; subject: string; body: string }): Promise<void> {
    const endpoint = process.env.EMERGENCY_EMAIL_WEBHOOK_URL!;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMERGENCY_EMAIL_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.EMERGENCY_EMAIL_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        text: options.body,
      }),
    });
    if (!response.ok) {
      throw new Error(`E-mail provider responded with ${response.status}`);
    }
  }
}

class EmergencySmsProvider implements NotificationProvider {
  readonly id = 'sms';
  readonly label = 'SMS';
  readonly channel = 'SMS' as const;

  isConfigured(): boolean {
    return Boolean(process.env.EMERGENCY_SMS_WEBHOOK_URL);
  }

  async send(options: { to: string; subject: string; body: string }): Promise<void> {
    const endpoint = process.env.EMERGENCY_SMS_WEBHOOK_URL!;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMERGENCY_SMS_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.EMERGENCY_SMS_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: options.to,
        body: options.body,
      }),
    });
    if (!response.ok) {
      throw new Error(`SMS provider responded with ${response.status}`);
    }
  }
}

function readConfiguredProviders(): NotificationProvider[] {
  const providers: NotificationProvider[] = [
    new EmergencyEmailProvider(),
    new EmergencySmsProvider(),
  ];
  return providers.filter(provider => provider.isConfigured());
}

function desensitizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 7) return 'provider';
  return cleaned.slice(0, -4).replace(/[1-9]/g, '•').replace(/0/g, '*') + cleaned.slice(-4);
}

function buildAlertCopy(alert: { userName: string; locationLink?: string | null; message?: string | null }) {
  const emailSubject = `[EMERGENCY] ${alert.userName} activated the Singa Pen emergency alert`;
  const emailLines = [
    `${alert.userName} triggered an emergency alert through the Singa Pen portal on ${new Date().toLocaleString()}.`,
  ];
  if (alert.locationLink) emailLines.push(``, `Live location: ${alert.locationLink}`);
  if (alert.message) emailLines.push(``, `Message: ${alert.message}`);
  emailLines.push(``, `Please reach out to them immediately.`);

  const smsParts = [`[SP SOS] ${alert.userName} needs help now.`];
  if (alert.locationLink) smsParts.push(`Location: ${alert.locationLink}`);
  if (alert.message) smsParts.push(alert.message.slice(0, 120));

  return {
    subject: emailSubject,
    emailBody: emailLines.join('\n'),
    smsBody: smsParts.join(' '),
  };
}

export class EmergencyNotificationService {
  /**
   * Dispatch an emergency alert to every registered contact through every
   * configured channel. Returns a per-contact/per-channel result. Channels
   * that are not configured (or cannot reach the recipient) are reported
   * honestly as NOT_CONFIGURED / BLOCKED, never as SENT.
   */
  async dispatch(options: {
    contacts: EmergencyRecipient[];
    userName: string;
    locationLink?: string | null;
    message?: string | null;
    requestId: string;
  }): Promise<{
    deliveredCount: number;
    attemptedCount: number;
    notConfiguredCount: number;
    failedCount: number;
    blockedCount: number;
    results: { contact: EmergencyRecipient; notifications: EmergencyNotification[] }[];
  }> {
    const providers = readConfiguredProviders();
    const results: EmergencyDispatchResult[] = [];
    const copy = buildAlertCopy(options);

    for (const contact of options.contacts) {
      const notifications: EmergencyNotification[] = [];

      for (const provider of providers) {
        const recipients = provider.channel === 'EMAIL' ? [contact.phone] : [contact.phone];
        const deliverable = recipients.filter(address => address && address.length > 3);

        if (deliverable.length === 0) {
          notifications.push({
            recipientName: contact.name,
            phone: desensitizePhone(contact.phone),
            channel: provider.channel,
            status: 'BLOCKED',
            detail: `${provider.label} is reachable only with a ${provider.channel === 'EMAIL' ? 'valid e-mail address' : 'phone number'}, none registered.`,
          });
          continue;
        }

        let status: EmergencyNotification['status'];
        let detail: string;
        let deliveredAt: Date | undefined;

        try {
          if (provider.channel === 'EMAIL') {
            await provider.send({ to: deliverable[0], subject: copy.subject, body: copy.emailBody });
          } else {
            await provider.send({ to: deliverable[0], subject: 'SP SOS', body: copy.smsBody });
          }
          status = 'SENT';
          detail = `${provider.label} accepted the alert.`;
          deliveredAt = new Date();
        } catch (error) {
          status = 'FAILED';
          detail = `${provider.label} failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        }

        notifications.push({
          recipientName: contact.name,
          phone: desensitizePhone(contact.phone),
          channel: provider.channel,
          status,
          detail,
          deliveredAt,
        });

        // Pace outbound webhooks to respect provider rate limits.
        await delay(100);
      }

      if (notifications.length === 0) {
        notifications.push({
          recipientName: contact.name,
          phone: desensitizePhone(contact.phone),
          channel: 'PUSH',
          status: 'NOT_CONFIGURED',
          detail: 'No delivery channel is configured for emergency alerts. Ask an administrator to set EMERGENCY_EMAIL_WEBHOOK_URL or EMERGENCY_SMS_WEBHOOK_URL.',
        });
      }

      results.push({ contact, notifications });
    }

    const count = (status: EmergencyNotification['status']) =>
      results.reduce((sum, result) => sum + result.notifications.filter(n => n.status === status).length, 0);

    return {
      deliveredCount: count('SENT'),
      attemptedCount: results.reduce((sum, result) => sum + result.notifications.length, 0),
      notConfiguredCount: count('NOT_CONFIGURED'),
      failedCount: count('FAILED'),
      blockedCount: count('BLOCKED'),
      results,
    };
  }
}

export const emergencyNotificationService = new EmergencyNotificationService();