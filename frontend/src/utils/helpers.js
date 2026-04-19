/**
 * Format time in seconds to mm:ss
 */
export function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if URL is YouTube
 */
export function isYouTube(url) {
  return url?.includes("youtube.com") || url?.includes("youtu.be");
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeId(url) {
  const match = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/
  );
  return match?.[1] || "";
}

/**
 * Generate unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Reindex array items by orderKey
 */
export function reindex(array, orderKey = "order") {
  return array.map((item, index) => ({
    ...item,
    [orderKey]: index,
  }));
}

/**
 * Safe array filter and reindex
 */
export function removeAndReindex(array, indexToRemove, orderKey = "order") {
  return reindex(
    array.filter((_, i) => i !== indexToRemove),
    orderKey
  );
}

/**
 * Delay function for retries
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay
 */
export function exponentialDelay(attempt, baseDelay = 1000) {
  return baseDelay * Math.pow(2, attempt - 1);
}