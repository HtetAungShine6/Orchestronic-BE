import { JWTPayload } from 'jose';

export interface CustomJWTPayload extends JWTPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  oid?: string;
  upn?: string;
}
