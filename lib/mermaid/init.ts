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
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 60,
          diagramPadding: 16,
        },
        themeVariables: {
          fontSize: "14px",
          fontFamily: "inherit",
          clusterBkg: "#0d1117",
          clusterBorder: "#3d4f5f",
        },
      });
    });
  }

  await mermaidInit;
  return mermaid;
}
