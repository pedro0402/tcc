import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  if (command === "build" && mode === "production" && !loadEnv(mode, process.cwd()).VITE_API_URL) {
    // Sem a variável, o cliente chama a API na mesma origem do site (ex.: /auth/login).
    console.warn("[aviso] VITE_API_URL não definido: a API será chamada na mesma origem do site.");
  }
  return {
    plugins: [react()],
    test: {
      environment: "node",
      pool: "forks",
      fileParallelism: false,
      include: ["src/**/*.test.ts"],
      // Só os imports ?raw (usados no teste de CSS modules) passam pelo Vite;
      // os demais CSS seguem como proxy, sem mudar o nome das classes nos testes.
      css: { include: [/\.css\?raw$/] },
    },
  };
});
