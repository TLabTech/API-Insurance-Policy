export interface JwtPayload {
  sub: number; // user ID
  email: string;
  branchID?: number;
  iat?: number;
  exp?: number;
}
