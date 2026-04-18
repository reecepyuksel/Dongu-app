import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { isOriginAllowed } from '../common/config/cors-origins';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, success?: boolean) => void,
    ) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by WS CORS'), false);
    },
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagesGateway.name);
  private readonly logSocketEvents = process.env.WS_DEBUG_LOGS === 'true';

  @WebSocketServer()
  server: Server;

  // Store connected users: userId -> socketIds
  private connectedUsers = new Map<string, Set<string>>();
  private socketToUser = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const currentSockets = this.connectedUsers.get(userId) ?? new Set();
      currentSockets.add(client.id);
      this.connectedUsers.set(userId, currentSockets);
      this.socketToUser.set(client.id, userId);

      if (this.logSocketEvents) {
        this.logger.debug(
          `WS Connected: ${client.id} (User: ${userId}, sockets=${currentSockets.size})`,
        );
      }
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }

      if (this.logSocketEvents) {
        this.logger.debug(
          `WS Disconnected: ${client.id} (User: ${userId}, sockets=${userSockets.size})`,
        );
      }
    }

    this.socketToUser.delete(client.id);
  }

  private emitToUser(userId: string, eventName: string, payload: any) {
    const targetSocketIds = this.connectedUsers.get(userId);
    if (!targetSocketIds || targetSocketIds.size === 0) return;

    for (const socketId of targetSocketIds) {
      this.server.to(socketId).emit(eventName, payload);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { toUserId: string; itemId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitToUser(data.toUserId.toString(), 'typing', {
      fromUserId: this.getUserIdBySocketId(client.id),
      itemId: data.itemId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { toUserId: string; itemId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitToUser(data.toUserId.toString(), 'stopTyping', {
      fromUserId: this.getUserIdBySocketId(client.id),
      itemId: data.itemId,
    });
  }

  // Notifies the recipient when a new message is saved
  notifyNewMessage(toUserId: string, messagePayload: any) {
    this.emitToUser(toUserId.toString(), 'newMessage', messagePayload);
  }

  notifyNotification(toUserId: string, notificationPayload: any) {
    this.emitToUser(
      toUserId.toString(),
      'newNotification',
      notificationPayload,
    );
  }

  // Notifies the recipient that a single message was deleted (soft-delete)
  notifyDeleteMessage(toUserId: string, messageId: string) {
    this.emitToUser(toUserId.toString(), 'deleteMessage', { messageId });
  }

  // Notifies the other participant that an entire conversation was deleted
  notifyConversationDeleted(toUserId: string, deletedByUserId: string) {
    this.emitToUser(toUserId.toString(), 'conversationDeleted', {
      deletedByUserId,
    });
  }

  private getUserIdBySocketId(socketId: string): string | undefined {
    return this.socketToUser.get(socketId);
  }
}
