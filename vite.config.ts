import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
 base: "/",
 plugins: [react()],
 preview: {
  port: 8080,
  strictPort: true,
 },
 server: {
  port: 8080,
  strictPort: true,
  host: true,
  origin: "http://0.0.0.0:8080",
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    '8545a596dbbb.ngrok-free.app'
  ]
}
,
 resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
