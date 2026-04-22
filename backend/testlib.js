// test-transcript.js
import { Innertube } from 'youtubei.js';

const TEST_VIDEO = 'https://www.youtube.com/watch?v=OmJ-4B-mS-Y';

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// -------------------------------
// Transcript builder
// -------------------------------
function buildTranscript(events) {
  if (!Array.isArray(events)) return '';

  return events
    .filter(e => e.segs?.length)
    .map(e =>
      e.segs
        .map(s => s.utf8 ?? '')
        .join('')
        .replace(/\n/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// -------------------------------
// Main transcript fetcher
// -------------------------------
async function fetchTranscript(yt, videoId) {
  const info = await yt.getInfo(videoId);

  const tracks = info.captions?.caption_tracks ?? [];
  if (!tracks.length) {
    throw new Error('No caption tracks found');
  }

  // Prefer English
  const preferred =
    tracks.find(t => t.language_code?.startsWith('en') && t.kind !== 'asr') ||
    tracks.find(t => t.language_code?.startsWith('en')) ||
    tracks[0];

  const url = `${preferred.base_url}&fmt=json3`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CDN fetch failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  return buildTranscript(data.events);
}

// -------------------------------
// Main
// -------------------------------
async function main() {
  console.log('Loading Innertube...');

  const yt = await Innertube.create({
    generate_session_locally: true,
    lang: 'en',
    location: 'US',
  });

  const videoId = extractVideoId(TEST_VIDEO);

  if (!videoId) {
    throw new Error('Invalid video URL');
  }

  console.log('Video ID:', videoId);

  console.log('Fetching transcript...');

  try {
    const transcript = await fetchTranscript(yt, videoId);

    console.log('\n================ FULL TRANSCRIPT ================\n');
    console.log(transcript);
    console.log('\n=================================================\n');
  } catch (err) {
    console.error('Failed to fetch transcript:', err.message);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});