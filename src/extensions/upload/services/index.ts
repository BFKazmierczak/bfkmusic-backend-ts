const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");

export default {
  calculateDuration: async (file) => {
    // ffmpeg.setFfmpegPath(ffmpegPath);
    // ffmpeg.setFfprobePath(ffprobeStatic.path);

    const rootDir = path.resolve(__dirname, "../../../../..");
    const filePath = path.join(rootDir, "public", file.url);

    console.log({ filePath });

    console.log({ ffmpegPath });
    console.log(ffprobeStatic.path);
    console.log("FILEPATH:", filePath);
    console.log({ ffmpeg });

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(`ERROR OBTAINING DURATION: ${err}`);
        else {
          const durationInSeconds = metadata.format.duration;
          resolve(durationInSeconds);
        }
      });
    });
  },
};
