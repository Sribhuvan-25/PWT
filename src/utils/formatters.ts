
export function formatDate(dateString: string): string {
  // Handle YYYY-MM-DD format properly to avoid timezone issues
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse as local date to avoid UTC interpretation
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  // Fallback for other date formats
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  // Handle YYYY-MM-DD format properly to avoid timezone issues
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse as local date to avoid UTC interpretation
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });
  }
  
  // Fallback for other date formats
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  });
}

export function getRelativeTime(dateString: string): string {
  // Handle YYYY-MM-DD format properly to avoid timezone issues
  let date: Date;
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse as local date to avoid UTC interpretation
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    date = new Date(dateString);
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateString);
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}
