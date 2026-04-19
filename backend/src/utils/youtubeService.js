import { Innertube } from 'youtubei.js';
import logger from './logger.js';

// ─── Cache ───
const transcriptCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX = 500;

// ─── YouTube client singleton (IMPORTANT for performance)
let ytClient = null;

async function getYTClient() {
  if (ytClient) return ytClient;
  ytClient = await Innertube.create();
  return ytClient;
}

/**
 * Extract YouTube video ID
 */
export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Clean transcript
 */
function cleanTranscriptText(text) {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Cache eviction (LRU-style simple)
 */
function evictCache() {
  if (transcriptCache.size <= CACHE_MAX) return;

  const keys = transcriptCache.keys();
  const removeCount = transcriptCache.size - CACHE_MAX;

  for (let i = 0; i < removeCount; i++) {
    transcriptCache.delete(keys.next().value);
  }
}

/**
 * Fetch transcript safely (youtubei.js version)
 */
export async function fetchTranscriptSafe(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  // ── Cache hit
  const cached = transcriptCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { text: cached.text, source: 'transcript' };
  }

  try {
    const yt = await getYTClient();

    const info = await yt.getInfo(videoId);

    let transcriptData;
    try {
      transcriptData = await info.getTranscript();
    } catch (err) {
      logger?.debug?.('Transcript not available', { videoId });
      return null;
    }

    const segments =
      transcriptData?.transcript?.content?.body?.initial_segments;

    if (!segments || segments.length === 0) return null;

    const rawText = segments
      .map(s => s.snippet?.text || '')
      .join(' ');

    const cleanedText = cleanTranscriptText(rawText);

    if (cleanedText.length < 30) return null;

    // ── Cache store
    transcriptCache.set(videoId, {
      text: cleanedText,
      timestamp: Date.now(),
    });

    evictCache();

    return { text: cleanedText, source: 'transcript' };

  } catch (error) {
    logger?.debug?.('Transcript fetch failed', {
      videoId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get lecture content
 */
export async function getLectureContent(lecture) {
  const result = {
    lectureId: lecture.lectureId,
    lectureTitle: lecture.lectureTitle,
    text: '',
    source: 'unavailable',
  };

  if (lecture.lectureUrl) {
    const transcript = await fetchTranscriptSafe(lecture.lectureUrl);
    if (transcript) {
      result.text = transcript.text;
      result.source = 'transcript';
      return result;
    }
  }

  if (lecture.lectureDescription?.trim().length >= 50) {
    result.text = lecture.lectureDescription.trim();
    result.source = 'description';
    return result;
  }

  return result;
}

/**
 * Get chapter content
 */
export async function getChapterContent(chapter) {
  const lectureStatuses = [];
  const contentSources = {
    transcript: 0,
    description: 0,
    unavailable: 0,
  };

  const contentParts = [];
  let wordCount = 0;
  const WORD_LIMIT = 4000;

  const lectures = chapter.chapterContent || [];

  // Fetch all lectures in parallel
  const lecturePromises = lectures.map(lecture =>
    getLectureContent(lecture)
  );
  const lectureResults = await Promise.all(lecturePromises);

  // Process results in order
  for (const res of lectureResults) {
    lectureStatuses.push({
      lectureId: res.lectureId,
      lectureTitle: res.lectureTitle,
      source: res.source,
    });

    contentSources[res.source]++;

    if (res.source !== 'unavailable' && res.text) {
      const words = res.text.split(/\s+/);

      if (wordCount + words.length <= WORD_LIMIT) {
        contentParts.push(
          `--- Lecture: ${res.lectureTitle} ---\n${res.text}`
        );
        wordCount += words.length;
      } else {
        const remaining = WORD_LIMIT - wordCount;

        if (remaining > 50) {
          contentParts.push(
            `--- Lecture: ${res.lectureTitle} ---\n${words
              .slice(0, remaining)
              .join(' ')}...`
          );
        }
        break;
      }
    }
  }

  const fullContent = contentParts.length
    ? `Chapter: ${chapter.chapterTitle}\n\n${contentParts.join('\n\n')}`
    : '';

  return {
    content: fullContent,
    lectureStatuses,
    contentSources,
    hasContent: fullContent.length > 100,
  };
}