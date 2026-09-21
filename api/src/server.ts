import http from "http";
import { app } from "@/app";
import { env } from "@/config/env";
import { initSocket } from "@/lib/socket";

const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`🚀 RoomMate API listening on http://localhost:${env.PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
