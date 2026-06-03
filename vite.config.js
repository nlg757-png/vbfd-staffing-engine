import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/vbfd-staffing-engine/",
  plugins: [react()],
});
