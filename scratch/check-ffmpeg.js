const ffmpegPath = require('ffmpeg-static');
const { execSync } = require('child_process');
try {
    console.log('FFmpeg Path:', ffmpegPath);
    const version = execSync(`"${ffmpegPath}" -version`).toString().split('\n')[0];
    console.log('FFmpeg Version:', version);
} catch (e) {
    console.error('FFmpeg Error:', e.message);
}
