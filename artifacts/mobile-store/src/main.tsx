import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import { getStoredTheme, applyTheme } from "@/lib/theme";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => getToken());
applyTheme(getStoredTheme());
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById("root")!).render(<App />);


