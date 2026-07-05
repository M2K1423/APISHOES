import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage,
  WebSocketGateway, WebSocketServer, WsException
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { firebaseAdmin } from "../firebase-admin.config";
import { UsersService } from "../users/users.service";
import { ChatActor, ChatService } from "./chat.service";

type ChatSocket = Socket & { data: { actor?: ChatActor; activeConversationId?: string } };

@WebSocketGateway({ namespace: "chat", cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService
  ) {}

  private actor(client: ChatSocket) {
    if (!client.data.actor) throw new WsException("Unauthenticated socket");
    return client.data.actor;
  }

  private errorMessage(error: unknown) {
    return error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "Chat request failed";
  }

  async handleConnection(client: ChatSocket) {
    try {
      const header = client.handshake.headers.authorization;
      const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
      const token = String(client.handshake.auth?.token || bearer || "");
      if (!token) throw new Error("Authentication token is required");

      const decoded = await firebaseAdmin.auth().verifyIdToken(token);
      const user = await this.usersService.getUserByUid(decoded.uid);
      if (!user) throw new Error("User profile does not exist");

      const actor = this.chatService.actorFromUser(user, decoded as Record<string, any>);
      client.data.actor = actor;
      await client.join(`user:${actor.uid}`);
      if (actor.role === "admin") {
        await client.join("admins");
        client.emit("chat.ready", { role: actor.role });
        client.emit("conversation.list", await this.chatService.listConversations());
        return;
      }

      const conversation = await this.chatService.getOrCreateCustomerConversation(actor);
      client.data.activeConversationId = conversation.id;
      await client.join(`conversation:${conversation.id}`);
      client.emit("chat.ready", { role: actor.role, conversation });
      client.emit("message.history", await this.chatService.getHistory(conversation.id, actor));
      const updated = await this.chatService.markRead(conversation.id, actor);
      this.server.to("admins").emit("conversation.updated", updated);
    } catch (error) {
      client.emit("chat.error", { message: this.errorMessage(error) });
      client.disconnect(true);
    }
  }

  @SubscribeMessage("conversation.list")
  async list(@ConnectedSocket() client: ChatSocket) {
    if (this.actor(client).role !== "admin") throw new WsException("Administrator access required");
    return this.chatService.listConversations();
  }

  @SubscribeMessage("conversation.open")
  async open(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string }) {
    try {
      const actor = this.actor(client);
      if (actor.role !== "admin") throw new Error("Administrator access required");
      const conversationId = String(body?.conversationId || "");
      await this.chatService.getConversationForActor(conversationId, actor);
      if (client.data.activeConversationId) await client.leave(`conversation:${client.data.activeConversationId}`);
      client.data.activeConversationId = conversationId;
      await client.join(`conversation:${conversationId}`);
      const messages = await this.chatService.getHistory(conversationId, actor);
      const conversation = await this.chatService.markRead(conversationId, actor);
      this.server.to("admins").emit("conversation.updated", conversation);
      client.emit("message.history", messages);
      return { conversation, messages };
    } catch (error) {
      throw new WsException(this.errorMessage(error));
    }
  }

  @SubscribeMessage("chat.send")
  async send(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { conversationId?: string; content?: unknown; imageUrl?: unknown }
  ) {
    try {
      const result = await this.chatService.sendMessage(
        this.actor(client), body?.conversationId, body?.content, body?.imageUrl
      );
      await client.join(`conversation:${result.conversation.id}`);
      client.data.activeConversationId = result.conversation.id;
      client.emit("conversation.active", result.conversation);
      this.server.to(`conversation:${result.conversation.id}`).emit("message.created", result.message);
      this.server.to("admins").emit("conversation.updated", result.conversation);
      return result.message;
    } catch (error) {
      throw new WsException(this.errorMessage(error));
    }
  }

  @SubscribeMessage("chat.read")
  async read(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string }) {
    try {
      const actor = this.actor(client);
      const conversationId = actor.role === "customer" ? client.data.activeConversationId : body?.conversationId;
      if (!conversationId) throw new Error("Conversation ID is required");
      const conversation = await this.chatService.markRead(conversationId, actor);
      this.server.to(`conversation:${conversationId}`).emit("conversation.read", { conversationId, readBy: actor.role });
      this.server.to("admins").emit("conversation.updated", conversation);
      return conversation;
    } catch (error) {
      throw new WsException(this.errorMessage(error));
    }
  }

  @SubscribeMessage("chat.end")
  async end(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string }) {
    try {
      const actor = this.actor(client);
      const conversationId = actor.role === "customer" ? client.data.activeConversationId : body?.conversationId;
      if (!conversationId) throw new Error("Conversation ID is required");

      const result = await this.chatService.endConversation(conversationId, actor);
      this.server.to(`conversation:${conversationId}`).to("admins").emit("conversation.ended", result);
      client.data.activeConversationId = undefined;
      await client.leave(`conversation:${conversationId}`);
      return result;
    } catch (error) {
      throw new WsException(this.errorMessage(error));
    }
  }
}
