package io.loveygames.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.DhcpInfo;
import android.net.LinkProperties;
import android.net.Network;
import android.net.RouteInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "HotspotSync")
public class HotspotSyncPlugin extends Plugin {
    private static final int UDP_PORT = 45455;
    private static final int WS_PORT = 45456;
    private static final String WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    private static final String PING_TOKEN = "LOVEY_PING";
    private static final String PONG_PREFIX = "LOVEY_HOST:";

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Object sendLock = new Object();

    private volatile boolean hostRunning = false;
    private ServerSocket serverSocket;
    private DatagramSocket udpSocket;
    private Socket clientSocket;
    private OutputStream clientOut;

    @PluginMethod
    public void startHost(PluginCall call) {
        stopHostInternal();
        hostRunning = true;

        executor.execute(() -> {
            try {
                udpSocket = new DatagramSocket(UDP_PORT);
                udpSocket.setBroadcast(true);
                byte[] buf = new byte[128];
                while (hostRunning && udpSocket != null && !udpSocket.isClosed()) {
                    DatagramPacket packet = new DatagramPacket(buf, buf.length);
                    udpSocket.receive(packet);
                    String msg = new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8).trim();
                    if (PING_TOKEN.equals(msg)) {
                        byte[] reply = (PONG_PREFIX + WS_PORT).getBytes(StandardCharsets.UTF_8);
                        DatagramPacket resp = new DatagramPacket(reply, reply.length, packet.getAddress(), packet.getPort());
                        udpSocket.send(resp);
                    }
                }
            } catch (IOException ignored) {
                // Socket closed on stopHost
            }
        });

        executor.execute(() -> {
            try {
                serverSocket = new ServerSocket(WS_PORT);
                JSObject started = new JSObject();
                started.put("port", WS_PORT);
                call.resolve(started);

                while (hostRunning && serverSocket != null && !serverSocket.isClosed()) {
                    Socket incoming = serverSocket.accept();
                    closeClientSocket();
                    handleClientConnection(incoming);
                }
            } catch (IOException e) {
                if (hostRunning) {
                    call.reject("Failed to start hotspot server: " + e.getMessage());
                }
            }
        });
    }

    private void handleClientConnection(Socket socket) {
        executor.execute(() -> {
            try {
                socket.setTcpNoDelay(true);
                BufferedInputStream in = new BufferedInputStream(socket.getInputStream());
                OutputStream out = socket.getOutputStream();

                String wsKey = readHttpUpgradeKey(in);
                if (wsKey == null) {
                    socket.close();
                    return;
                }

                String acceptKey = computeWebSocketAccept(wsKey);
                String response = "HTTP/1.1 101 Switching Protocols\r\n"
                        + "Upgrade: websocket\r\n"
                        + "Connection: Upgrade\r\n"
                        + "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
                out.write(response.getBytes(StandardCharsets.UTF_8));
                out.flush();

                synchronized (sendLock) {
                    clientSocket = socket;
                    clientOut = out;
                }

                notifyListeners("clientConnected", new JSObject());

                while (hostRunning && !socket.isClosed()) {
                    WsFrame frame = readWebSocketFrame(in);
                    if (frame == null) break;
                    if (frame.opcode == 0x8) {
                        break; // Close frame
                    } else if (frame.opcode == 0x9) {
                        sendRawFrame(0x8A, frame.payload); // Pong
                    } else if (frame.opcode == 0x1) {
                        String text = new String(frame.payload, StandardCharsets.UTF_8);
                        JSObject data = new JSObject();
                        data.put("payload", text);
                        notifyListeners("message", data);
                    }
                }
            } catch (Exception ignored) {
                // Client disconnected
            } finally {
                if (clientSocket == socket) {
                    closeClientSocket();
                } else {
                    try {
                        socket.close();
                    } catch (IOException ignored) {}
                }
                if (hostRunning) {
                    notifyListeners("clientDisconnected", new JSObject());
                }
            }
        });
    }

    @PluginMethod
    public void sendToClient(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null) {
            call.reject("Missing payload");
            return;
        }
        executor.execute(() -> {
            try {
                sendRawFrame(0x81, payload.getBytes(StandardCharsets.UTF_8));
                call.resolve();
            } catch (IOException e) {
                call.reject("Send failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopHost(PluginCall call) {
        stopHostInternal();
        call.resolve();
    }

    @PluginMethod
    public void discoverHost(PluginCall call) {
        executor.execute(() -> {
            String gatewayIp = resolveGatewayIp();

            // 1. Try UDP discovery (broadcast + direct gateway)
            try (DatagramSocket ds = new DatagramSocket()) {
                ds.setBroadcast(true);
                ds.setSoTimeout(450);
                byte[] ping = PING_TOKEN.getBytes(StandardCharsets.UTF_8);

                List<InetAddress> targets = new ArrayList<>();
                if (gatewayIp != null) {
                    targets.add(InetAddress.getByName(gatewayIp));
                }
                targets.add(InetAddress.getByName("255.255.255.255"));

                for (int attempt = 0; attempt < 3; attempt++) {
                    for (InetAddress target : targets) {
                        try {
                            ds.send(new DatagramPacket(ping, ping.length, target, UDP_PORT));
                        } catch (IOException ignored) {}
                    }
                    try {
                        byte[] buf = new byte[128];
                        DatagramPacket resp = new DatagramPacket(buf, buf.length);
                        ds.receive(resp);
                        String reply = new String(resp.getData(), 0, resp.getLength(), StandardCharsets.UTF_8).trim();
                        if (reply.startsWith(PONG_PREFIX)) {
                            JSObject res = new JSObject();
                            res.put("found", true);
                            res.put("hostIp", resp.getAddress().getHostAddress());
                            res.put("port", WS_PORT);
                            call.resolve(res);
                            return;
                        }
                    } catch (IOException ignored) {
                        // Timeout, try next attempt
                    }
                }
            } catch (Exception ignored) {}

            // 2. Fallback: direct TCP port check on gateway IP or common Android hotspot IPs
            List<String> fallbackIps = new ArrayList<>();
            if (gatewayIp != null) fallbackIps.add(gatewayIp);
            if (!fallbackIps.contains("192.168.43.1")) fallbackIps.add("192.168.43.1");
            if (!fallbackIps.contains("192.168.49.1")) fallbackIps.add("192.168.49.1");

            for (String ip : fallbackIps) {
                try (Socket probe = new Socket()) {
                    probe.connect(new InetSocketAddress(ip, WS_PORT), 700);
                    JSObject res = new JSObject();
                    res.put("found", true);
                    res.put("hostIp", ip);
                    res.put("port", WS_PORT);
                    call.resolve(res);
                    return;
                } catch (IOException ignored) {}
            }

            JSObject res = new JSObject();
            res.put("found", false);
            res.put("gatewayIp", gatewayIp);
            call.resolve(res);
        });
    }

    private String resolveGatewayIp() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network active = cm.getActiveNetwork();
                if (active != null) {
                    LinkProperties lp = cm.getLinkProperties(active);
                    if (lp != null) {
                        for (RouteInfo route : lp.getRoutes()) {
                            if (route.isDefaultRoute() && route.getGateway() instanceof Inet4Address) {
                                String host = route.getGateway().getHostAddress();
                                if (host != null && !host.equals("0.0.0.0")) {
                                    return host;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                DhcpInfo dhcp = wm.getDhcpInfo();
                if (dhcp != null && dhcp.gateway != 0) {
                    int gw = dhcp.gateway;
                    return (gw & 0xFF) + "."
                            + ((gw >> 8) & 0xFF) + "."
                            + ((gw >> 16) & 0xFF) + "."
                            + ((gw >> 24) & 0xFF);
                }
            }
        } catch (Exception ignored) {}

        return null;
    }

    private void stopHostInternal() {
        hostRunning = false;
        closeClientSocket();
        if (serverSocket != null) {
            try { serverSocket.close(); } catch (IOException ignored) {}
            serverSocket = null;
        }
        if (udpSocket != null) {
            udpSocket.close();
            udpSocket = null;
        }
    }

    private void closeClientSocket() {
        synchronized (sendLock) {
            if (clientOut != null) {
                try { clientOut.close(); } catch (IOException ignored) {}
                clientOut = null;
            }
            if (clientSocket != null) {
                try { clientSocket.close(); } catch (IOException ignored) {}
                clientSocket = null;
            }
        }
    }

    private void sendRawFrame(int firstByte, byte[] payload) throws IOException {
        synchronized (sendLock) {
            if (clientOut == null) {
                throw new IOException("No connected hotspot client");
            }
            ByteArrayOutputStream frame = new ByteArrayOutputStream();
            frame.write(firstByte);
            int len = payload.length;
            if (len <= 125) {
                frame.write(len);
            } else if (len <= 65535) {
                frame.write(126);
                frame.write((len >> 8) & 0xFF);
                frame.write(len & 0xFF);
            } else {
                frame.write(127);
                for (int i = 7; i >= 0; i--) {
                    frame.write((int) (((long) len >> (8 * i)) & 0xFF));
                }
            }
            frame.write(payload);
            clientOut.write(frame.toByteArray());
            clientOut.flush();
        }
    }

    private static String readHttpUpgradeKey(InputStream in) throws IOException {
        ByteArrayOutputStream headerBuf = new ByteArrayOutputStream();
        int prev1 = 0, prev2 = 0, prev3 = 0;
        int b;
        while ((b = in.read()) != -1) {
            headerBuf.write(b);
            if (prev3 == '\r' && prev2 == '\n' && prev1 == '\r' && b == '\n') {
                break;
            }
            prev3 = prev2;
            prev2 = prev1;
            prev1 = b;
            if (headerBuf.size() > 8192) return null;
        }
        String headers = headerBuf.toString(StandardCharsets.UTF_8.name());
        for (String line : headers.split("\r\n")) {
            int colon = line.indexOf(':');
            if (colon > 0) {
                String name = line.substring(0, colon).trim();
                if (name.equalsIgnoreCase("Sec-WebSocket-Key")) {
                    return line.substring(colon + 1).trim();
                }
            }
        }
        return null;
    }

    private static String computeWebSocketAccept(String key) throws Exception {
        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] hash = sha1.digest((key + WS_GUID).getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(hash, Base64.NO_WRAP);
    }

    private static class WsFrame {
        final int opcode;
        final byte[] payload;

        WsFrame(int opcode, byte[] payload) {
            this.opcode = opcode;
            this.payload = payload;
        }
    }

    private static WsFrame readWebSocketFrame(InputStream in) throws IOException {
        int b1 = in.read();
        if (b1 == -1) return null;
        int b2 = in.read();
        if (b2 == -1) return null;

        int opcode = b1 & 0x0F;
        boolean masked = (b2 & 0x80) != 0;
        long len = b2 & 0x7F;

        if (len == 126) {
            len = ((in.read() & 0xFF) << 8) | (in.read() & 0xFF);
        } else if (len == 127) {
            len = 0;
            for (int i = 0; i < 8; i++) {
                int next = in.read();
                if (next == -1) throw new EOFException();
                len = (len << 8) | (next & 0xFF);
            }
        }

        if (len > 1024 * 1024) {
            throw new IOException("Frame too large");
        }

        byte[] mask = new byte[4];
        if (masked) {
            readFully(in, mask, 4);
        }

        byte[] payload = new byte[(int) len];
        readFully(in, payload, (int) len);
        if (masked) {
            for (int i = 0; i < payload.length; i++) {
                payload[i] = (byte) (payload[i] ^ mask[i % 4]);
            }
        }
        return new WsFrame(opcode, payload);
    }

    private static void readFully(InputStream in, byte[] dst, int len) throws IOException {
        int offset = 0;
        while (offset < len) {
            int r = in.read(dst, offset, len - offset);
            if (r == -1) throw new EOFException();
            offset += r;
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopHostInternal();
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
