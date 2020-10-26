declare namespace NodeJS {
  export interface ProcessEnv {
    PORT : string;
    SESSION_KEY : string;
    CORS_ORIGIN : string;
    DATABASE_URL : string;
  }
}
