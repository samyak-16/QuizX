// utils/validateYouTube.js
import ytdl from 'ytdl-core';

/**
 * Validate YouTube URL and get metadata
 * @param {string} url - YouTube video URL
 * @returns {Promise<{valid: boolean, metadata?: object, error?: string}>}
 */
async function validateYouTubeUrlWithMeta(url) {
  // 1️⃣ Check URL format
  const regex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/;
  if (!regex.test(url)) return { valid: false, error: 'Invalid URL format' };

  // 2️⃣ Check if video exists and fetch metadata
  try {
    const info = await ytdl.getInfo(url);
    const { title, author, lengthSeconds, videoId } = info.videoDetails;

    return {
      valid: true,
      metadata: {
        title,
        author: author.name,
        duration: parseInt(lengthSeconds), // in seconds
        videoId,
      },
    };
  } catch (err) {
    return { valid: false, error: 'Video not found or inaccessible' };
  }
}
export { validateYouTubeUrlWithMeta };
