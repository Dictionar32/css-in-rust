import { readFileSync } from "fs";

const types = readFileSync("packages/domain/core/src/types.ts", "utf-8");

// Test 1: Find TwStyledComponent with multiline generics
const match1 = types.match(/export type TwStyledComponent<([\s\S]+?)>\s*=/);
console.log("Test 1 - Match found:", !!match1);
if (match1) {
  console.log("Generics captured:", match1[1].substring(0, 200));
  console.log("Contains 'Tag extends':", match1[1].includes("Tag extends HtmlTagName"));
}

// Test 2: Find SubComponent implementation
const comp = readFileSync("packages/domain/core/src/createComponent.ts", "utf-8");
const match2 = comp.match(/createSubComponentAccessor[\s\S]{0,500}const SubComponent[\s\S]{0,200}\{[\s\S]{0,100}children[\s\S]{0,100}className/);
console.log("\nTest 2 - Match found:", !!match2);
if (match2) {
  console.log("Contains '...rest':", match2[0].includes("...rest"));
  console.log("Sample:", match2[0].substring(0, 300));
}
