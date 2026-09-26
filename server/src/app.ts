import { createApp } from "./createApp";

const PORT = Number(process.env.PORT ?? 3001);

createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
