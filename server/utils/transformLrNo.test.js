/**
 * Test file to verify lrNo transformation logic
 * Run with: node server/utils/transformLrNo.test.js
 */

import transformLrNoString from "./transformLrNo.js";

const testCases = [
  { input: "6521/22", expected: [6521, 6522], description: "Basic case" },
  { input: "6526/27", expected: [6526, 6527], description: "Basic case 2" },
  { input: "6529", expected: [6529], description: "Single number" },
  {
    input: "11298/308",
    expected: [11298, 11308],
    description: "Three-digit suffix",
  },
  {
    input: "11298/08",
    expected: [11298, 11308],
    description: "Rollover with leading zero",
  },
  {
    input: "12345/6",
    expected: [12345, 12346],
    description: "Single digit suffix",
  },
  { input: [6521, 6522], expected: [6521, 6522], description: "Array input" },
  { input: "6521|6522", expected: [6521, 6522], description: "Pipe format" },
  { input: "", expected: [], description: "Empty string" },
  { input: null, expected: [], description: "Null input" },
  { input: "6598/02", expected: [6598, 6602], description: "Rollover case" },
];

console.log("Running lrNo Transformation Tests...\n");

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = transformLrNoString(input);
  const isMatch =
    JSON.stringify(result.sort((a, b) => a - b)) ===
    JSON.stringify(expected.sort((a, b) => a - b));

  if (isMatch) {
    console.log(`✓ PASS: ${description}`);
    console.log(`  Input: ${JSON.stringify(input)}`);
    console.log(`  Output: ${JSON.stringify(result)}\n`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${description}`);
    console.log(`  Input: ${JSON.stringify(input)}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Got: ${JSON.stringify(result)}\n`);
    failed++;
  }
});

console.log(`\n========== TEST SUMMARY ==========`);
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`==================================`);

if (failed > 0) {
  process.exit(1);
}
