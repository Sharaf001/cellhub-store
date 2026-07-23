declare module "express-session" {
  interface SessionOptions {
    secret: string | string[];
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: {
      secure?: boolean;
      httpOnly?: boolean;
      maxAge?: number;
      sameSite?: "strict" | "lax" | "none" | boolean;
    };
    name?: string;
  }

  interface Session {
    id: string;
    userId?: number;
    username?: string;
    email?: string;
    role?: string;
    destroy(callback?: (err?: unknown) => void): void;
    save(callback?: (err?: unknown) => void): void;
    regenerate(callback?: (err?: unknown) => void): void;
  }

  function session(options: SessionOptions): import("express").RequestHandler;

  export = session;
}

declare module "express-serve-static-core" {
  interface Request {
    session: import("express-session").Session;
  }
}
