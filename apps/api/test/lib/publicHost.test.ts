import { describe, expect, it } from "vitest";
import { assertPublicHost, isPrivateAddress } from "../../src/lib/publicHost.js";

describe("isPrivateAddress", () => {
  it("flags loopback, private, link-local and carrier ranges, including IPv6 and mapped IPv4", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.3.4", "172.31.255.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "224.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });
  it("lets public addresses through", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "192.169.0.1", "2606:4700:4700::1111", "100.63.0.1"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
});

describe("assertPublicHost", () => {
  it("accepts a host that resolves publicly and refuses one that resolves inward or not at all", async () => {
    await expect(assertPublicHost("clinic.ca", async () => ["93.184.216.34"])).resolves.toBeUndefined();
    await expect(assertPublicHost("evil.example", async () => ["93.184.216.34", "10.0.0.1"])).rejects.toThrow();
    await expect(assertPublicHost("nowhere.example", async () => [])).rejects.toThrow();
    await expect(assertPublicHost("127.0.0.1")).rejects.toThrow();
  });
});
