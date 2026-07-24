import {
  Children,
  isValidElement,
  type ReactNode,
} from "react";

import { MermaidDiagram } from "./mermaid-diagram";

type MermaidProps = {
  chart?: string;
  caption?: string;
  className?: string;
  children?: ReactNode;
};

function childrenToText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return childrenToText(child.props.children);
      }

      return "";
    })
    .join("");
}

/** Server wrapper: extract MDX children, pass a serializable string to the client. */
export function Mermaid({ chart, caption, className, children }: MermaidProps) {
  const source = (chart ?? childrenToText(children)).trim();

  return (
    <MermaidDiagram chart={source} caption={caption} className={className} />
  );
}
