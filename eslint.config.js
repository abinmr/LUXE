import js from "@eslint/js";
import ejs from "eslint-plugin-ejs";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([{ files: ["**/*.{js,mjs,cjs,ejs}"], plugins: { js, ejs }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } }]);
