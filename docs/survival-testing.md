# Survival Mode — Synthetic Player & Stress Test Harness

Automated testing framework for the "Last Investor Standing" survival mode. Provides headless bot players, scenario-based test orchestration, chaos/fault injection, deterministic record & replay, and load testing — all without requiring real human players.

## Prerequisites

1. **Server running in test mode:**
   ```bash
   TEST_MODE=true npm run dev
   ```
   This activates:
   - Auth bypass via `X-Test-User-Id` header (no real login required)
   - Debug endpoints at `/api/test/*`
   - Force-start capability (bypass minimum player count)

2. **Database migrated:**
   ```bash
   npm run db:push
   ```

3. **Verify server health:**
   ```bash
   npm run harness:health
   ```

## Quick Start — First 5 Runs

### Run 1: Health Check
```bash
npm run harness:health
```
Expected: Server responds with `testMode: true`, uptime, and memory usage.

### Run 2: Single Match (Smoke)
```bash
npm run harness -- run:single --bots 4 --seed 42 --record
```
Expected: 4 bots (2 PERFECT + 2 RANDOM) play a full match. Console report shows PASS with zero validation errors.

### Run 3: Smoke Scenario
```bash
npm run harness:smoke
```
Expected: Runs the `smoke.json` scenario (1 match, 4 bots). Recording saved to `tools/survival-harness/recordings/`.

### Run 4: Chaos Test
```bash
npm run harness:chaos
```
Expected: 3 matches with CHAOS, DOUBLE_SUBMIT, LATE_JOIN, and DUP_CONN bots. Some warnings are expected (timer fairness due to reconnects). Zero hard errors.

### Run 5: Full Suite with HTML Report
```bash
npm run harness:full
```
Expected: 8 matches run concurrently (3 at a time), with HTML report generated at `tools/survival-harness/reports/report-*.html`.

## Architecture

```
tools/survival-harness/
├── src/
│   ├── index.ts         # CLI entry point
│   ├── config.ts        # Type definitions
│   ├── profiles.ts      # Bot behavior profiles + seeded RNG
│   ├── bot.ts           # SurvivalBot headless client
│   ├── runner.ts        # ScenarioRunner orchestrator
│   ├── replayer.ts      # Deterministic match replayer
│   ├── recorder.ts      # Event recorder (JSON files)
│   ├── metrics.ts       # Metrics collector
│   ├── validator.ts     # Correctness assertions
│   └── report.ts        # Console + HTML report generator
├── scenarios/
│   ├── smoke.json       # Quick validation (1 match)
│   ├── chaos.json       # Fault injection (3 matches)
│   ├── load.json        # Stress test (10 concurrent matches)
│   └── full-suite.json  # Comprehensive (8 matches, all profiles)
├── recordings/          # Recorded match events (JSON)
├── reports/             # Generated HTML reports
└── tsconfig.json
```

## Bot Profiles

| Profile | Accuracy | Latency | Special Behavior |
|---------|----------|---------|-----------------|
| `PERFECT` | 100% | 50-200ms | Always correct, can host |
| `RANDOM` | 50% | 100-2000ms | Random answers, can host |
| `SLOW` | 70% | Near deadline | Answers at deadline-200ms |
| `CHAOS` | 50% | 200-1000ms | 30% chance to disconnect per round |
| `DOUBLE_SUBMIT` | 80% | 100-500ms | Sends each answer twice |
| `LATE_JOIN` | 50% | 200-800ms | Joins 2-5s after game starts |
| `DUP_CONN` | 60% | 100-500ms | Opens duplicate WebSocket |

## CLI Commands

### Run a Single Match
```bash
npm run harness -- run:single [options]
```
Options:
- `--bots <count>` — Number of bots (default: 4)
- `--seed <number>` — Random seed for determinism
- `--record` — Save match events to JSON

### Run Scenario File (Serial)
```bash
npm run harness -- run:batch --scenario <file> [--record] [--html-report]
```

### Run Scenario File (Concurrent)
```bash
npm run harness -- run:concurrent --scenario <file> [--record] [--html-report]
```

### Run Chaos Test
```bash
npm run harness -- run:chaos --scenario <file> [--record] [--html-report]
```
Chaos mode adds random bot kills and forced disconnects on top of the configured bot profiles.

### Load Test
```bash
npm run harness -- run:load [--bots <count>] [--seed <number>]
```
Runs 10 concurrent matches with 8 bots each (80 total bots).

### Replay a Recorded Match
```bash
npm run harness -- run:replay --recording <file>
```
Replays a previously recorded match to verify deterministic behavior.

### Health Check
```bash
npm run harness -- health [--server-url <url>]
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run harness` | CLI entry point (pass commands after `--`) |
| `npm run harness:smoke` | Quick smoke test (1 match, 4 bots) |
| `npm run harness:chaos` | Chaos/fault injection test |
| `npm run harness:load` | Load test (10 concurrent matches) |
| `npm run harness:full` | Full suite with HTML report |
| `npm run harness:health` | Server health check |

## Scenario Configuration

Scenario files are JSON with this structure:

```json
{
  "name": "My Scenario",
  "description": "What this tests",
  "matches": [
    {
      "lobbySize": 8,
      "bots": [
        { "profile": "PERFECT", "count": 3 },
        { "profile": "RANDOM", "count": 3 },
        { "profile": "CHAOS", "count": 2, "disconnectProbability": 0.5 }
      ],
      "usePrivateLobby": true,
      "record": true
    }
  ],
  "concurrency": 3,
  "seed": 42,
  "serverUrl": "http://localhost:5000",
  "thresholds": {
    "maxErrorRate": 0.02,
    "maxLatencyP99Ms": 6000,
    "maxMemoryGrowthMB": 300
  }
}
```

### Bot Config Overrides

Each bot entry can override default profile settings:
- `accuracy` — Override answer accuracy (0.0-1.0)
- `latencyRange` — Override response latency `[min, max]` in ms
- `disconnectProbability` — Override disconnect chance per round (0.0-1.0)
- `reconnectWindow` — Override reconnect delay `[min, max]` in ms

## Validation Rules

The harness validates 9 invariants after each match:

| Rule | What it checks |
|------|---------------|
| `player_count` | 2-20 players in match |
| `single_winner` | At most 1 player with placement=1 |
| `elimination` | Eliminated players have eliminatedRound; non-eliminated don't |
| `lives` | No negative lives; eliminated players have 0 lives |
| `one_answer` | Server acknowledges at most 1 answer per player per round |
| `timer` | Answer ACKs arrive within time limit (+2s tolerance) |
| `state_machine` | Server messages follow valid phase transitions |
| `double_submit` | Double-submitted answers don't cause duplicate ACKs |
| `score` | No negative scores |

## Deterministic Replay

Matches can be recorded and replayed:

```bash
# Record a match
npm run harness -- run:single --bots 4 --seed 42 --record

# Find the recording
ls tools/survival-harness/recordings/

# Replay it
npm run harness -- run:replay --recording tools/survival-harness/recordings/match-<id>.json
```

Replay creates new bots with the same seeds and verifies:
- Same winner
- Same elimination order
- Same final scores
- Same number of rounds

## HTML Reports

Generate visual reports with `--html-report`:

```bash
npm run harness:full
```

Reports are saved to `tools/survival-harness/reports/report-*.html` and include:
- Overall pass/fail banner
- Per-scenario result cards
- Validation error table
- Latency percentile chart
- Replay results (if applicable)

## Server Test Hooks

When `TEST_MODE=true`, the server exposes:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/test/ensure-user` | Create/get test user |
| `GET /api/test/matches` | List active rooms + queue size |
| `GET /api/test/match/:id` | Get detailed match state |
| `POST /api/test/force-start/:id` | Force-start a match |
| `GET /api/test/health` | Server health + memory |

Auth bypass: Include `X-Test-User-Id: <botId>` header on all requests.

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
survival-test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_DB: lifestyle_test
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
      ports: ['5432:5432']
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm install
    - run: npm run db:push
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/lifestyle_test
    - name: Start server in test mode
      run: TEST_MODE=true npm run dev &
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/lifestyle_test
    - name: Wait for server
      run: |
        for i in $(seq 1 30); do
          curl -sf http://localhost:5000/api/test/health && break
          sleep 1
        done
    - name: Run smoke test
      run: npm run harness:smoke
    - name: Run chaos test
      run: npm run harness:chaos
    - name: Run full suite
      run: npm run harness:full
    - name: Upload reports
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: survival-test-reports
        path: tools/survival-harness/reports/
```

## Troubleshooting

**"WS connect timeout"** — Server isn't running or not in TEST_MODE. Run `npm run harness:health` first.

**"HTTP 401"** — `X-Test-User-Id` header isn't being accepted. Verify `TEST_MODE=true` is set.

**"Match not found"** — Bot tried to join a match that was already cleaned up. Increase the match timeout or reduce test concurrency.

**Timer fairness warnings** — Expected with CHAOS and SLOW bots. The 2-second tolerance accounts for network latency and reconnection delays.

**Non-deterministic replay** — Check if the server state (scenarios, difficulty classification) has changed between recording and replay. Ensure the same seed produces the same scenario order.
