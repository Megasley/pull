import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
      <img src={markSrc as unknown as string} width={128} height={128} alt="" />
    </div>,
    { ...size },
  );
}
