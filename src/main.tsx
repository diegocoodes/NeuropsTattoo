import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./admin.css";
import { SiteContentProvider } from "./cms/SiteContent";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteContentProvider>
      <App />
    </SiteContentProvider>
  </React.StrictMode>
);
