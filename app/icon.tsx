import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Safari-friendly PNG favicon generated at build time (hashed URL busts cache). */
export default async function Icon() {
  const mark = await readFile(join(process.cwd(), "public/pull-icon-v2.png"));
  const markSrc = Uint8Array.from(mark).buffer;

  return new ImageResponse(
    <img src={markSrc as unknown as string} width={size.width} height={size.height} alt="" />,
    { ...size },
  );
}
