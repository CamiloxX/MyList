export type PushPayload = {
  title: string;
  body: string;
  /** Path to navigate to when the user taps the notification. */
  url?: string;
  /** Optional icon override; defaults to the app icon. */
  icon?: string;
  /**
   * Tag groups notifications so a newer one replaces an older one on screen
   * instead of stacking. Useful for "new episode of X" updates.
   */
  tag?: string;
};

export type SubscribeResult = { ok: true } | { ok: false; error: string };

/** Who a scheduled notification targets. */
export type ScheduledTarget = "all" | "self";

/** A scheduled notification as surfaced to the admin UI. */
export type ScheduledNotification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  targetUserId: string | null;
  scheduledFor: string;
  sentAt: string | null;
  result: { sent: number; failed: number; pruned: number } | null;
  createdAt: string;
};
