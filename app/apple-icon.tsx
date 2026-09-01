import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const mark = await readFile(join(process.cwd(), "public/pull-apple-touch-icon-v2.png"));
  const markSrc = Uint8Array.from(mark).buffer;

  return new ImageResponse(
    <img src={markSrc as unknown as string} width={size.width} height={size.height} alt="" />,
    { ...size },
  );
}
