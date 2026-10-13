import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Aperçu dans un environnement bac à sable : n'autorise tous les hôtes que si
    // VITE_ALLOW_ALL_HOSTS est défini (le build de production n'est pas concerné).
    allowedHosts: process.env.VITE_ALLOW_ALL_HOSTS === "true" ? true : [],
    // Le panneau d'aperçu peut conserver une ancienne version : on interdit tout
    // cache navigateur pour que chaque rechargement serve le code courant.
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  },
});
