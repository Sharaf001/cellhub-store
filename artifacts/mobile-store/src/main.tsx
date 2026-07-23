import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
