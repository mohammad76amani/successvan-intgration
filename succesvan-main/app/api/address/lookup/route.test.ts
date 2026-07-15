import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const req = (url: string) => ({ url }) as any;

describe("GET /api/address/lookup (integration, Ideal Postcodes)", () => {
  beforeEach(() => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "ak_test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns the list of PAF addresses on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          code: 2000,
          message: "Success",
          result: [
            {
              line_1: "23 Michael Crescent",
              line_2: "",
              line_3: "",
              post_town: "Horley",
              county: "Surrey",
              postcode: "RH6 7LH",
              country: "England",
              latitude: 51.17,
              longitude: -0.16,
              udprn: 12345678,
            },
            {
              line_1: "25 Michael Crescent",
              post_town: "Horley",
              postcode: "RH6 7LH",
              udprn: 12345679,
            },
          ],
        }),
      }),
    );

    const res = await GET(req("http://localhost/api/address/lookup?postcode=RH6%207LH"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.postcode).toBe("RH6 7LH");
    expect(body.data.addresses).toHaveLength(2);
    expect(body.data.addresses[0]).toMatchObject({
      addressLine1: "23 Michael Crescent",
      townCity: "Horley",
      postcode: "RH6 7LH",
      udprn: 12345678,
      id: "12345678",
    });
  });

  it("returns 404 for an unknown postcode (code 4040)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ code: 4040, message: "Postcode not found" }),
      }),
    );

    const res = await GET(req("http://localhost/api/address/lookup?postcode=ZZ99%209ZZ"));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toMatch(/could not find/i);
  });

  it("returns 422 for an invalid postcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ code: 4220, message: "Invalid postcode" }),
      }),
    );

    const res = await GET(req("http://localhost/api/address/lookup?postcode=NOTAPOSTCODE"));
    expect(res.status).toBe(422);
  });

  it("requires a postcode param", async () => {
    const res = await GET(req("http://localhost/api/address/lookup"));
    expect(res.status).toBe(400);
  });

  it("errors clearly when the API key is missing", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "");
    const res = await GET(req("http://localhost/api/address/lookup?postcode=RH6%207LH"));
    expect(res.status).toBe(500);
  });
});
