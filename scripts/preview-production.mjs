import { spawn } from "node:child_process";
const args = process.argv
  .slice(2)
  .map((value) => (value === "--host" ? "--hostname" : value))
  .filter((value) => value !== "--strictPort");
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", ...args],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
