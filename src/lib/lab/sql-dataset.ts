// A synthetic ShopEasy database for the SQL sandbox (CLAUDE.md rule 3). Built in the browser
// from a fixed seed, so every learner gets the same made-up data and "Reset" restores it.
import { createRng, choice, randInt } from "../random";

const FIRST = ["Amira", "Ben", "Chloe", "Dev", "Ellie", "Femi", "Grace", "Harry", "Isla", "Jamal", "Kate", "Liam", "Maya", "Noah", "Olu", "Priya", "Ravi", "Sara", "Tom", "Zara"];
const LAST = ["Ahmed", "Brown", "Clarke", "Davies", "Evans", "Fraser", "Green", "Hughes", "Iqbal", "Jones", "Khan", "Lewis", "Morgan", "Nowak", "Owen", "Patel", "Quinn", "Roberts", "Singh", "Taylor"];
const CITIES = ["Leeds", "Bristol", "Cardiff", "Glasgow", "Norwich", "Leeds", "Belfast", "Bristol"];
const PRODUCTS: [string, string, number][] = [
  ["Stoneware mug", "Kitchen", 8.0],
  ["Six-cup teapot", "Kitchen", 24.99],
  ["Cotton tea towel", "Textiles", 1.67],
  ["Stovetop kettle", "Kitchen", 35.0],
  ["Set of four coasters", "Home", 12.5],
  ["Round cake tin", "Baking", 10.01],
  ["Wooden spoon", "Baking", 3.5],
  ["Linen napkins (4)", "Textiles", 14.0],
  ["Glass storage jar", "Kitchen", 6.75],
  ["Oven gloves", "Textiles", 9.99],
  ["Bread board", "Kitchen", 18.0],
  ["Cookie cutters", "Baking", 4.25],
];
const POSTCODES = ["LS1 4AP", "BS1 5TR", "CF10 1EP", "G1 2FF", "NR2 1TF", "BT1 5GS"];

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function buildDatasetSql(): string {
  const rng = createRng(2026);
  const out: string[] = [
    "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, joined TEXT NOT NULL);",
    "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL);",
    "CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), order_date TEXT NOT NULL, status TEXT NOT NULL, postcode TEXT NOT NULL);",
    "CREATE TABLE order_items (order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL);",
  ];
  for (let i = 1; i <= 20; i++) {
    out.push(`INSERT INTO customers VALUES (${i}, ${q(`${FIRST[i - 1]} ${LAST[(i * 7) % 20]}`)}, ${q(choice(rng, CITIES))}, '2025-${String(randInt(rng, 1, 12)).padStart(2, "0")}-${String(randInt(rng, 1, 28)).padStart(2, "0")}');`);
  }
  PRODUCTS.forEach(([name, cat, price], i) => out.push(`INSERT INTO products VALUES (${i + 1}, ${q(name)}, ${q(cat)}, ${price});`));
  for (let o = 1; o <= 40; o++) {
    const status = o % 9 === 0 ? "cancelled" : o % 4 === 0 ? "dispatched" : "delivered";
    // Two orders with a lower-case postcode – a data quality issue for learners to spot.
    const postcode = o === 13 || o === 27 ? "ls1 4ap" : choice(rng, POSTCODES);
    out.push(`INSERT INTO orders VALUES (${o}, ${randInt(rng, 1, 18)}, '2026-${String(randInt(rng, 1, 10)).padStart(2, "0")}-${String(randInt(rng, 1, 28)).padStart(2, "0")}', '${status}', ${q(postcode)});`);
    const lines = randInt(rng, 1, 3);
    const used = new Set<number>();
    for (let l = 0; l < lines; l++) {
      const pid = randInt(rng, 1, 10); // products 11 and 12 are never ordered
      if (used.has(pid)) continue;
      used.add(pid);
      // Two order lines with quantity 0 – the kind of bad data a missing check lets through.
      const qty = (o === 8 && l === 0) || (o === 31 && l === 0) ? 0 : randInt(rng, 1, 4);
      out.push(`INSERT INTO order_items VALUES (${o}, ${pid}, ${qty});`);
    }
  }
  return out.join("\n");
}

export interface SqlExercise {
  id: string;
  title: string;
  task: string;
  hint: string;
  solution: string;
  ordered: boolean;
}

export const SQL_EXERCISES: SqlExercise[] = [
  { id: "all-products", title: "1. See every product", task: "Show every column of every row in the products table.", hint: "SELECT * FROM table_name;", solution: "SELECT * FROM products;", ordered: false },
  { id: "cheap-products", title: "2. Products under £10", task: "Show the name and price of every product that costs less than £10.", hint: "Use WHERE price < 10.", solution: "SELECT name, price FROM products WHERE price < 10;", ordered: false },
  { id: "leeds-customers", title: "3. Customers in Leeds", task: "Show the names of all customers whose city is Leeds.", hint: "Text values go in single quotes: WHERE city = 'Leeds'.", solution: "SELECT name FROM customers WHERE city = 'Leeds';", ordered: false },
  { id: "cancelled-count", title: "4. How many cancelled orders?", task: "Count the orders whose status is cancelled.", hint: "COUNT(*) counts rows.", solution: "SELECT COUNT(*) FROM orders WHERE status = 'cancelled';", ordered: false },
  { id: "zero-quantity", title: "5. Spot bad data", task: "A tester suspects some order lines have a quantity of 0. Show every column of the order_items rows where the quantity is 0.", hint: "WHERE quantity = 0", solution: "SELECT * FROM order_items WHERE quantity = 0;", ordered: false },
  { id: "orders-per-customer", title: "6. Orders per customer", task: "For each customer_id in the orders table, show the customer_id and how many orders they placed.", hint: "Use GROUP BY customer_id with COUNT(*).", solution: "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;", ordered: false },
  { id: "order-names", title: "7. Orders with customer names", task: "Show each order's id together with the name of the customer who placed it.", hint: "JOIN customers ON customers.id = orders.customer_id", solution: "SELECT orders.id, customers.name FROM orders JOIN customers ON customers.id = orders.customer_id;", ordered: false },
  { id: "bad-postcodes", title: "9. Spot badly formatted postcodes", task: "Some orders have a postcode in small letters. Show the id and postcode of every order whose postcode isn't in capital letters.", hint: "Compare the postcode with upper(postcode).", solution: "SELECT id, postcode FROM orders WHERE postcode <> upper(postcode);", ordered: false },
  { id: "never-ordered", title: "8. Products nobody has ordered", task: "Show the names of products that don't appear in any order line.", hint: "Try a LEFT JOIN from products to order_items, keeping rows where the order_items side is NULL – or use NOT IN.", solution: "SELECT products.name FROM products LEFT JOIN order_items ON order_items.product_id = products.id WHERE order_items.product_id IS NULL;", ordered: false },
];

export type Rows = (string | number | null | Uint8Array)[][];

/** Compares result rows by value (column names ignored). Order matters only when the exercise says so. */
export function sameResult(actual: Rows, expected: Rows, ordered: boolean): boolean {
  if (actual.length !== expected.length) return false;
  const norm = (rows: Rows) => rows.map((r) => JSON.stringify(r.map((v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v))));
  const a = norm(actual);
  const e = norm(expected);
  if (!ordered) {
    a.sort();
    e.sort();
  }
  return a.every((row, i) => row === e[i]);
}
