import fetch from 'node-fetch';

/**
 * Validate YouTube URL and get metadata (stable, using oEmbed)
 * @param {string} url - YouTube video URL
 * @returns {Promise<{valid: boolean, metadata?: object, error?: string}>}
 */
async function validateYouTubeUrlWithMeta(url) {
  try {
    // Clean URL (remove extra query params like ?si=)
    const cleanUrl = url.split('?')[0];

    // Fetch metadata from YouTube oEmbed API
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      cleanUrl
    )}&format=json`;
    const res = await fetch(oEmbedUrl);

    if (!res.ok) throw new Error('Video not found');

    const data = await res.json();

    return {
      valid: true,
      metadata: {
        title: data.title,
        author: data.author_name,
      },
    };
  } catch (err) {
    return { valid: false, error: 'Video not found or inaccessible' };
  }
}

export { validateYouTubeUrlWithMeta };
