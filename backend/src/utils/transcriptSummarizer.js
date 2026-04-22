import { getAIClient } from '../config/ai.js';
import logger from './logger.js';

// CONFIGURATION
const SUMMARIZER_CONFIG = {
  CHUNK_SIZE_WORDS:    2500,   // words per chunk sent to AI
  CHUNK_OVERLAP_WORDS:  100,   // overlap between chunks (context continuity)
  MAX_CHUNKS:            10,   // safety cap — prevents runaway API costs
  SUMMARY_TARGET_WORDS: 400,   // target words per chunk summary
  FINAL_TARGET_WORDS:  2000,   // target words for final merged summary
  MAX_RETRIES:            2,
};

// TEXT CHUNKING
function splitIntoChunks(text, chunkSize, overlapSize) {
  const words  = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start    = 0;

  while (start < words.length) {
    const end       = Math.min(start + chunkSize, words.length);
    const chunkText = words.slice(start, end).join(' ');

    chunks.push({
      index:     chunks.length,
      text:      chunkText,
      wordCount: end - start,
      startWord: start,
      endWord:   end,
    });

    start += chunkSize - overlapSize;
    if (end === words.length) break;
  }

  return chunks;
}

// PER-CHUNK SUMMARIZATION PROMPT
function buildChunkSummaryPrompt(chunk, chapterTitle, totalChunks) {
  return `
You are extracting educational content for quiz generation.

**Chapter:** "${chapterTitle}"
**Segment:** Part ${chunk.index + 1} of ${totalChunks}

**Raw transcript segment:**
${chunk.text}

**Task:**
Extract and summarize the KEY educational content from this segment.
Focus on:
- Core concepts, definitions, and terminology introduced
- Important facts, numbers, dates, or relationships explained
- Processes, steps, or methodologies described
- Examples that illustrate important points
- Any conclusions or key takeaways

**Rules:**
- Write in clear, concise prose (not bullet points)
- Target ~${SUMMARIZER_CONFIG.SUMMARY_TARGET_WORDS} words
- Preserve technical accuracy — do not paraphrase facts incorrectly
- If this segment contains filler/off-topic content, note it briefly and move on
- Output ONLY the summary text, no preamble

**Summary:**
`.trim();
}

// FINAL MERGE PROMPT
function buildMergePrompt(chunkSummaries, chapterTitle) {
  const numberedSummaries = chunkSummaries
    .map((s, i) => `### Part ${i + 1}\n${s}`)
    .join('\n\n');

  return `
You are preparing educational content for quiz generation.

**Chapter:** "${chapterTitle}"

You have ${chunkSummaries.length} segment summaries from a lecture transcript.
Merge them into a single coherent educational summary.

**Segment Summaries:**
${numberedSummaries}

**Task:**
Create a unified summary that:
- Flows as a single coherent document (not a list of parts)
- Preserves ALL distinct concepts, facts, and key points
- Removes redundancy from overlapping segments
- Maintains logical order and narrative flow
- Is suitable as source material for generating quiz questions
- Targets ~${SUMMARIZER_CONFIG.FINAL_TARGET_WORDS} words

**Rules:**
- Output ONLY the merged summary text
- No section headers like "Part 1", "Part 2"
- No meta-commentary about the summarization process
- Preserve technical terms and specific facts exactly

**Merged Summary:**
`.trim();
}

// AI CALL WITH RETRY
async function callAI(prompt, label = 'AI call') {
  const { client, type } = getAIClient();

  for (let attempt = 0; attempt <= SUMMARIZER_CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (type === 'gemini') {
        const result = await client.generateContent(prompt);
        const text   = result.response.text().trim();
        if (!text) throw new Error('Empty response from AI');
        return text;
      }
      throw new Error(`Unsupported AI provider: ${type}`);
    } catch (err) {
      const isLast = attempt === SUMMARIZER_CONFIG.MAX_RETRIES;
      logger.warn(`${label} failed (attempt ${attempt + 1})`, {
        error: err.message,
        isLast,
      });
      if (isLast) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// MAIN EXPORT
export async function summarizeTranscript(rawText, chapterTitle) {
  const originalWordCount = rawText.split(/\s+/).filter(Boolean).length;

  logger.info('Starting transcript summarization', { chapterTitle, originalWordCount });

  const chunks = splitIntoChunks(rawText, SUMMARIZER_CONFIG.CHUNK_SIZE_WORDS, SUMMARIZER_CONFIG.CHUNK_OVERLAP_WORDS);
  const chunksToProcess = chunks.slice(0, SUMMARIZER_CONFIG.MAX_CHUNKS);

  if (chunks.length > SUMMARIZER_CONFIG.MAX_CHUNKS) {
    logger.warn('Transcript exceeds max chunks, processing first N chunks', {
      totalChunks:     chunks.length,
      processedChunks: SUMMARIZER_CONFIG.MAX_CHUNKS,
    });
  }

  logger.info('Transcript split into chunks', {
    totalChunks:   chunksToProcess.length,
    wordsPerChunk: SUMMARIZER_CONFIG.CHUNK_SIZE_WORDS,
    overlapWords:  SUMMARIZER_CONFIG.CHUNK_OVERLAP_WORDS,
  });

  const CONCURRENCY = 3;
  const chunkSummaries = [];

  for (let i = 0; i < chunksToProcess.length; i += CONCURRENCY) {
    const batch = chunksToProcess.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(chunk =>
        callAI(
          buildChunkSummaryPrompt(chunk, chapterTitle, chunksToProcess.length),
          `Chunk ${chunk.index + 1} summary`
        )
      )
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result     = batchResults[j];
      const chunkIndex = i + j;

      if (result.status === 'fulfilled') {
        chunkSummaries.push(result.value);
      } else {
        logger.error('Chunk summarization failed', {
          chunk: chunkIndex + 1,
          error: result.reason?.message,
        });
        const fallback = chunksToProcess[chunkIndex].text
          .split(/\s+/)
          .slice(0, 300)
          .join(' ') + '...';
        chunkSummaries.push(fallback);
      }
    }
  }

  let finalSummary;

  if (chunkSummaries.length === 1) {
    finalSummary = chunkSummaries[0];
  } else {
    finalSummary = await callAI(buildMergePrompt(chunkSummaries, chapterTitle), 'Merge summaries');
  }

  const summarizedWordCount = finalSummary.split(/\s+/).filter(Boolean).length;
  const compressionRatio    = (summarizedWordCount / originalWordCount * 100).toFixed(1);

  logger.info('Transcript summarization complete', {
    chapterTitle,
    originalWordCount,
    summarizedWordCount,
    chunksProcessed: chunksToProcess.length,
    compressionRatio: `${compressionRatio}%`,
  });

  return {
    summarizedText: finalSummary,
    metadata: {
      originalWordCount,
      summarizedWordCount,
      chunksProcessed: chunksToProcess.length,
      compressionRatio: `${compressionRatio}%`,
    },
  };
}

export async function summarizeIfNeeded(text, chapterTitle, wordLimit = 4000) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount <= wordLimit) {
    return {
      text,
      wasSummarized: false,
      metadata: { originalWordCount: wordCount },
    };
  }

  const result = await summarizeTranscript(text, chapterTitle);

  return {
    text:          result.summarizedText,
    wasSummarized: true,
    metadata:      result.metadata,
  };
}