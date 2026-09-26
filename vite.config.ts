import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    pool: "forks",
    fileParallelism: false,
    include: ["src/**/*.test.ts"],
  },
});
