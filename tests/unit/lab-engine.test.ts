// Proves every planted Test Lab defect really happens (SPEC §5), and that the rest of the
// shop behaves as the learner-facing specification says.
import { describe, expect, it } from "vitest";
import { addToBasket, applyCode, freshState, login, placeOrder, setQuantity, summary, validatePostcode, type LabState } from "@/server/lab/engine";
import { LAB_DEFECTS } from "@/server/lab/defects";

const ok = <T,>(r: { ok: boolean; state: LabState } & T) => {
  expect(r.ok).toBe(true);
  return r.state;
};
const basket = (...items: [string, number][]) => items.reduce((s, [id, q]) => ok(setQuantity(s, id, q)), freshState());
const loggedIn = (s: LabState) => ({ ...s, loggedIn: true });
const removeTeapot = (s: LabState) => ({ ...s, basket: s.basket.filter((b) => b.productId !== "teapot") });

describe("planted defects happen", () => {
  it("login-password-case: wrong-case password is accepted", () => {
    expect(login(freshState(), "shopper@shopeasy.example", "BASKET123").ok).toBe(true);
  });
  it("login-unhelpful-error: failed login says Error 0x1F", () => {
    const r = login(freshState(), "shopper@shopeasy.example", "wrong");
    expect(r.ok === false && r.error).toBe("Error 0x1F");
  });
  it("login-no-lockout: never locks after many failures", () => {
    let s = freshState();
    for (let i = 0; i < 5; i++) s = login(s, "shopper@shopeasy.example", "wrong").state;
    expect(s.lockedUntil).toBeNull();
    expect(login(s, "shopper@shopeasy.example", "Basket123").ok).toBe(true);
  });
  it("basket-qty-zero: quantity 0 is accepted", () => {
    expect(setQuantity(freshState(), "mug", "0").ok).toBe(true);
  });
  it("basket-qty-negative: negative quantity is accepted and the total goes negative", () => {
    const s = basket(["mug", -2]);
    expect(summary(s).subtotalPence).toBe(-1600);
  });
  it("basket-rounding: 3 tea towels cost £5.01", () => {
    expect(summary(basket(["tea-towel", 3])).subtotalPence).toBe(501);
  });
  it("checkout-discount-twice: SAVE10 applies twice", () => {
    let s = basket(["mug", 4]); // £32.00
    s = ok(applyCode(s, "SAVE10"));
    s = ok(applyCode(s, "save10"));
    expect(summary(s).totalPence).toBe(3200 - 320 - 320 + 395);
  });
  it("checkout-delivery-boundary: delivery charged at exactly £50.00", () => {
    const s = basket(["coasters", 4]); // £50.00
    expect(summary(s)).toMatchObject({ subtotalPence: 5000, deliveryPence: 395 });
  });
  it("checkout-postcode-case: lower-case postcode rejected", () => {
    expect(validatePostcode("sw1a 1aa")).toBe(false);
  });
  it("covers every defect in the answer key", () => {
    expect(LAB_DEFECTS.map((d) => d.key).sort()).toEqual(
      ["a11y-postcode-label", "basket-qty-negative", "basket-qty-zero", "basket-rounding", "checkout-delivery-boundary", "checkout-discount-twice", "checkout-postcode-case", "login-no-lockout", "login-password-case", "login-unhelpful-error"].sort(),
    );
  });
});

describe("everything else follows the specification", () => {
  it("accepts the right login and rejects a wrong email", () => {
    expect(login(freshState(), "Shopper@ShopEasy.example ", "Basket123").ok).toBe(true);
    expect(login(freshState(), "someone@else.example", "Basket123").ok).toBe(false);
  });
  it("rejects quantity 11, decimals and text", () => {
    for (const q of ["11", "2.5", "two"]) expect(setQuantity(freshState(), "mug", q).ok).toBe(false);
  });
  it("respects stock", () => {
    expect(setQuantity(freshState(), "kettle", 2).ok).toBe(false);
    expect(addToBasket(basket(["kettle", 1]), "kettle", 1).ok).toBe(false);
  });
  it("prices whole-penny items exactly", () => {
    expect(summary(basket(["mug", 2], ["teapot", 1])).subtotalPence).toBe(4099);
  });
  it("charges delivery at £49.99 and not above £50", () => {
    expect(summary(basket(["teapot", 2], ["tea-towel", 0])).deliveryPence).toBe(395); // £49.98
    expect(summary(basket(["cake-tin", 5])).deliveryPence).toBe(0); // £50.05
  });
  it("SAVE10 needs £20.00", () => {
    expect(applyCode(basket(["cake-tin", 1], ["mug", 1]), "SAVE10").ok).toBe(false); // £18.01
    expect(applyCode(basket(["cake-tin", 2]), "SAVE10").ok).toBe(true); // £20.02
    expect(applyCode(basket(["cake-tin", 2]), "SPRING").ok).toBe(false);
  });
  it("lets learners test the SAVE10 boundary at exactly £19.99 and £20.00", () => {
    expect(summary(basket(["mug", 2], ["strainer", 1])).subtotalPence).toBe(1999);
    expect(applyCode(basket(["mug", 2], ["strainer", 1]), "SAVE10").ok).toBe(false);
    expect(summary(basket(["mug", 2], ["honey", 1])).subtotalPence).toBe(2000);
    expect(applyCode(basket(["mug", 2], ["honey", 1]), "SAVE10").ok).toBe(true);
  });
  it("lets learners reach exactly £49.99 and £50.00", () => {
    expect(summary(basket(["teapot", 1], ["coasters", 2])).subtotalPence).toBe(4999);
    expect(summary(basket(["coasters", 4])).subtotalPence).toBe(5000);
  });
  it("removes SAVE10 if the basket drops below £20.00", () => {
    let s = ok(applyCode(basket(["teapot", 1]), "SAVE10"));
    s = ok(setQuantity(removeTeapot(s), "mug", 1));
    expect(summary(s).discounts).toEqual([]);
  });
  it("accepts valid capital postcodes with or without a space", () => {
    for (const p of ["SW1A 1AA", "SW1A1AA", "M1 1AE", "B33 8TH", "DN55 1PT"]) expect(validatePostcode(p)).toBe(true);
    expect(validatePostcode("12345")).toBe(false);
  });
  it("places an order only when logged in, and empties the basket", () => {
    const addr = { name: "Sam", address: "1 High St", postcode: "M1 1AE" };
    expect(placeOrder(basket(["mug", 1]), addr).ok).toBe(false);
    const r = placeOrder(loggedIn(basket(["mug", 1])), addr);
    expect(r.ok && r.value?.ref).toBe("SE-40001");
    expect(r.state.basket).toEqual([]);
  });
});
