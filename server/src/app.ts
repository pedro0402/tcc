import { config } from "./config";
import { createApp } from "./createApp";

// 0.0.0.0: necessário em hosts como Render (não só localhost).
createApp().listen(config.port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${config.port}`);
});
