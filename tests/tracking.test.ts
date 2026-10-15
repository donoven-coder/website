import { afterEach, describe, expect, it, vi } from "vitest";
import { trackLead, trackSchedule } from "../src/lib/tracking";

afterEach(() => vi.unstubAllGlobals());

describe("Meta Pixel events never carry the email", () => {
  it("Lead sends exactly the same parameters as before", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });
    // Even if extra fields (like an email) ever ended up on the answers object, they must not be sent.
    const answers = { trade: "HVAC", ad_budget: "$2,500–$5,000", goal: "More AC installs", fit: "ok", email: "owner@coolair.co" };
    trackLead(answers);
    expect(fbq).toHaveBeenCalledTimes(1);
    const [cmd, event, params, opts] = fbq.mock.calls[0];
    expect([cmd, event]).toEqual(["track", "Lead"]);
    expect(params).toEqual({ content_name: "Discovery call", trade: "HVAC", ad_budget: "$2,500–$5,000", fit: "ok" });
    expect(Object.keys(opts)).toEqual(["eventID"]);
    expect(JSON.stringify(fbq.mock.calls[0])).not.toContain("@");
  });

  it("Schedule sends only the event name: the visitor's answers stay in Cal", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });
    trackSchedule();
    expect(fbq).toHaveBeenCalledTimes(1);
    const [cmd, event, params, opts] = fbq.mock.calls[0];
    expect([cmd, event]).toEqual(["track", "Schedule"]);
    expect(params).toEqual({ content_name: "Discovery call" });
    expect(Object.keys(opts)).toEqual(["eventID"]);
    expect(JSON.stringify(fbq.mock.calls[0])).not.toContain("@");
  });
});
