import test from "node:test";
import assert from "node:assert/strict";
import { getToolByHref, tools } from "../../src/lib/tool-catalog";

test("static Android routes keep their tool identity and processing boundary with a trailing slash", () => {
  for (const tool of tools) assert.equal(getToolByHref(`${tool.href}/`), tool);
  assert.equal(getToolByHref("/tools/video-downloader/")?.processingMode, "network");
  assert.equal(getToolByHref("/tools/not-a-tool/"), undefined);
});
