# Attributions

Pull is two different things under two different sets of terms. This document
records which is which, and credits every third-party work the curriculum
depends on.

The in-app version of this page lives at [`/credits`](https://pullos.dev/credits)
and is generated from [`lib/attributions.ts`](../lib/attributions.ts). **Update
that module first** — this file mirrors it for people reading the repository.

---

## What is licensed how

| Layer                 | Covers                                                                                                                                                 | Terms                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| **Application code**  | Everything in this repository that makes the product run: `app/`, `components/`, `lib/`, `hooks/`, `scripts/`, `drizzle/`, `types/`, `styles/`, config | [MIT](../LICENSE)                     |
| **Pull curriculum**   | `content/**` lesson text, roadmap JSON, project specs, and original diagrams in `public/lessons/`                                                      | [CC BY-SA 4.0](../content/LICENSE)    |
| **Third-party works** | Books, specifications, docs, and tools linked from lessons                                                                                             | Each work's own license — see below   |
| **Brand**             | The Pull name, wordmark, and logo files in `public/`                                                                                                   | © Pull, not covered by either license |

Linking to a work does not relicense it. Nothing listed below is mirrored,
forked, vendored, or republished by Pull.

### Wording to use publicly

> Pull's application code is open source under the MIT License, and its
> curriculum is open under CC BY-SA 4.0. Lessons link to third-party books,
> specifications, and tools, each of which remains under its own license.

### Wording to avoid

- "All content is MIT licensed" — the curriculum is CC BY-SA, not MIT
- Anything implying Pull owns, relicenses, or open-sourced third-party
  curriculum such as Mastering Bitcoin or Decoding Bitcoin
- Describing linked third-party resources as "Pull content"

---

## How the curriculum uses external sources

1. **Required reading is a link**, never a copy of the source text.
2. **Interactive labs open on the publisher's site.** Pull stores only your
   completion state.
3. **Explanations are written in Pull's own words.** Any direct quote is short
   and attributed inline in the lesson.
4. **Diagrams in `public/lessons/` are original to Pull** unless the lesson
   credits another source.
5. **No third-party curriculum is forked into this repository.**

Contributor-facing version of these rules:
[CONTRIBUTING.md → Content licensing rules](../CONTRIBUTING.md#content-licensing-rules).

---

## Books

Chapter deep links used as required reading.

| Work                                                                | Authors                                                                       | License                                                                                                                                      |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [Mastering Bitcoin](https://github.com/bitcoinbook/bitcoinbook)     | Andreas M. Antonopoulos, David A. Harding, and contributors                   | [CC BY-SA 4.0](https://github.com/bitcoinbook/bitcoinbook/blob/develop/LICENSE) for the tagged print editions; contributions under CC0/CC-BY |
| [Mastering the Lightning Network](https://github.com/lnbook/lnbook) | Andreas M. Antonopoulos, Olaoluwa Osuntokun, René Pickhardt, and contributors | [CC BY-SA 4.0](https://github.com/lnbook/lnbook/blob/develop/LICENSE.md)                                                                     |

> **ShareAlike note.** Both books are CC BY-SA 4.0, the same license as the
> Pull curriculum, so a lesson that did quote them at length would not create a
> license conflict. Pull's rule is still: link, summarise in our own words, do
> not embed — attribution obligations are far easier to honour with a link than
> with a paraphrase that drifts.

## Specifications

Normative references. Lessons explain the specs and link to the canonical text.

| Work                                                             | Stewards                        | License                                                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bitcoin Improvement Proposals](https://github.com/bitcoin/bips) | BIP authors and editors         | Per-BIP; each proposal declares its own ([BIP 2](https://github.com/bitcoin/bips/blob/master/bip-0002.mediawiki) recommends BSD-2-Clause and similar) |
| [Lightning BOLTs](https://github.com/lightning/bolts)            | Lightning protocol contributors | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                             |
| [LNURL specifications (LUDs)](https://github.com/lnurl/luds)     | LNURL contributors              | See upstream repository                                                                                                                               |

## Implementations and libraries

Software builders install or read while completing labs and projects.

| Project                                                                | License                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Bitcoin Core](https://github.com/bitcoin/bitcoin)                     | [MIT](https://github.com/bitcoin/bitcoin/blob/master/COPYING)               |
| [LND](https://github.com/lightningnetwork/lnd)                         | [MIT](https://github.com/lightningnetwork/lnd/blob/master/LICENSE)          |
| [Core Lightning](https://github.com/ElementsProject/lightning)         | [BSD-MIT](https://github.com/ElementsProject/lightning/blob/master/LICENSE) |
| [Lightning Dev Kit](https://github.com/lightningdevkit/rust-lightning) | Apache-2.0 OR MIT                                                           |
| [Bitcoin Dev Kit](https://github.com/bitcoindevkit/bdk)                | Apache-2.0 OR MIT                                                           |
| [rust-bitcoin](https://github.com/rust-bitcoin/rust-bitcoin)           | [CC0-1.0](https://github.com/rust-bitcoin/rust-bitcoin/blob/master/LICENSE) |
| [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)            | [MIT](https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/LICENSE)       |

## Learning resources and tools

Companion material linked from study plans.

| Resource                                                         | Steward                        | Terms                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [Decoding Bitcoin](https://bitcoindevs.xyz/decoding)             | Bitcoin Dev Project            | See upstream site and [repositories](https://github.com/bitcoin-dev-project) — Pull deep-links to labs only |
| [Bitcoin Search](https://bitcoinsearch.xyz)                      | Bitcoin Dev Project            | See upstream site — Pull generates query links                                                              |
| [Bitcoin Optech](https://bitcoinops.org)                         | Bitcoin Optech contributors    | See upstream site                                                                                           |
| [Bitcoin developer documentation](https://developer.bitcoin.org) | Documentation contributors     | See upstream site                                                                                           |
| [Polar](https://lightningpolar.com)                              | Jamal Jackson and contributors | [MIT](https://github.com/jamaljsr/polar/blob/master/LICENSE)                                                |
| [mempool.space](https://mempool.space)                           | mempool.space contributors     | See [upstream repository](https://github.com/mempool/mempool)                                               |

---

## Curriculum reviewers

People who helped review Pull curriculum. Add names in
[`lib/attributions.ts`](../lib/attributions.ts) (`curriculumReviewers`) — this
section mirrors that list.

| Reviewer               | Profile                                                  | Note              |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| Camillarhi             | [github.com/Camillarhi](https://github.com/Camillarhi)   | Curriculum review |
| Olaniran               | [github.com/heyolaniran](https://github.com/heyolaniran) | Curriculum review |
| Mubarak Muhammad Aminu | [github.com/mubarak23](https://github.com/mubarak23)     | Curriculum review |

---

## Application dependencies

Runtime and build dependencies are declared in [`package.json`](../package.json)
and carry their own licenses. Generate a current report with:

```bash
npx license-checker --summary
```

---

## Corrections

Maintainers who want an attribution corrected, a license updated, or a
reference removed can email **hello@pullos.dev** or open an issue.

Licenses here were recorded as published upstream at the time of writing.
Upstream terms can change — always check the source.

**Last verified:** July 2026
