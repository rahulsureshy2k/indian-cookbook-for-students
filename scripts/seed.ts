import { getDb, seedDatabase } from "../src/lib/db";

const reset = process.argv.includes("--reset");
const db = getDb();
const count = seedDatabase(db, reset);
console.log(`Seeded Indian Cookbook for Students (${count} recipes, reset=${reset}).`);
