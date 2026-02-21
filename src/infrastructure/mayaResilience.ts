import { MayaTaskType, runMayaLLM } from "../core/mayaModelRouter";

export async function resilientLLM(task: MayaTaskType, prompt: string) {
  try {
    return await runMayaLLM(task, prompt);
  } catch (err) {
    console.warn("Primary model failed, retrying with fallback...", err);
    return await runMayaLLM("analysis", prompt);
  }
}
