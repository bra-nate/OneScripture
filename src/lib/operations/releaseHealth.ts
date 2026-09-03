export type HealthStatus = "ok" | "warning" | "critical";

export interface ReleaseHealthThresholds {
  failedJobsCritical: number;
  failedJobsWarning: number;
  freeDiskCriticalPercent: number;
  freeDiskWarningPercent: number;
  processingAgeCriticalSeconds: number;
  processingAgeWarningSeconds: number;
  queueAgeCriticalSeconds: number;
  queueAgeWarningSeconds: number;
}

export const DEFAULT_RELEASE_HEALTH_THRESHOLDS: ReleaseHealthThresholds = {
  failedJobsCritical: 5,
  failedJobsWarning: 1,
  freeDiskCriticalPercent: 10,
  freeDiskWarningPercent: 20,
  processingAgeCriticalSeconds: 900,
  processingAgeWarningSeconds: 600,
  queueAgeCriticalSeconds: 600,
  queueAgeWarningSeconds: 120,
};

const STATUS_WEIGHT: Record<HealthStatus, number> = {
  ok: 0,
  warning: 1,
  critical: 2,
};

export function classifyMaximum(
  value: number,
  warningAt: number,
  criticalAt: number,
): HealthStatus {
  if (value >= criticalAt) return "critical";
  if (value >= warningAt) return "warning";
  return "ok";
}

export function classifyMinimum(
  value: number,
  warningAt: number,
  criticalAt: number,
): HealthStatus {
  if (value <= criticalAt) return "critical";
  if (value <= warningAt) return "warning";
  return "ok";
}

export function getAgeSeconds(
  timestamp: string | null,
  now = Date.now(),
): number {
  if (!timestamp) return 0;
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - timestampMs) / 1_000));
}

export function getOverallHealth(statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>((overall, status) =>
    STATUS_WEIGHT[status] > STATUS_WEIGHT[overall] ? status : overall,
  "ok");
}
