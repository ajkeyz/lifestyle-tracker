/**
 * JSON reporter for production-readiness harness results.
 *
 * Writes the RunResult as formatted JSON to two locations:
 *   1. {reportDir}/report-{timestamp}.json   (timestamped archive)
 *   2. {reportDir}/latest.json                (always the most recent run)
 *
 * Creates the reportDir recursively if it does not exist.
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { RunResult } from "../../harness.config";

/**
 * Write the run result as JSON to the report directory.
 *
 * @param result    The completed run result.
 * @param reportDir Directory to write reports into.
 * @returns         The absolute path of the timestamped report file.
 */
export function writeJsonReport(result: RunResult, reportDir: string): string {
  // Ensure the report directory exists
  mkdirSync(reportDir, { recursive: true });

  // Build a filesystem-safe timestamp: 2024-01-15T10-30-45-123Z
  const safeTimestamp = result.timestamp
    .replace(/:/g, "-")
    .replace(/\./g, "-");

  const filename = `report-${safeTimestamp}.json`;
  const filepath = join(reportDir, filename);
  const latestPath = join(reportDir, "latest.json");

  const json = JSON.stringify(result, null, 2);

  writeFileSync(filepath, json, "utf-8");
  writeFileSync(latestPath, json, "utf-8");

  return filepath;
}
