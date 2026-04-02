declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;

    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;

    OPENAI_API_KEY: string;

    BASE_URL: string;
    WS_URL: string;
  }
}
