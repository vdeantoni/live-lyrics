import { CustomProjectConfig } from "lost-pixel";

export const config: CustomProjectConfig = {
  pageShots: {
    pages: [
      {
        path: "/",
        name: "home-page-portrait",
        viewport: { width: 768, height: 1024 },
      },
      {
        path: "/",
        name: "home-page-landscape",
        viewport: { width: 1024, height: 768 },
      },
    ],
    baseUrl: "http://172.17.0.1:4173",
  },
  lostPixelProjectId: "cmg2v3o380sw0zhcswscbcr96",
  apiKey: process.env.LOST_PIXEL_API_KEY,
};
