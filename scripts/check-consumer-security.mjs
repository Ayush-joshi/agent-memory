#!/usr/bin/env node

import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "dev-agent-memory-consumer-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }

  return result.stdout?.trim() ?? "";
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

try {
  run(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", tempDir],
    { capture: true },
  );
  const tarballs = readdirSync(tempDir).filter((filename) => filename.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed tarball, found ${tarballs.length}`);
  }
  const [filename] = tarballs;
  const tarballPath = join(tempDir, filename);

  writeFileSync(
    join(tempDir, "package.json"),
    `${JSON.stringify({ name: "consumer-security-check", version: "1.0.0", private: true }, null, 2)}\n`,
  );

  if (commandExists("pnpm")) {
    console.log("Auditing the packed package in a clean pnpm consumer...");
    run("pnpm", ["add", "--ignore-scripts", "--reporter=append-only", tarballPath], { cwd: tempDir });
    run("pnpm", ["audit", "--audit-level=high", "--prod"], { cwd: tempDir });
  } else {
    console.log("pnpm is unavailable; auditing the packed package in a clean npm consumer...");
    run("npm", ["install", "--ignore-scripts", "--no-fund", "--no-audit", tarballPath], { cwd: tempDir });
    run("npm", ["audit", "--audit-level=high", "--omit=dev"], { cwd: tempDir });
  }

  console.log("Clean-consumer security audit passed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
