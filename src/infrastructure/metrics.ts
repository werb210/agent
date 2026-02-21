import client from "prom-client";

client.collectDefaultMetrics();

export const register = client.register;
