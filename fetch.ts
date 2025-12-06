import dgram from 'node:dgram';
import { URL } from 'node:url';
import {
  Config,
  Connection,
  H3Config,
  H3Connection,
  generateCid,
  nwepAndH3Alpn,
  PROTOCOL_VERSION,
  type Header,
} from '@webprotocol/nwep';
import { isNapiError } from './napi-helpers.js';

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
}

export interface FetchResponse {
  status: string;
  statusText: string;
  headers: Map<string, string>;
  body: Buffer;
}

export async function fetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== 'web:') {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Use web://`);
  }

  let host = parsedUrl.hostname;

  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 443;
  const path = parsedUrl.pathname + parsedUrl.search;
  const method = options.method || 'GET';

  const isIPv6 = host.includes(':');

  const socketType = isIPv6 ? 'udp6' : 'udp4';
  const socket = dgram.createSocket(socketType);

  return new Promise((resolve, reject) => {
    let conn: Connection | null = null;
    let h3Conn: H3Connection | null = null;
    let streamId: number | null = null;
    let responseHeaders: Header[] = [];
    let responseBody = Buffer.alloc(0);
    let statusCode = '';
    let timeoutInterval: NodeJS.Timeout | null = null;
    let requestTimeout: NodeJS.Timeout | null = null;

    socket.on('error', (err) => {
      cleanup();
      reject(err);
    });

    socket.on('message', async (msg, rinfo) => {
      if (!conn) return;

      try {
        const fromAddr = isIPv6
          ? `[${rinfo.address}]:${rinfo.port}`
          : `${rinfo.address}:${rinfo.port}`;

        // recv can return "Done" error which isn't actually an error
        const recvResult = conn.recv(msg, fromAddr);
        if (isNapiError(recvResult) && recvResult.message !== 'Done') {
          console.error('Error receiving packet:', recvResult.message);
          return;
        }

        if (!h3Conn && conn.isEstablished()) {
          const h3Config = new H3Config();
          const h3Result = H3Connection.withTransport(conn, h3Config);

          if (isNapiError(h3Result)) {
            cleanup();
            reject(new Error(`Failed to create HTTP/3 connection: ${h3Result.message}`));
            return;
          }

          h3Conn = h3Result;

          const headers: Header[] = [
            { name: Buffer.from(':method'), value: Buffer.from(method) },
            { name: Buffer.from(':scheme'), value: Buffer.from('web') },
            { name: Buffer.from(':authority'), value: Buffer.from(isIPv6 ? `[${host}]:${port}` : `${host}:${port}`) },
            { name: Buffer.from(':path'), value: Buffer.from(path) },
            { name: Buffer.from('user-agent'), value: Buffer.from('webfetch/1.0') },
          ];

          if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
              headers.push({
                name: Buffer.from(key.toLowerCase()),
                value: Buffer.from(value)
              });
            }
          }

          const hasBody = options.body !== undefined;
          const streamResult = h3Result.sendRequest(conn, headers, !hasBody);

          if (isNapiError(streamResult)) {
            cleanup();
            reject(new Error(`Failed to send request: ${streamResult.message}`));
            return;
          }

          streamId = streamResult;

          if (hasBody && streamId !== null) {
            const bodyBuffer = typeof options.body === 'string'
              ? Buffer.from(options.body)
              : options.body!;

            const bodyResult = h3Result.sendBody(conn, streamId, bodyBuffer, true);
            if (isNapiError(bodyResult)) {
              cleanup();
              reject(new Error(`Failed to send body: ${bodyResult.message}`));
              return;
            }
          }
        }

        if (h3Conn && conn) {
          while (true) {
            const event = h3Conn.poll(conn);

            if (isNapiError(event)) {
              console.error('Error polling H3 events:', event.message);
              break;
            }

            if (!event) break;

            if (event.eventType === 'headers' && event.headers) {
              responseHeaders = event.headers;

              const statusHeader = event.headers.find((h: Header) =>
                h.name.toString() === ':status'
              );
              if (statusHeader) {
                statusCode = statusHeader.value.toString();
              }
            } else if (event.eventType === 'data' && event.streamId !== undefined) {
              const buf = Buffer.alloc(65536);
              const bytesRead = h3Conn.recvBody(conn, event.streamId, buf);

              if (isNapiError(bytesRead)) {
                console.error('Error reading body:', bytesRead.message);
                break;
              }

              if (bytesRead > 0) {
                responseBody = Buffer.concat([responseBody, buf.subarray(0, bytesRead)]);
              }
            } else if (event.eventType === 'finished') {
              cleanup();

              const headersMap = new Map<string, string>();
              for (const header of responseHeaders) {
                const name = header.name.toString();
                if (!name.startsWith(':')) {
                  headersMap.set(name, header.value.toString());
                }
              }

              resolve({
                status: statusCode || 'unknown',
                statusText: getStatusText(statusCode),
                headers: headersMap,
                body: responseBody,
              });
              return;
            } else if (event.eventType === 'reset' || event.eventType === 'goaway') {
              cleanup();
              reject(new Error(`HTTP/3 error: ${event.eventType}`));
              return;
            }
          }
        }

        sendPackets();

      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    function sendPackets() {
      if (!conn) return;

      const buf = Buffer.alloc(1200);

      while (true) {
        const len = conn.send(buf);

        if (isNapiError(len)) {
          console.error('Error sending packet:', len.message);
          break;
        }

        if (len === null || len === undefined) break;

        socket.send(buf.subarray(0, len), port, host);
      }
    }

    function setupTimeoutHandler() {
      timeoutInterval = setInterval(() => {
        if (!conn) return;

        const timeout = conn.timeout();
        if (isNapiError(timeout)) {
          return;
        }

        if (timeout !== null) {
          const onTimeoutResult = conn.onTimeout();
          if (isNapiError(onTimeoutResult)) {
            console.error('Error handling timeout:', onTimeoutResult.message);
          }
          sendPackets();
        }

        if (conn.isClosed()) {
          cleanup();
        }
      }, 10);
    }

    function cleanup() {
      try {
        if (timeoutInterval) {
          clearInterval(timeoutInterval);
          timeoutInterval = null;
        }

        if (requestTimeout) {
          clearTimeout(requestTimeout);
          requestTimeout = null;
        }

        if (conn && !conn.isClosed()) {
          const closeResult = conn.close(false, 0, Buffer.from('done'));
          if (isNapiError(closeResult)) {
            // normal during close
            if (!closeResult.message.includes('No more work to do')) {
              console.error('Error closing connection:', closeResult.message);
            }
          }
          sendPackets();
        }

        try {
          socket.close();
        } catch (err) {
          // already closed
        }
      } catch (err) {
        // ignore
      }
    }

    try {
      const config = new Config(PROTOCOL_VERSION);
      config.verifyPeer(false);

      const alpn = nwepAndH3Alpn();
      if (isNapiError(alpn)) {
        throw new Error(`Failed to get NWEP ALPN: ${alpn.message}`);
      }

      const alpnResult = config.setApplicationProtos(alpn);
      if (isNapiError(alpnResult)) {
        throw new Error(`Failed to set ALPN: ${alpnResult.message}`);
      }

      config.setMaxIdleTimeout(30000);
      config.setInitialMaxData(10000000);
      config.setInitialMaxStreamDataBidiLocal(1000000);
      config.setInitialMaxStreamDataBidiRemote(1000000);
      config.setInitialMaxStreamDataUni(1000000);
      config.setInitialMaxStreamsBidi(100);
      config.setInitialMaxStreamsUni(100);

      const scidResult = generateCid(16);
      if (isNapiError(scidResult)) {
        throw new Error(`Failed to generate connection ID: ${scidResult.message}`);
      }
      const scid = scidResult;

      const local = isIPv6 ? '[::]:0' : '0.0.0.0:0';
      const peer = isIPv6 ? `[${host}]:${port}` : `${host}:${port}`;

      const connResult = Connection.connect(scid, local, peer, config);
      if (isNapiError(connResult)) {
        throw new Error(`Failed to connect: ${connResult.message}`);
      }

      conn = connResult;

      setupTimeoutHandler();

      socket.bind(() => {
        try {
          sendPackets();
        } catch (err) {
          cleanup();
          reject(err);
        }
      });

    } catch (err) {
      cleanup();
      reject(err);
    }

    requestTimeout = setTimeout(() => {
      if (conn && !conn.isClosed()) {
        cleanup();
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    'ok': 'OK',
    'created': 'Created',
    'accepted': 'Accepted',
    'no-content': 'No Content',
    'partial-content': 'Partial Content',
    'error': 'Error',
    'not-found': 'Not Found',
    'forbidden': 'Forbidden',
    'unauthorized': 'Unauthorized',
    'bad-request': 'Bad Request',
    'conflict': 'Conflict',
    'server-error': 'Server Error',
    'not-implemented': 'Not Implemented',
    'service-unavailable': 'Service Unavailable',
  };
  return statusTexts[status] || status.charAt(0).toUpperCase() + status.slice(1);
}
