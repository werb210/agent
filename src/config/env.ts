import dotenv from "dotenv";

export const ENV = process.env.NODE_ENV || "development";

if (ENV !== "production") {
  dotenv.config({ path: `.env.${ENV}` });
}

export const isProd = ENV === "production";
export const isStaging = ENV === "staging";

export const PORT = process.env.PORT || 5000;
