export async function downloadYoutubeMp3(youtubeUrl) {
  try {
    // const filePath =
    // 'uploads/tempYoutubeAudio/System Design for Beginners [lFeYU31TnQ8].mp3';
    const filePath =
      'uploads/tempYoutubeAudio/Top Advance AWS Services Explained - System Design [s2jD2E3YN30].mp3';
    return { filePath };
  } catch (error) {
    throw new Error(`Download error: ${error.message}`);
  }
}
