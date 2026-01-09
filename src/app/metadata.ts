// app/metadata.ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Link",
   icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/icon.png",
  },
};
