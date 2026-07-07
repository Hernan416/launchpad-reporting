import { readFileSync } from "fs";

const path = process.argv[2] ?? "users.local.json";
const json = readFileSync(path, "utf8");

JSON.parse(json); // validate shape before encoding

console.log(Buffer.from(json).toString("base64"));
