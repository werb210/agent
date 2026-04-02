import { getApiBase } from "./api";

export function getApiConfig() {
  return {
    baseUrl: getApiBase(),
  } as const;
}
