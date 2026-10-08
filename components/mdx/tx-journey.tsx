"use client";

import { useEffect, useRef, useState } from "react";
import { Blocks, Clock, Hammer, PenLine, RotateCcw, Send, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Playable model of one payment: sign → gossip → mempool → mined →
 * confirmations. The learner picks a fee rate and sees how long it waits.
 * Numbers are a teaching model, not live network data.
 */

type FeeId = "low" | "normal" | "high";

const FEES: { id: FeeId; label: string; rate: number }[] = [
  { id: "low", label: "Low", rate: 2 },
  { id: "normal", label: "Normal", rate: 16 },
  { id: "high", label: "High", rate: 50 },
];

/** Transactions per block in this model. Real blocks fit thousands. */
const BLOCK_SPACE = 4;
const CONFIRMATIONS_GOAL = 3;

/** Other people's transactions: some already waiting, more arriving each round. */
const START_POOL = [30, 22, 15, 9, 5, 3];
const ARRIVALS = [[35, 18], [26, 9], [12, 7], [4], [6, 3], [5], [4]];

type Tx = { id: string; rate: number; mine?: boolean };
type Block = { n: number; txs: Tx[] };

type Phase = "idle" | "signing" | "gossip" | "waiting" | "mining" | "done";

type State = {
  phase: Phase;
  lit: number;
  pool: Tx[];
  blocks: Block[];
  minedIn: number | null;
  minutes: number;
  message: string;
};

const PEERS = 7;

const initialState: State = {
  phase: "idle",
  lit: 0,
  pool: START_POOL.map((rate, i) => ({ id: `s${i}`, rate })),
  blocks: [],
  minedIn: null,
  minutes: 0,
  message:
    "Alice wants to pay Bob 0.01 BTC. Pick a fee, then send. Watch where the payment goes.",
};

const sortPool = (pool: Tx[]) => [...pool].sort((a, b) => b.rate - a.rate);

export function TxJourney() {
  const [fee, setFee] = useState<FeeId>("normal");
  const [state, setState] = useState<State>(initialState);
  const run = useRef(0);

  useEffect(() => () => void (run.current += 1), []);

  const update = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  async function send() {
    const id = ++run.current;
    const wait = (ms: number) =>
      new Promise<boolean>((resolve) =>
        window.setTimeout(() => resolve(run.current === id), ms),
      );
    const rate = FEES.find((f) => f.id === fee)!.rate;

    update({
      ...initialState,
      phase: "signing",
      message:
        "Alice's wallet builds the transaction and signs it with her private key. The signature proves the coins are hers.",
    });
    if (!(await wait(1600))) return;

    update({
      phase: "gossip",
      message:
        "The wallet sends it to one node. The node checks the rules, then passes it to its peers. Each peer does the same.",
    });
    for (let lit = 1; lit <= PEERS; lit++) {
      update({ lit });
      if (!(await wait(260))) return;
    }

    // The simulation lives in local variables; state only receives snapshots.
    let pool = sortPool([...initialState.pool, { id: "you", rate, mine: true }]);
    const blocks: Block[] = [];
    let minedIn: number | null = null;

    update({
      phase: "waiting",
      pool,
      message:
        "Every node now holds it in its mempool, a waiting room for transactions that are not in a block yet.",
    });
    if (!(await wait(2200))) return;

    let confirmations = 0;
    for (let round = 0; confirmations < CONFIRMATIONS_GOAL; round++) {
      const arrivals = (ARRIVALS[round] ?? []).map((r, i) => ({
        id: `a${round}-${i}`,
        rate: r,
      }));
      pool = sortPool([...pool, ...arrivals]);
      update({
        phase: "mining",
        pool,
        message:
          confirmations > 0
            ? "More blocks are built on top. Each one makes your payment harder to undo."
            : `Miners fill the next block with the transactions that pay the highest fee rate. Only ${BLOCK_SPACE} fit in this model.`,
      });
      if (!(await wait(confirmations > 0 ? 1300 : 2400))) return;

      const picked = pool.slice(0, BLOCK_SPACE);
      pool = pool.slice(BLOCK_SPACE);
      blocks.push({ n: blocks.length + 1, txs: picked });
      if (minedIn === null && picked.some((t) => t.mine)) minedIn = blocks.length;
      confirmations = minedIn === null ? 0 : blocks.length - minedIn + 1;

      update({
        pool,
        blocks: [...blocks],
        minedIn,
        minutes: blocks.length * 10,
        message:
          minedIn === null
            ? `Block ${blocks.length} is full of higher-paying transactions. Yours still waits in the mempool.`
            : confirmations === 1
              ? `A miner found block ${blocks.length}. Your payment is inside. That is 1 confirmation.`
              : `Block ${blocks.length} is on top. ${confirmations} confirmations.`,
      });
      if (!(await wait(confirmations > 0 ? 1500 : 2400))) return;
    }

    update({
      phase: "done",
      message: `Done. The payment went into block ${minedIn}, after about ${minedIn! * 10} minutes. With ${CONFIRMATIONS_GOAL} confirmations, undoing it would mean redoing the work of ${CONFIRMATIONS_GOAL} blocks.`,
    });
  }

  function reset() {
    run.current += 1;
    setState(initialState);
  }

  const busy = state.phase !== "idle" && state.phase !== "done";
  const confirmations = state.minedIn ? state.blocks.length - state.minedIn + 1 : 0;
  const myRate = FEES.find((f) => f.id === fee)!.rate;

  return (
    <section className="not-prose my-8 border border-ink bg-card shadow-[var(--shadow-off)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 px-4 py-2.5">
        <p className="tech-eyebrow">simulator // follow one payment</p>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <Clock className="size-3" aria-hidden />
          {state.minutes === 0 ? "now" : `+${state.minutes} min`}
        </span>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 border-b border-ink/10 px-4 py-4">
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            fee rate (sat/vB)
          </p>
          <div role="radiogroup" aria-label="Fee rate" className="flex">
            {FEES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={fee === option.id}
                disabled={busy}
                onClick={() => setFee(option.id)}
                className={cn(
                  "-ml-px border px-3 py-1.5 text-left first:ml-0 disabled:cursor-not-allowed",
                  fee === option.id
                    ? "relative z-10 border-ink bg-signal text-signal-foreground"
                    : "border-ink/25 text-muted-foreground hover:text-foreground",
                  busy && fee !== option.id && "opacity-40",
                )}
              >
                <span className="block text-xs font-semibold">{option.label}</span>
                <span className="block font-mono text-[10px]">
                  {option.rate} sat/vB
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          {state.phase === "done" || busy ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-2 border border-ink/25 px-3 font-mono text-xs text-ink hover:border-ink"
            >
              <RotateCcw className="size-4" aria-hidden />
              {state.phase === "done" ? "./try-another-fee" : "./reset"}
            </button>
          ) : null}
          {state.phase === "idle" ? (
            <button
              type="button"
              onClick={() => void send()}
              className="inline-flex h-9 items-center gap-2 border border-ink bg-signal px-4 font-mono text-xs text-signal-foreground shadow-[var(--shadow-off-sm)] transition-transform active:translate-x-px active:translate-y-px active:shadow-none"
            >
              <Send className="size-4" aria-hidden />
              ./sign-and-send
            </button>
          ) : null}
        </div>
      </div>

      {/* Three panels */}
      <div className="grid gap-px bg-ink/10 md:grid-cols-[1fr_1fr_1.15fr]">
        <Panel title="1 // network" icon={<Wallet className="size-3.5" aria-hidden />}>
          <NetworkView phase={state.phase} lit={state.lit} />
        </Panel>

        <Panel title="2 // mempool" icon={<Clock className="size-3.5" aria-hidden />}>
          <ul className="space-y-1">
            {state.pool.slice(0, 7).map((tx) => (
              <li
                key={tx.id}
                className={cn(
                  "ix-row-enter flex items-center justify-between border px-2 py-1 font-mono text-[11px]",
                  tx.mine
                    ? "border-ink bg-signal text-signal-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                <span>{tx.mine ? "your payment" : "someone's tx"}</span>
                <span className="font-semibold">{tx.rate}</span>
              </li>
            ))}
            {state.pool.length > 7 ? (
              <li className="px-2 font-mono text-[10px] text-muted-foreground">
                +{state.pool.length - 7} more waiting
              </li>
            ) : null}
            {state.pool.length === 0 ? (
              <li className="px-2 font-mono text-[10px] text-muted-foreground">
                empty
              </li>
            ) : null}
          </ul>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            sorted by fee rate · {BLOCK_SPACE} fit per block
          </p>
        </Panel>

        <Panel
          title="3 // blockchain"
          icon={<Blocks className="size-3.5" aria-hidden />}
        >
          <div className="flex min-h-[4.5rem] flex-wrap items-center gap-1.5">
            {state.blocks.length === 0 ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                no new blocks yet
              </span>
            ) : null}
            {state.blocks.map((block) => {
              const hasMine = block.txs.some((t) => t.mine);
              return (
                <div
                  key={block.n}
                  className={cn(
                    "ix-block-enter flex size-14 flex-col items-center justify-center border text-center",
                    hasMine
                      ? "border-ink bg-signal text-signal-foreground shadow-[var(--shadow-off-sm)]"
                      : "border-ink/30 bg-background text-muted-foreground",
                  )}
                >
                  <Blocks className="size-4" aria-hidden />
                  <span className="mt-0.5 font-mono text-[10px]">block {block.n}</span>
                  {hasMine ? <span className="font-mono text-[9px]">yours</span> : null}
                </div>
              );
            })}
            {state.phase === "mining" ? (
              <div className="ix-pulse flex size-14 flex-col items-center justify-center border border-dashed border-ink/40 text-muted-foreground">
                <Hammer className="size-4" aria-hidden />
                <span className="mt-0.5 font-mono text-[9px]">mining…</span>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: CONFIRMATIONS_GOAL }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 border border-ink/25 transition-colors duration-300",
                  i < confirmations ? "bg-ink" : "bg-transparent",
                )}
              />
            ))}
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
              {confirmations}/{CONFIRMATIONS_GOAL} conf
            </span>
          </div>
        </Panel>
      </div>

      {/* Narration */}
      <div className="flex items-start gap-3 border-t border-ink/15 px-4 py-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-ink/25 bg-muted/50 text-ink">
          {state.phase === "signing" ? (
            <PenLine className="size-3.5" aria-hidden />
          ) : (
            <Send className="size-3.5" aria-hidden />
          )}
        </span>
        <p
          key={state.message}
          className="ix-explainer-say min-h-[2.75rem] text-sm leading-relaxed text-foreground"
          aria-live="polite"
        >
          {state.message}
        </p>
      </div>
      {state.phase === "done" ? (
        <p className="border-t border-ink/10 bg-muted/30 px-4 py-2 font-mono text-[11px] text-muted-foreground">
          you paid {myRate} sat/vB → confirmed in block {state.minedIn}. Try a different
          fee and compare.
        </p>
      ) : null}
    </section>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="mb-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

/** Wallet on the left, a ring of peers lighting up as the transaction spreads. */
function NetworkView({ phase, lit }: { phase: Phase; lit: number }) {
  const cx = 118;
  const cy = 62;
  const r = 44;
  const peers = Array.from({ length: PEERS }, (_, i) => {
    const angle = Math.PI + (i * 2 * Math.PI) / PEERS;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  // Gossip order: first peer, then its neighbours, outward around the ring.
  const order = [0, 1, 6, 2, 5, 3, 4];
  const isLit = (i: number) => order.indexOf(i) < lit;
  const walletActive = phase === "signing";

  return (
    <svg
      viewBox="0 0 180 124"
      className="h-auto w-full max-w-[15rem]"
      role="img"
      aria-label={`${lit} of ${PEERS} nodes have the transaction`}
    >
      {peers.map((p, i) => {
        const q = peers[(i + 1) % PEERS];
        const on = isLit(i) && isLit((i + 1) % PEERS);
        return (
          <line
            key={`e${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="var(--ink)"
            strokeOpacity={on ? 0.7 : 0.15}
            strokeWidth={on ? 1.5 : 1}
            className="ix-peer"
          />
        );
      })}
      {[0, 2, 4].map((i) => (
        <line
          key={`c${i}`}
          x1={peers[i].x}
          y1={peers[i].y}
          x2={peers[(i + 3) % PEERS].x}
          y2={peers[(i + 3) % PEERS].y}
          stroke="var(--ink)"
          strokeOpacity={0.1}
        />
      ))}
      <line
        x1={22}
        y1={cy}
        x2={peers[0].x}
        y2={peers[0].y}
        stroke="var(--ink)"
        strokeOpacity={lit > 0 ? 0.7 : 0.2}
        strokeDasharray="3 3"
      />
      <g>
        <rect
          x={6}
          y={cy - 14}
          width={28}
          height={28}
          fill={walletActive ? "var(--signal)" : "var(--background)"}
          stroke="var(--ink)"
          className={cn("ix-peer", walletActive && "ix-pulse")}
        />
        <text
          x={20}
          y={cy + 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink)"
          fontFamily="var(--font-mono)"
        >
          A
        </text>
        <text
          x={20}
          y={cy + 26}
          textAnchor="middle"
          fontSize="7"
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono)"
        >
          WALLET
        </text>
      </g>
      {peers.map((p, i) => (
        <circle
          key={`n${i}`}
          cx={p.x}
          cy={p.y}
          r={8}
          fill={isLit(i) ? "var(--signal)" : "var(--background)"}
          stroke="var(--ink)"
          strokeOpacity={isLit(i) ? 1 : 0.35}
          className="ix-peer"
        />
      ))}
      <text
        x={cx}
        y={120}
        textAnchor="middle"
        fontSize="7"
        fill="var(--muted-foreground)"
        fontFamily="var(--font-mono)"
      >
        {lit}/{PEERS} NODES HAVE IT
      </text>
    </svg>
  );
}
