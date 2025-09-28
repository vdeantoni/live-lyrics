import { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  customShots: {
    currentShotsPath: "./lost-pixel",
  },
  // Lost Pixel Platform configuration
  lostPixelProjectId: "cmg2v3o380sw0zhcswscbcr96",
  apiKey: process.env.LOST_PIXEL_API_KEY,
};
