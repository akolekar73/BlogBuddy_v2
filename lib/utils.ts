import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ServiceType } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// Cost calculation constants
export const COST_RATES = {
  tavily: 0, // Free tier
  gemini_flash: 0, // Free tier
  gemini_pro: 0, // Free tier
  gemini_embedding: 0, // Free tier
  claude: {
    input: 3 / 1_000_000, // $3 per 1M tokens
    output: 15 / 1_000_000, // $15 per 1M tokens
  },
} as const;

// Calculate cost for a service
export function calculateCost(
  service: ServiceType,
  tokensInput: number,
  tokensOutput: number
): number {
  if (service === 'claude') {
    return (
      tokensInput * COST_RATES.claude.input +
      tokensOutput * COST_RATES.claude.output
    );
  }
  return 0; // Free tier for other services
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

// Format large numbers
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Get autonomy level label
export function getAutonomyLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Guided',
    2: 'Conservative',
    3: 'Balanced',
    4: 'Exploratory',
    5: 'Autonomous',
  };
  return labels[level] || 'Unknown';
}

// Get status badge variant
export function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'published':
      return 'default';
    case 'drafting':
      return 'secondary';
    case 'research':
      return 'outline';
    default:
      return 'default';
  }
}

// Get source type color
export function getSourceTypeColor(sourceType: string): string {
  const colors: Record<string, string> = {
    vc_report: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    blog: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    podcast: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    news: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    documentation: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    other: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  };
  return colors[sourceType] || colors.other;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
