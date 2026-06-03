import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

export type ProductCreatedNotification = {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string | null;
  message: string;
  createdAt: string;
};

@WebSocketGateway({
  namespace: "notifications",
  cors: {
    origin: "*"
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  handleConnection(@ConnectedSocket() client: Socket) {
    client.emit("notifications.ready", {
      connected: true,
      message: "Realtime notifications connected."
    });
  }

  handleDisconnect() {
    // Reserved for presence and chat cleanup later.
  }

  emitProductCreated(notification: ProductCreatedNotification) {
    this.server.emit("product.created", notification);
  }
}
