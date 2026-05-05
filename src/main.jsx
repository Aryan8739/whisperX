import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.jsx";

window.addEventListener("error", (e) => {
    document.body.innerHTML += `<div style="color:red; background:white; z-index:9999; position:absolute; top:0;">Error: ${e.message}</div>`;
});

window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason?.message || e.reason || "";
    if (reason.toString().includes("auth-token") && reason.toString().includes("stole it")) return;

    document.body.innerHTML += `<div style="color:red; background:white; z-index:9999; position:absolute; top:0;">Promise Error: ${reason}</div>`;
});

try {
    createRoot(document.getElementById("root")).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
} catch (e) {
    document.body.innerHTML += `<div style="color:red; background:white; z-index:9999; position:absolute; top:0;">Render Error: ${e.message}</div>`;
}