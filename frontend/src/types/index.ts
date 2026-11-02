// Shared type definitions

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export type Severity = "critical" | "high" | "medium" | "low" | "info";
