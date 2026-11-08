import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    // Existing effects intentionally initialize local UI state and trigger
    // mount-time API requests. These React Compiler advisory rules would
    // otherwise reject those valid, non-compiled patterns.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
