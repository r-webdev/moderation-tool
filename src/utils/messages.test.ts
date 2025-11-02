import assert from "node:assert";
import { describe, it } from "node:test";
import { replaceSpoilerHack, stripCode, stripEmoji } from "./messages.js";

describe("utils/messages -> stripCode", () => {
  it("should remove inline code blocks", () => {
    const input = "This is a `code` block.";
    const expected = "This is a  block.";
    const actual = stripCode(input);

    assert.strictEqual(actual, expected);
  });

  it("should remove multiple inline code blocks", () => {
    const input = "Here is `code1` and here is `code2`.";
    const expected = "Here is  and here is .";
    const actual = stripCode(input);

    assert.strictEqual(actual, expected);
  });

  it("should handle strings without code blocks", () => {
    const input = "This string has no code blocks.";
    const expected = "This string has no code blocks.";
    const actual = stripCode(input);

    assert.strictEqual(actual, expected);
  });

  it("should remove code blocks", () => {
    const input = "```function test() { return true; }```";
    const expected = "";
    const actual = stripCode(input);

    assert.strictEqual(actual, expected);
  });
});

describe("utils/messages -> stripEmoji", () => {
  it("should remove emojis", () => {
    const input = "Hello :smile: world :custom_emoji:";
    const expected = "Hello  world ";
    const actual = stripEmoji(input);

    assert.strictEqual(actual, expected);
  });

  it("should handle strings without emojis", () => {
    const input = "This string has no emojis.";
    const expected = "This string has no emojis.";
    const actual = stripEmoji(input);

    assert.strictEqual(actual, expected);
  });
});

describe("utils/messages -> replaceSpoilerHack", () => {
  it("should replace spoiler hack sequences with the default replacement", () => {
    const input = "This is a spoiler ||\u200b|| and another ||\u200b||.";
    const expected = "This is a spoiler [...] and another [...].";
    const actual = replaceSpoilerHack(input);

    assert.strictEqual(actual, expected);
  });

  it("should replace spoiler hack sequences with a custom replacement", () => {
    const input = "Spoiler here ||\u200b||!";
    const expected = "Spoiler here <SPOILER>!";
    const actual = replaceSpoilerHack(input, "<SPOILER>");

    assert.strictEqual(actual, expected);
  });
});
