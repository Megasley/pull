import { Children, isValidElement, type ReactNode } from "react";

import { ExplainerPlayer } from "./explainer-player";

type SceneProps = {
  /** What the narrator says. Plain language, one or two short sentences. */
  say: string;
  children?: ReactNode;
};

/** One scene of an <Explainer>. Rendered by the player, never on its own. */
export const Scene: (props: SceneProps) => null = () => null;

type ExplainerProps = {
  title: string;
  children?: ReactNode;
};

/**
 * Animated, step-through explainer. Server wrapper: reads <Scene> children
 * and hands serializable scenes to the client player.
 *
 * <Explainer title="How a payment travels">
 *   <Scene say="Alice opens her wallet.">
 *     <Stage><Actor icon="wallet" label="Alice" /></Stage>
 *   </Scene>
 * </Explainer>
 */
export function Explainer({ title, children }: ExplainerProps) {
  const scenes = Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<SceneProps> =>
        isValidElement<SceneProps>(child) && child.type === Scene,
    )
    .map((scene) => ({ say: scene.props.say, visual: scene.props.children }));

  if (scenes.length === 0) {
    return null;
  }

  return <ExplainerPlayer title={title} scenes={scenes} />;
}
