import { afterEach, describe, expect, it, vi } from "vitest";
import { trackLead, trackSchedule } from "../src/lib/tracking";

afterEach(() => vi.unstubAllGlobals());

describe("Meta Pixel events never carry the email", () => {
  it("Lead and Schedule send exactly the same parameters as before", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });
    // Even if extra fields (like an email) ever ended up on the answers object, they must not be sent.
    const answers = { trade: "HVAC", ad_budget: "$2,500–$5,000", goal: "More AC installs", fit: "ok", email: "owner@coolair.co" };
    trackLead(answers);
    trackSchedule(answers);
    expect(fbq).toHaveBeenCalledTimes(2);
    for (const [i, name] of ["Lead", "Schedule"].entries()) {
      const [cmd, event, params, opts] = fbq.mock.calls[i];
      expect([cmd, event]).toEqual(["track", name]);
      expect(params).toEqual({ content_name: "Discovery call", trade: "HVAC", ad_budget: "$2,500–$5,000", fit: "ok" });
      expect(Object.keys(opts)).toEqual(["eventID"]);
      expect(JSON.stringify(fbq.mock.calls[i])).not.toContain("@");
    }
  });
});
