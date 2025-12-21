import "dotenv/config";
import { auth } from "./src/lib/auth";

console.log("Auth Context Keys:", Object.keys(auth.$context));
