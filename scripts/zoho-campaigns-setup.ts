/**
 * One-time Zoho Campaigns setup for the newsletter. Reads .env.local.
 *
 *   npm run newsletter:zoho -- token <grant-code>   # prints ZOHO_REFRESH_TOKEN
 *   npm run newsletter:zoho -- lists                # prints list keys
 *   npm run newsletter:zoho -- check                # verifies config, no writes
 *
 * Grant code: api-console.zoho.com → Self Client → Generate Code, with scope
 * "ZohoCampaigns.contact.UPDATE,ZohoCampaigns.contact.READ".
 */
import { loadEnvConfig } from "@next/env";

import {
  exchangeZohoGrantCode,
  listZohoCampaignsMailingLists,
  ZOHO_CAMPAIGNS_SCOPES,
} from "@/lib/zoho-campaigns/client";
import {
  getZohoCampaignsListKey,
  isZohoCampaignsConfigured,
} from "@/lib/zoho-campaigns/env";

// The env helpers read process.env at call time, so loading here is early enough.
loadEnvConfig(process.cwd());

const [command, arg] = process.argv.slice(2);

async function main() {
  if (command === "token") {
    if (!arg) throw new Error("Usage: token <grant-code>");
    const refreshToken = await exchangeZohoGrantCode(arg.trim());
    console.log("Add this to .env.local and to Vercel (Production + Preview):\n");
    console.log(`ZOHO_REFRESH_TOKEN=${refreshToken}`);
    return;
  }

  if (command === "lists") {
    const lists = await listZohoCampaignsMailingLists();
    if (lists.length === 0) {
      console.log("No mailing lists found. Create one in Zoho Campaigns first.");
      return;
    }
    for (const list of lists) console.log(`${list.listkey}  ${list.listname}`);
    console.log("\nSet ZOHO_CAMPAIGNS_LIST_KEY to the key of the newsletter list.");
    return;
  }

  if (command === "check") {
    if (!isZohoCampaignsConfigured()) {
      throw new Error(
        "Missing one of ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_CAMPAIGNS_LIST_KEY.",
      );
    }
    const lists = await listZohoCampaignsMailingLists();
    const key = getZohoCampaignsListKey();
    const match = lists.find((list) => list.listkey === key);
    if (!match) throw new Error(`ZOHO_CAMPAIGNS_LIST_KEY doesn't match any list.`);
    console.log(`OK — token works and signups go to "${match.listname}".`);
    return;
  }

  console.log(
    `Commands: token <grant-code> | lists | check\nRequired scopes: ${ZOHO_CAMPAIGNS_SCOPES.join(",")}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
