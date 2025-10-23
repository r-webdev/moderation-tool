import { test, describe, it } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "node:util";
import { readFile } from "fs/promises";

const execAsync = promisify(exec);
const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe("Bot Sanity Checks", () => {
  it("should have valid package.json", async () => {
    const pkg = JSON.parse(await readFile(path.join(__dirname, "..", "package.json"), "utf8"));
    assert.strictEqual(pkg.name, "discord-moderation-tool");
    assert.ok(pkg.version);
    assert.ok(pkg.scripts);
    assert.ok(pkg.scripts.test);
  });

  it("should have required files", () => {
    // Check that source files exist
    assert.ok(fs.existsSync(path.join(__dirname, "..", "src", "index.ts")));
    assert.ok(fs.existsSync(path.join(__dirname, "..", "src", "env.ts")));
    assert.ok(fs.existsSync(path.join(__dirname, "..", "package.json")));
    assert.ok(fs.existsSync(path.join(__dirname, "..", "tsconfig.json")));
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
    if (!fs.existsSync(distDir)) {
      try {
        await execAsync("npm run build:ci", { cwd: path.join(__dirname, "..") });
      } catch (error) {
        assert.fail(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Verify build artifacts exist
    assert.ok(fs.existsSync(path.join(distDir, "index.js")), "dist/index.js should exist");
    assert.ok(fs.existsSync(path.join(distDir, "env.js")), "dist/env.js should exist");

    // Check that dist directory has some content
    const distFiles = fs.readdirSync(distDir);
    assert.ok(distFiles.length > 0, "dist directory should contain built files");
  });
});
