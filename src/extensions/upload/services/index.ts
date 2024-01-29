const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");

export default {
  calculateDuration: async (file) => {
    ffmpeg.setFfmpegPath(ffmpegStatic.path);
    ffmpeg.setFfprobePath(ffprobeStatic.path);

    const rootDir = path.resolve(__dirname, "../../../../..");
    const filePath = path.join(rootDir, "public", file.url);

    console.log("FILEPATH:", filePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else {
          const durationInSeconds = metadata.format.duration;
          resolve(durationInSeconds);
        }
      });
    });
  },
};
