import { hash, verify } from "@node-rs/argon2";

// argon2id with OWASP-recommended minimums (19 MiB, 2 iterations).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

// A real hash of a random string, used to keep login timing similar for unknown emails.
let dummyHash: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hash("timing-equaliser-" + Math.random(), OPTIONS);
  return dummyHash;
}
