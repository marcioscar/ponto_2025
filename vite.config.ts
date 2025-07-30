// import { reactRouter } from "@react-router/dev/vite";
// import tailwindcss from "@tailwindcss/vite";
// import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(
  vercelPreset({
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  })
);