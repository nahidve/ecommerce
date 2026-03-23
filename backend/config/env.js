import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always load backend/.env (not dependent on process.cwd())
dotenv.config({ path: path.join(__dirname, "..", ".env") });
