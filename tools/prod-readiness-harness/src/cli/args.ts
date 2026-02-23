/**
 * Zero-dependency CLI argument parser for the production-readiness harness.
 *
 * Parses process.argv into a typed structure:
 *   { command: string, options: Record<string, string | boolean> }
 *
 * Supports:
 *   --flag           → { flag: true }
 *   --key value      → { key: "value" }
 *   --key=value      → { key: "value" }
 *   command          → first non-flag argument becomes `command`
 *
 * Double-dash names are lowered to camelCase:
 *   --fail-fast      → { failFast: true }
 *   --report-dir x   → { reportDir: "x" }
 */

export interface ParsedArgs {
  command: string;
  options: Record<string, string | boolean>;
}

/**
 * Convert a kebab-case flag name to camelCase.
 *   "fail-fast" → "failFast"
 *   "report-dir" → "reportDir"
 */
function toCamelCase(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Parse process.argv (skipping the first two entries: node binary + script path).
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const options: Record<string, string | boolean> = {};
  let command = "";

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      // Handle --key=value
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const rawKey = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        options[toCamelCase(rawKey)] = value;
        i++;
        continue;
      }

      // Handle --flag or --key value
      const rawKey = arg.slice(2);
      const key = toCamelCase(rawKey);

      // Look ahead: if next arg exists and doesn't start with "--", treat it as the value
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        options[key] = next;
        i += 2;
      } else {
        // Boolean flag
        options[key] = true;
        i++;
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      // Short flags like -v, -q — treat as boolean
      const key = arg.slice(1);
      options[key] = true;
      i++;
    } else {
      // Positional argument — first one is the command
      if (!command) {
        command = arg;
      }
      i++;
    }
  }

  return { command, options };
}
