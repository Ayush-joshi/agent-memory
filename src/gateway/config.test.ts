import { describe, expect, it } from "vitest";
import { loadGatewayConfig } from "./config.js";
import { TdaiGateway } from "./server.js";

describe("internal Gateway security defaults", () => {
  it("does not allow unauthenticated startup by default", () => {
    const config = loadGatewayConfig();
    expect(config.server.allowInsecureNoAuth).toBe(false);
  });

  it("fails closed before opening a listener when authentication is absent", async () => {
    const gateway = new TdaiGateway({
      server: {
        port: 0,
        host: "127.0.0.1",
        apiKey: undefined,
        allowInsecureNoAuth: false,
        corsOrigins: [],
      },
    });

    await expect(gateway.start()).rejects.toThrow("Gateway authentication is required");
  });
});
