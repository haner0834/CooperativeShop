export interface School {
  id: string;
  name: string;
  abbreviation: string;
  loginMethod: LoginMethod;
}

export type LoginMethod = "credential" | "google";
