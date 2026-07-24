
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import DevicePreviewToolbar from "./app/DevicePreviewToolbar.tsx";
  import "./styles/index.css";
  import { ttsUnlock } from "./shared/tts";

  // Unlock speech synthesis on the very first user gesture inside this iframe.
  // capture:true fires before React's synthetic events so ttsSpeak() calls inside
  // button onClick handlers already see _unlocked === true.
  document.addEventListener('click',      ttsUnlock, { capture: true, once: true });
  document.addEventListener('touchstart', ttsUnlock, { capture: true, once: true });

  createRoot(document.getElementById("root")!).render(
    <DevicePreviewToolbar>
      <App />
    </DevicePreviewToolbar>
  );
  