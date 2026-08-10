import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Safari-friendly PNG favicon generated at build time (hashed URL busts cache). */
export default async function Icon() {
  const mark = await readFile(join(process.cwd(), "public/pull-mark-dark.png"));
  const markSrc = Uint8Array.from(mark).buffer;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#231e1e",
      }}
    >
      <img src={markSrc as unknown as string} width={22} height={22} alt="" />
    </div>,
    { ...size },
  );
}
