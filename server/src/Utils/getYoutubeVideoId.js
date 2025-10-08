function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Examples
// console.log(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
// // → "dQw4w9WgXcQ"

// console.log(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"));
// // → "dQw4w9WgXcQ"

// console.log(getYouTubeVideoId("invalidlink"));
// // → null

export { getYouTubeVideoId };
