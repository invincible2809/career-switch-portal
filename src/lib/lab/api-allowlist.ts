// The only requests the API sandbox can send (CLAUDE.md rule 3). All are the portal's own
// mock ShopEasy endpoints; anything else is refused in the browser and by the server.
export interface AllowedEndpoint {
  method: "GET" | "POST" | "DELETE";
  path: string; // may contain :id
  description: string;
  exampleBody?: string;
}

export const API_BASE = "/api/lab/shop";

export const ALLOWED_ENDPOINTS: AllowedEndpoint[] = [
  { method: "GET", path: "/products", description: "List the products" },
  { method: "GET", path: "/products/:id", description: "Get one product (for example mug or kettle)" },
  { method: "GET", path: "/basket", description: "See your demo basket and totals" },
  { method: "POST", path: "/basket/items", description: "Set the quantity of an item", exampleBody: '{\n  "productId": "mug",\n  "quantity": 2\n}' },
  { method: "POST", path: "/basket/discount", description: "Apply a discount code", exampleBody: '{\n  "code": "SAVE10"\n}' },
  { method: "DELETE", path: "/basket", description: "Empty the basket" },
  { method: "POST", path: "/login", description: "Log in to the demo shop", exampleBody: '{\n  "email": "shopper@shopeasy.example",\n  "password": "Basket123"\n}' },
  { method: "POST", path: "/orders", description: "Place an order (log in first)", exampleBody: '{\n  "name": "Sam Taylor",\n  "address": "1 High Street, Leeds",\n  "postcode": "LS1 4AP"\n}' },
];

const toRegex = (path: string) => new RegExp(`^${API_BASE}${path.replace(/:id/g, "[a-z0-9-]{1,40}")}$`);

/** True only for an allow-listed method and path on the portal's own mock API. */
export function isAllowed(method: string, url: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return false; // no other origins
  const path = url.split("?")[0];
  return ALLOWED_ENDPOINTS.some((e) => e.method === method && toRegex(e.path).test(path));
}
