import assert from "node:assert";
import { exec } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe("Bot Smoke Tests", () => {
  it("should have valid package.json", async () => {
    const pkg = JSON.parse(await readFile(path.join(__dirname, "..", "package.json"), "utf8"));
    assert.strictEqual(pkg.name, "discord-moderation-tool");
    assert.ok(pkg.version);
    assert.ok(pkg.scripts);
    assert.ok(pkg.scripts.test);
  });

  it("should have required files", () => {
    // Check that source files exist
    assert.ok(existsSync(path.join(__dirname, "..", "src", "index.ts")));
    assert.ok(existsSync(path.join(__dirname, "..", "src", "env.ts")));
    assert.ok(existsSync(path.join(__dirname, "..", "package.json")));
    assert.ok(existsSync(path.join(__dirname, "..", "tsconfig.json")));
  });

  it("should have valid TypeScript configuration", async () => {
    const tsconfig = JSON.parse(
      await readFile(path.join(__dirname, "..", "tsconfig.json"), "utf8")
    );
    assert.ok(tsconfig.compilerOptions);
    assert.strictEqual(tsconfig.compilerOptions.module, "nodenext");
    assert.strictEqual(tsconfig.compilerOptions.target, "ES2022");
  });

  it("should be able to build the project", async () => {
    const distDir = path.join(__dirname, "..", "dist");

    // If dist doesn't exist, run build first
    if (!existsSync(distDir)) {
      try {
        await execAsync("npm run build:ci", { cwd: path.join(__dirname, "..") });
      } catch (error) {
        assert.fail(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Verify build artifacts exist
    assert.ok(existsSync(path.join(distDir, "index.js")), "dist/index.js should exist");
    assert.ok(existsSync(path.join(distDir, "env.js")), "dist/env.js should exist");

    // Check that dist directory has some content
    const distFiles = readdirSync(distDir);
    assert.ok(distFiles.length > 0, "dist directory should contain built files");
  });
});
