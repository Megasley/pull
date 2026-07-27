let mermaidInit: Promise<void> | null = null;

export async function getMermaid() {
  const mermaid = (await import("mermaid")).default;

  if (!mermaidInit) {
    mermaidInit = Promise.resolve().then(() => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "dark",
        fontFamily: "inherit",
      });
    });
  }

  await mermaidInit;
  return mermaid;
}
