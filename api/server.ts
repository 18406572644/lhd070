import app from './app.js';
import { WebSocketServer, type WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import db from './database.js';
import { URL } from 'url';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  username?: string;
  role?: string;
  orderId?: number;
}

interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cybercraft_secret';

const PORT = process.env.PORT || 6070;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

function formatMessage(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    orderId: row.orderId,
    senderId: row.senderId,
    senderName: row.senderName,
    senderRole: row.senderRole,
    senderAvatar: row.senderAvatar,
    type: row.type,
    content: row.content,
    readBy: JSON.parse((row.readBy as string) || '[]'),
    createdAt: row.createdAt,
  };
}

function send(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function getOrderParticipants(orderId: number): number[] {
  const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId) as
    | { userId: number }
    | undefined;
  if (!order) return [];

  const participants: number[] = [order.userId];

  const merchants = db
    .prepare("SELECT id FROM users WHERE role IN ('merchant','admin')")
    .all() as { id: number }[];
  for (const m of merchants) {
    if (!participants.includes(m.id)) {
      participants.push(m.id);
    }
  }

  return participants;
}

function broadcastToOrder(orderId: number, data: Record<string, unknown>, excludeWs?: WebSocket): void {
  for (const client of wss.clients) {
    const c = client as AuthenticatedWebSocket;
    if (c.readyState === c.OPEN && c.orderId === orderId && c !== excludeWs) {
      send(c, data);
    }
  }
}

wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';
    const orderIdParam = url.searchParams.get('orderId') || '';

    if (!token) {
      send(ws, { type: 'error', error: '未提供认证令牌' });
      ws.close();
      return;
    }

    let decoded: { id: number; username: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    } catch {
      send(ws, { type: 'error', error: '令牌无效或已过期' });
      ws.close();
      return;
    }

    const user = db.prepare('SELECT id, username, role, banned FROM users WHERE id = ?').get(decoded.id) as
      | { id: number; username: string; role: string; banned: number }
      | undefined;

    if (!user) {
      send(ws, { type: 'error', error: '用户不存在' });
      ws.close();
      return;
    }

    if (user.banned) {
      send(ws, { type: 'error', error: '账号已被封禁' });
      ws.close();
      return;
    }

    ws.userId = user.id;
    ws.username = user.username;
    ws.role = user.role;

    if (orderIdParam) {
      const orderId = Number(orderIdParam);
      const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId) as
        | { userId: number }
        | undefined;

      if (!order) {
        send(ws, { type: 'error', error: '订单不存在' });
      } else if (user.role === 'user' && order.userId !== user.id) {
        send(ws, { type: 'error', error: '无权访问此订单' });
      } else {
        ws.orderId = orderId;
      }
    }

    send(ws, { type: 'connected', userId: ws.userId, username: ws.username, role: ws.role });
  } catch (error) {
    send(ws, { type: 'error', error: '连接失败' });
    ws.close();
    return;
  }

  ws.on('message', (raw) => {
    if (ws.userId === undefined) return;

    let msg: WSMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', error: '无效的消息格式' });
      return;
    }

    if (msg.type === 'subscribe' && msg.payload?.orderId) {
      const orderId = Number(msg.payload.orderId);
      const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId) as
        | { userId: number }
        | undefined;

      if (!order) {
        send(ws, { type: 'error', error: '订单不存在' });
        return;
      }

      if (ws.role === 'user' && order.userId !== ws.userId) {
        send(ws, { type: 'error', error: '无权访问此订单' });
        return;
      }

      ws.orderId = orderId;
      send(ws, { type: 'subscribed', orderId });
      return;
    }

    if (msg.type === 'send_message' && msg.payload) {
      const { orderId, type = 'text', content } = msg.payload as {
        orderId: number;
        type?: string;
        content: string;
      };

      if (!orderId || !content || !content.trim()) {
        send(ws, { type: 'error', error: '消息内容或订单ID无效' });
        return;
      }

      const order = db.prepare('SELECT userId FROM orders WHERE id = ?').get(orderId) as
        | { userId: number }
        | undefined;
      if (!order) {
        send(ws, { type: 'error', error: '订单不存在' });
        return;
      }
      if (ws.role === 'user' && order.userId !== ws.userId) {
        send(ws, { type: 'error', error: '无权在此订单发送消息' });
        return;
      }
      if (!['text', 'image'].includes(type as string)) {
        send(ws, { type: 'error', error: '无效的消息类型' });
        return;
      }

      const readBy = JSON.stringify([ws.userId]);

      const result = db
        .prepare(
          'INSERT INTO order_messages (orderId, senderId, type, content, readBy) VALUES (?, ?, ?, ?, ?)',
        )
        .run(orderId, ws.userId, type, content.trim(), readBy);

      const row = db
        .prepare(
          `SELECT m.*, u.username AS senderName, u.role AS senderRole, u.avatar AS senderAvatar
           FROM order_messages m JOIN users u ON m.senderId = u.id WHERE m.id = ?`,
        )
        .get(result.lastInsertRowid) as Record<string, unknown>;

      const message = formatMessage(row);

      send(ws, { type: 'message_sent', message });
      broadcastToOrder(orderId, { type: 'new_message', message }, ws);

      const participants = getOrderParticipants(orderId);
      for (const pid of participants) {
        if (pid !== ws.userId) {
          for (const client of wss.clients) {
            const c = client as AuthenticatedWebSocket;
            if (c.readyState === c.OPEN && c.userId === pid && (!c.orderId || c.orderId !== orderId)) {
              send(c, { type: 'new_message_notification', orderId, message });
            }
          }
        }
      }
      return;
    }

    if (msg.type === 'mark_read' && msg.payload?.orderId) {
      const orderId = Number(msg.payload.orderId);
      const userId = ws.userId;

      const rows = db
        .prepare('SELECT id, readBy FROM order_messages WHERE orderId = ? AND senderId != ?')
        .all(orderId, userId) as { id: number; readBy: string }[];

      const updateStmt = db.prepare('UPDATE order_messages SET readBy = ? WHERE id = ?');

      const updateAll = db.transaction(() => {
        for (const row of rows) {
          const readBy = JSON.parse(row.readBy || '[]') as number[]
          if (!readBy.includes(userId)) {
            readBy.push(userId)
            updateStmt.run(JSON.stringify(readBy), row.id)
          }
        }
      })

      updateAll()

      broadcastToOrder(orderId, { type: 'messages_read', orderId, userId })
      send(ws, { type: 'marked_read', orderId })
      return
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong' })
      return
    }
  })

  ws.on('close', () => {
  })
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

export default app;
