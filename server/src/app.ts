import { config } from "./config";
import { createApp } from "./createApp";

createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
