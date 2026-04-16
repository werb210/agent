/**
 * Maya Agent — Core Entry Point
 *
 * STATUS: NOT YET IMPLEMENTED
 *
 * Referenced by:
 *   - src/agents/agentRouter.ts
 *   - src/agents/orchestrator.ts
 *   - src/agents/registerAgents.ts
 *   - src/__tests__/maya.test.ts + mayaCore, mayaStartupHandler, mayaStartupLaunchEngine, mayaV1ProductionHardening
 *
 * When implementing, this function must:
 *   1. Accept an agent context / job payload
 *   2. Invoke qualification engine, scoring, and lender routing
 *   3. Return a structured result consumed by the orchestrator
 *
 * All tests that import this must mock it — do not call the real function in tests.
 */
export function runMayaAgent() {
  throw new Error(
    "runMayaAgent is not implemented. See src/agents/maya/index.ts for required contract."
  );
}
