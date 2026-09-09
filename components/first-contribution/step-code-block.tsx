export function StepCodeBlock({ code }: { code: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-none border border-border bg-[#0d1117] p-4 text-sm text-[#e6edf3]">
      <code className="font-mono text-[0.85em] whitespace-pre">{code}</code>
    </pre>
  );
}
