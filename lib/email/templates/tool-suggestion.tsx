import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

export type ToolSuggestionEmailProps = {
  toolName: string;
  website: string;
  docs: string | null;
  github: string | null;
  category: string;
  buildUseCase: string | null;
  why: string;
  submitterName: string | null;
  submitterEmail: string;
};

export function ToolSuggestionEmail({
  toolName,
  website,
  docs,
  github,
  category,
  buildUseCase,
  why,
  submitterName,
  submitterEmail,
}: ToolSuggestionEmailProps) {
  const fromLabel = submitterName
    ? `${submitterName} <${submitterEmail}>`
    : submitterEmail;

  return (
    <EmailLayout
      preview={`Tool suggestion: ${toolName}`}
      title="New developer tool suggestion"
    >
      <Text style={{ margin: "0 0 12px" }}>
        Someone suggested a tool for the Developer Tools directory.
      </Text>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Tool:</strong> {toolName}
      </Text>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Website:</strong> {website}
      </Text>
      {docs ? (
        <Text style={{ margin: "0 0 8px" }}>
          <strong>Docs:</strong> {docs}
        </Text>
      ) : null}
      {github ? (
        <Text style={{ margin: "0 0 8px" }}>
          <strong>GitHub:</strong> {github}
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Category:</strong> {category}
      </Text>
      {buildUseCase ? (
        <Text style={{ margin: "0 0 8px" }}>
          <strong>Build use case:</strong> {buildUseCase}
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 8px" }}>
        <strong>Why it belongs:</strong> {why}
      </Text>
      <Text style={{ margin: "16px 0 0" }}>
        <strong>From:</strong> {fromLabel}
      </Text>
    </EmailLayout>
  );
}
