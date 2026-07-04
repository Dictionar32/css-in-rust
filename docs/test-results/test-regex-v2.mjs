import { readFileSync } from "fs";

const types = readFileSync("packages/domain/core/src/types.ts", "utf-8");

// Test with longer capture
const match1 = types.match(/export type TwStyledComponent<([\s\S]+?)>\s*=\s*\{/);
console.log("Test 1 - Match found:", !!match1);
if (match1) {
  console.log("Full generics:\n", match1[1]);
  console.log("\nContains 'Tag extends HtmlTagName':", match1[1].includes("Tag extends HtmlTagName"));
}

// Test SubComponent with proper pattern
const comp = readFileSync("packages/domain/core/src/createComponent.ts", "utf-8");
const match2 = comp.match(/const SubComponent[\s\S]{0,300}=\s*\(\{[\s\S]{0,200}\}\)/);
console.log("\n\nTest 2 - Match found:", !!match2);
if (match2) {
  console.log("Sample:", match2[0]);
  console.log("\nContains '...rest':", match2[0].includes("...rest"));
}
