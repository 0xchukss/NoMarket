import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadDeployEnv(rootDir = process.cwd()) {
  const envPath = join(rootDir, ".env.deploy.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [name, ...rest] = trimmed.split("=");
      if (name && process.env[name] === undefined) {
        process.env[name] = rest.join("=").trim();
      }
    }
  } catch {
    // Missing deploy env is handled by requireEnv.
  }
}

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in .env.deploy.local.`);
  }
  return value;
}

export function optionalEnv(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function printEnvBlock(values) {
  console.log("\nCopy these lines into .env.deploy.local:");
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") console.log(`${key}=${value}`);
  }
}
