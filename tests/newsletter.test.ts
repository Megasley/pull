import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("next/navigation", () => ({ redirect: navigation.redirect }));

import { subscribeToNewsletterAction } from "@/app/actions/newsletter";
import {
  exchangeZohoGrantCode,
  resetZohoTokenCache,
  subscribeToZohoCampaignsList,
} from "@/lib/zoho-campaigns/client";

const ENV = {
  ZOHO_CLIENT_ID: "client-id",
  ZOHO_CLIENT_SECRET: "client-secret",
  ZOHO_REFRESH_TOKEN: "refresh-token",
  ZOHO_CAMPAIGNS_LIST_KEY: "list-key",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const fetchMock = vi.fn<typeof fetch>();

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  navigation.redirect.mockClear();
  resetZohoTokenCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function mockZoho(subscribe: Response) {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/oauth/v2/token")) {
      return json({ access_token: "access-token", expires_in: 3600 });
    }
    return subscribe;
  });
}

describe("subscribeToZohoCampaignsList", () => {
  it("posts a form-encoded listsubscribe with the OAuth token", async () => {
    mockZoho(json({ status: "success", code: "0" }));

    await subscribeToZohoCampaignsList("ada@example.com", {
      source: "pullos.dev footer",
      firstName: "Ada",
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toBe("https://campaigns.zoho.com/api/v1.1/json/listsubscribe");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Zoho-oauthtoken access-token",
    });
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("listkey")).toBe("list-key");
    expect(JSON.parse(body.get("contactinfo")!)).toEqual({
      "Contact Email": "ada@example.com",
      "First Name": "Ada",
    });
    expect(body.get("source")).toBe("pullos.dev footer");
  });

  it("reuses the access token across signups", async () => {
    mockZoho(json({ status: "success" }));
    await subscribeToZohoCampaignsList("a@example.com");
    mockZoho(json({ status: "success" }));
    await subscribeToZohoCampaignsList("b@example.com");

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/oauth/v2/token"),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("explains an HTML response as a missing scope", async () => {
    mockZoho(
      new Response("<link href='styles.css'><script></script>", { status: 200 }),
    );
    await expect(subscribeToZohoCampaignsList("ada@example.com")).rejects.toThrow(
      /missing a scope.*ZohoCampaigns\.contact\.UPDATE/,
    );
  });

  it("surfaces Zoho's own error message", async () => {
    mockZoho(json({ status: "error", code: "2501", message: "Listkey is invalid." }));
    await expect(subscribeToZohoCampaignsList("ada@example.com")).rejects.toThrow(
      "Listkey is invalid.",
    );
  });
});

describe("exchangeZohoGrantCode", () => {
  it("returns the refresh token", async () => {
    fetchMock.mockResolvedValue(json({ refresh_token: "new-refresh" }));
    await expect(exchangeZohoGrantCode("code-123")).resolves.toBe("new-refresh");
    const body = new URLSearchParams(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("code-123");
  });

  it("explains an expired or reused code", async () => {
    fetchMock.mockResolvedValue(json({ error: "invalid_code" }));
    await expect(exchangeZohoGrantCode("old")).rejects.toThrow(
      /already used, or expired/,
    );
  });
});

describe("subscribeToNewsletterAction", () => {
  it("subscribes and redirects to the thanks page", async () => {
    mockZoho(json({ status: "success" }));
    await expect(
      subscribeToNewsletterAction(null, form({ email: " ada@example.com " })),
    ).rejects.toThrow("REDIRECT:/newsletter/thanks");

    const body = new URLSearchParams(String(fetchMock.mock.calls[1][1]?.body));
    expect(JSON.parse(body.get("contactinfo")!)["Contact Email"]).toBe(
      "ada@example.com",
    );
  });

  it("sends an optional first name, tidied", async () => {
    mockZoho(json({ status: "success" }));
    await expect(
      subscribeToNewsletterAction(
        null,
        form({ email: "ada@example.com", firstName: "  Ada\u0000  \n Lovelace " }),
      ),
    ).rejects.toThrow("REDIRECT:/newsletter/thanks");

    const body = new URLSearchParams(String(fetchMock.mock.calls[1][1]?.body));
    expect(JSON.parse(body.get("contactinfo")!)).toEqual({
      "Contact Email": "ada@example.com",
      "First Name": "Ada Lovelace",
    });
  });

  it("leaves First Name out when the field is blank", async () => {
    mockZoho(json({ status: "success" }));
    await expect(
      subscribeToNewsletterAction(
        null,
        form({ email: "ada@example.com", firstName: "  " }),
      ),
    ).rejects.toThrow("REDIRECT:/newsletter/thanks");

    const body = new URLSearchParams(String(fetchMock.mock.calls[1][1]?.body));
    expect(JSON.parse(body.get("contactinfo")!)).toEqual({
      "Contact Email": "ada@example.com",
    });
  });

  it("rejects an overly long first name without calling Zoho", async () => {
    await expect(
      subscribeToNewsletterAction(
        null,
        form({ email: "ada@example.com", firstName: "x".repeat(61) }),
      ),
    ).resolves.toMatchObject({ field: "firstName" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email and keeps what was typed", async () => {
    await expect(
      subscribeToNewsletterAction(null, form({ email: "ada@example" })),
    ).resolves.toEqual({
      error: "Enter a valid email address.",
      field: "email",
      email: "ada@example",
      firstName: "",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops honeypot submissions without calling Zoho", async () => {
    await expect(
      subscribeToNewsletterAction(
        null,
        form({ email: "bot@example.com", website: "https://spam.example" }),
      ),
    ).rejects.toThrow("REDIRECT:/newsletter/thanks");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides Zoho's error details from the visitor", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockZoho(new Response("<html>login</html>", { status: 200 }));

    const result = await subscribeToNewsletterAction(
      null,
      form({ email: "ada@example.com" }),
    );

    expect(result).toEqual({
      error: "We couldn't subscribe you just now. Please try again.",
      field: null,
      email: "ada@example.com",
      firstName: "",
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("reports when signups aren't configured", async () => {
    vi.stubEnv("ZOHO_CAMPAIGNS_LIST_KEY", "");
    await expect(
      subscribeToNewsletterAction(null, form({ email: "ada@example.com" })),
    ).resolves.toMatchObject({
      error: "Newsletter signups aren't available right now.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
