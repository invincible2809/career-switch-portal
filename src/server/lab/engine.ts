import "server-only";
// The ShopEasy Test Lab shop. Pure functions over a learner's lab state.
// It deliberately contains the defects listed in ./defects.ts (SPEC §5) – each is marked
// "PLANTED DEFECT" so maintainers can find them. Tests in tests/unit/lab-engine.test.ts
// prove each one happens and that everything else behaves as the specification says.
import { LAB_DEMO_ACCOUNT, LAB_PRODUCTS, type LabProduct } from "@/lib/lab/catalogue";

export interface LabState {
  loggedIn: boolean;
  failedLogins: number;
  lockedUntil: number | null;
  basket: { productId: string; qty: number }[];
  codes: string[];
  orders: { ref: string; totalPence: number; placedAt: string }[];
}

export const freshState = (): LabState => ({ loggedIn: false, failedLogins: 0, lockedUntil: null, basket: [], codes: [], orders: [] });

export type Result<T = undefined> = { ok: true; state: LabState; value?: T; message?: string } | { ok: false; state: LabState; status: number; error: string };

// ---------- Login ----------
export function login(state: LabState, email: string, password: string, now = Date.now()): Result {
  if (state.lockedUntil && state.lockedUntil > now) {
    return { ok: false, state, status: 423, error: "Your account is locked for 15 minutes because of 3 failed login attempts in a row." };
  }
  const emailOk = email.trim().toLowerCase() === LAB_DEMO_ACCOUNT.email;
  // PLANTED DEFECT (login-password-case): passwords are compared ignoring letter case.
  const passwordOk = password.toLowerCase() === LAB_DEMO_ACCOUNT.password.toLowerCase();
  if (emailOk && passwordOk) return { ok: true, state: { ...state, loggedIn: true, failedLogins: 0, lockedUntil: null } };
  // PLANTED DEFECT (login-no-lockout): failed attempts are counted but the account never locks.
  const failed = state.failedLogins + 1;
  // PLANTED DEFECT (login-unhelpful-error): the message doesn't say what went wrong.
  return { ok: false, state: { ...state, failedLogins: failed }, status: 401, error: "Error 0x1F" };
}

export function logout(state: LabState): LabState {
  return { ...state, loggedIn: false };
}

// ---------- Basket ----------
export function product(id: string): LabProduct | undefined {
  return LAB_PRODUCTS.find((p) => p.id === id);
}

export function parseQuantity(raw: string | number): { ok: true; qty: number } | { ok: false; error: string } {
  const text = String(raw).trim();
  if (!/^-?\d+$/.test(text)) return { ok: false, error: "Enter a whole number." };
  const qty = Number(text);
  // PLANTED DEFECTS (basket-qty-zero, basket-qty-negative): only the upper limit is checked.
  if (qty > 10) return { ok: false, error: "You can buy up to 10 of this item." };
  return { ok: true, qty };
}

export function setQuantity(state: LabState, productId: string, raw: string | number): Result {
  const p = product(productId);
  if (!p) return { ok: false, state, status: 404, error: "That product doesn't exist." };
  const parsed = parseQuantity(raw);
  if (!parsed.ok) return { ok: false, state, status: 400, error: parsed.error };
  if (parsed.qty > p.stock) return { ok: false, state, status: 400, error: `Only ${p.stock} left in stock.` };
  const others = state.basket.filter((b) => b.productId !== productId);
  return { ok: true, state: { ...state, basket: [...others, { productId, qty: parsed.qty }] } };
}

export function addToBasket(state: LabState, productId: string, raw: string | number = 1): Result {
  const existing = state.basket.find((b) => b.productId === productId)?.qty ?? 0;
  const parsed = parseQuantity(raw);
  if (!parsed.ok) return { ok: false, state, status: 400, error: parsed.error };
  return setQuantity(state, productId, existing + parsed.qty);
}

export function removeFromBasket(state: LabState, productId: string): LabState {
  return { ...state, basket: state.basket.filter((b) => b.productId !== productId) };
}

export function clearBasket(state: LabState): LabState {
  return { ...state, basket: [], codes: [] };
}

// ---------- Prices ----------
export const DELIVERY_PENCE = 395;
export const FREE_DELIVERY_FROM = 5000;
export const SAVE10_MINIMUM = 2000;

export interface Summary {
  lines: { productId: string; name: string; qty: number; lineTotalPence: number }[];
  subtotalPence: number;
  discounts: { code: string; amountPence: number }[];
  deliveryPence: number;
  totalPence: number;
}

export function summary(state: LabState): Summary {
  const lines = state.basket.map((b) => {
    const p = product(b.productId)!;
    // PLANTED DEFECT (basket-rounding): each unit is rounded up before multiplying,
    // so 3 tea towels cost £5.01 instead of £5.00.
    return { productId: b.productId, name: p.name, qty: b.qty, lineTotalPence: Math.ceil(p.unitPricePence) * b.qty };
  });
  const subtotalPence = lines.reduce((s, l) => s + l.lineTotalPence, 0);
  let running = subtotalPence;
  // Specification: SAVE10 is removed if the basket drops below £20.00.
  const codes = subtotalPence >= SAVE10_MINIMUM ? state.codes : [];
  const discounts = codes.map((code) => {
    // PLANTED DEFECT (checkout-discount-twice): each application takes another 10% off.
    const amountPence = Math.round(subtotalPence * 0.1);
    running -= amountPence;
    return { code, amountPence };
  });
  // PLANTED DEFECT (checkout-delivery-boundary): "more than £50" instead of "£50 or more".
  const deliveryPence = subtotalPence === 0 || running > FREE_DELIVERY_FROM ? 0 : DELIVERY_PENCE;
  return { lines, subtotalPence, discounts, deliveryPence, totalPence: running + deliveryPence };
}

export function applyCode(state: LabState, raw: string): Result {
  const code = raw.trim().toUpperCase();
  if (code !== "SAVE10") return { ok: false, state, status: 400, error: "That code isn't valid." };
  const s = summary(state);
  if (s.subtotalPence < SAVE10_MINIMUM) return { ok: false, state, status: 400, error: "SAVE10 needs a minimum spend of £20." };
  // PLANTED DEFECT (checkout-discount-twice): no check that the code is already applied.
  return { ok: true, state: { ...state, codes: [...state.codes, code] }, message: "SAVE10 applied." };
}

// ---------- Checkout ----------
// Accepts the main UK postcode shapes, e.g. SW1A 1AA, M1 1AE, B33 8TH, CR2 6XH, DN55 1PT.
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/;

export function validatePostcode(raw: string): boolean {
  // PLANTED DEFECT (checkout-postcode-case): the input isn't converted to capitals first,
  // so valid postcodes in small letters are rejected.
  return POSTCODE.test(raw.trim());
}

export function placeOrder(state: LabState, input: { name: string; address: string; postcode: string }): Result<{ ref: string; totalPence: number }> {
  if (!state.loggedIn) return { ok: false, state, status: 401, error: "Log in to the demo shop first." };
  if (state.basket.length === 0) return { ok: false, state, status: 400, error: "Your basket is empty." };
  if (!input.name.trim() || !input.address.trim()) return { ok: false, state, status: 400, error: "Enter your name and address." };
  if (!validatePostcode(input.postcode)) return { ok: false, state, status: 400, error: "Enter a valid postcode." };
  const s = summary(state);
  const ref = `SE-${40000 + state.orders.length + 1}`;
  return {
    ok: true,
    value: { ref, totalPence: s.totalPence },
    state: { ...state, basket: [], codes: [], orders: [...state.orders, { ref, totalPence: s.totalPence, placedAt: new Date().toISOString() }] },
  };
}
