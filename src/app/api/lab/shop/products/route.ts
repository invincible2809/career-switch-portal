import { LAB_PRODUCTS } from "@/lib/lab/catalogue";
import { labApi } from "@/server/lab/api";

export async function GET() {
  return labApi(() => ({ json: { products: LAB_PRODUCTS.map((p) => ({ id: p.id, name: p.name, price: p.priceLabel, stock: p.stock })) } }));
}
