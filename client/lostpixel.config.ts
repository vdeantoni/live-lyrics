import type { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  customShots: {
    currentShotsPath: "./client/lost-pixel",
  },
  // Lost Pixel Platform configuration
  lostPixelProjectId: "cmg2v3o380sw0zhcswscbcr96",
  apiKey: process.env.LOST_PIXEL_API_KEY,
  // Allow up to 1% difference before failing (0.01 = 1%, values < 1 are percentages)
  threshold: 0.01,
};
