import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({envDir:false,envPrefix:[],plugins:[react()],publicDir:false,base:"/",build:{outDir:"admin-dist",emptyOutDir:true,rollupOptions:{input:"admin.html"}}});
