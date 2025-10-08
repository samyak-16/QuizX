import YoutubeMp3Downloader from 'youtube-mp3-downloader';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { getYouTubeVideoId } from './getYoutubeVideoId.js';

export function downloadYoutubeMp3(url) {
  return new Promise((resolve, reject) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return reject(new Error('Invalid YouTube URL'));

    const outputPath = './downloads';

    const YD = new YoutubeMp3Downloader({
      ffmpegPath: ffmpegPath.path,
      outputPath,
      youtubeVideoQuality: 'highestaudio',
      queueParallelism: 2,
      progressTimeout: 2000,
    });

    // Start download
    YD.download(videoId);

    YD.on('finished', (err, data) => {
      if (err) return reject(err);

      // Construct full file path
      const filePath = path.join(outputPath, data.file);
      resolve({ filePath });
    });

    YD.on('error', (err) => reject(err));
  });
}
