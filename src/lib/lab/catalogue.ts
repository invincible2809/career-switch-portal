// The ShopEasy Test Lab catalogue: synthetic products only (SPEC §13).
export interface LabProduct {
  id: string;
  name: string;
  /** Price in pence. Multi-buy items have a fractional unit price (e.g. 3 for £5). */
  unitPricePence: number;
  priceLabel: string;
  stock: number;
}

export const LAB_PRODUCTS: LabProduct[] = [
  { id: "mug", name: "Stoneware mug", unitPricePence: 800, priceLabel: "£8.00", stock: 25 },
  { id: "teapot", name: "Six-cup teapot", unitPricePence: 2499, priceLabel: "£24.99", stock: 8 },
  { id: "tea-towel", name: "Cotton tea towel (3 for £5)", unitPricePence: 500 / 3, priceLabel: "3 for £5.00", stock: 40 },
  { id: "kettle", name: "Stovetop kettle", unitPricePence: 3500, priceLabel: "£35.00", stock: 1 },
  { id: "coasters", name: "Set of four coasters", unitPricePence: 1250, priceLabel: "£12.50", stock: 15 },
  { id: "cake-tin", name: "Round cake tin", unitPricePence: 1001, priceLabel: "£10.01", stock: 12 },
  { id: "honey", name: "Jar of honey", unitPricePence: 400, priceLabel: "£4.00", stock: 20 },
  { id: "strainer", name: "Tea strainer", unitPricePence: 399, priceLabel: "£3.99", stock: 20 },
];

export const LAB_DEMO_ACCOUNT = { email: "shopper@shopeasy.example", password: "Basket123" };

export function formatPence(p: number): string {
  const sign = p < 0 ? "-" : "";
  return `${sign}£${(Math.abs(p) / 100).toFixed(2)}`;
}
