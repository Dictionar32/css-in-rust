const path = require("node:path");

process.on("uncaughtException", (e) => {
  console.error("Uncaught exception:", e);
  process.exit(1);
});

process.on("unhandledRejection", (e) => {
  console.error("Unhandled rejection:", e);
  process.exit(1);
});

try {
  const binaryPath = path.resolve(__dirname, "../../../../native/tailwind-styled-native.node");
  console.log("Attempting to require:", binaryPath);
  const binding = require(binaryPath);
  console.log("Successfully required! Function count:", Object.keys(binding).length);
} catch (e) {
  console.error("Failed to require:", e);
}
process.exit(0);
