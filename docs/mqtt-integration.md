# MQTT Integration Guide - Apadbandhav IoT

## Overview

This document covers the complete MQTT integration for Apadbandhav IoT accident detection system.

## Architecture

```
┌─────────────────┐     MQTT (mqtts)     ┌─────────────────┐     WebSocket     ┌─────────────────┐
│   ESP32/NodeMCU │ ──────────────────► │  NestJS Backend  │ ────────────────► │  React Frontend │
│   IoT Device    │                      │  EMQX Cloud      │                   │  Dashboard      │
└─────────────────┘                      └─────────────────┘                   └─────────────────┘
```

## Environment Variables

```env
MQTT_HOST=vfee050a.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USERNAME=balarakesh
MQTT_PASSWORD=Balarakesh@16
MQTT_CLIENT_ID=apadbandhav-backend-1
MQTT_PROTOCOL=mqtts
```

## Topic Structure

| Topic Pattern | Direction | Description |
|--------------|-----------|-------------|
| `devices/{deviceId}/accident` | Device → Backend | Accident detection events |
| `devices/{deviceId}/telemetry` | Device → Backend | GPS, speed, battery data |
| `devices/{deviceId}/events` | Device → Backend | General events |
| `devices/{deviceId}/health` | Device → Backend | Device health status |
| `backend/{deviceId}/commands` | Backend → Device | Commands to device |

## Payload Formats

### Accident Event
```json
{
  "deviceId": "1234567890123456",
  "timestamp": "2025-12-06T14:00:00Z",
  "location": { "lat": 16.30, "lng": 80.44 },
  "speed": 92,
  "impact": 5.2,
  "event": "accident",
  "severity": "high",
  "sensorData": {
    "accelerometer": { "x": 2.5, "y": -1.2, "z": 9.8 },
    "gyroscope": { "x": 0.1, "y": 0.3, "z": -0.2 }
  }
}
```

### Telemetry Data
```json
{
  "deviceId": "1234567890123456",
  "timestamp": "2025-12-06T14:00:00Z",
  "location": { "lat": 16.30, "lng": 80.44 },
  "speed": 45,
  "heading": 180,
  "altitude": 150,
  "batteryLevel": 85,
  "signalStrength": -65
}
```

### Health Check
```json
{
  "deviceId": "1234567890123456",
  "timestamp": "2025-12-06T14:00:00Z",
  "status": "online",
  "batteryLevel": 85,
  "firmwareVersion": "1.0.0",
  "uptime": 3600
}
```

---

## Testing with MQTTX

### 1. Connection Settings
- **Host:** vfee050a.ala.us-east-1.emqxsl.com
- **Port:** 8883
- **Protocol:** mqtts (SSL/TLS)
- **Username:** balarakesh
- **Password:** Balarakesh@16

### 2. Test Accident Event
```bash
# Topic
devices/1234567890123456/accident

# Payload
{
  "deviceId": "1234567890123456",
  "timestamp": "2025-12-06T14:00:00Z",
  "location": { "lat": 16.30, "lng": 80.44 },
  "speed": 92,
  "impact": 5.2,
  "event": "accident"
}
```

### 3. Test Telemetry
```bash
# Topic
devices/1234567890123456/telemetry

# Payload
{
  "deviceId": "1234567890123456",
  "timestamp": "2025-12-06T14:00:00Z",
  "location": { "lat": 16.30, "lng": 80.44 },
  "speed": 45,
  "batteryLevel": 85
}
```

---

## ESP32 Arduino Code

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "vfee050a.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "balarakesh";
const char* mqtt_password = "Balarakesh@16";

// Device ID (16-digit code from QR)
const char* deviceId = "1234567890123456";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Topics
String accidentTopic;
String telemetryTopic;
String healthTopic;
String commandTopic;

void setup() {
  Serial.begin(115200);
  
  // Setup topics
  accidentTopic = "devices/" + String(deviceId) + "/accident";
  telemetryTopic = "devices/" + String(deviceId) + "/telemetry";
  healthTopic = "devices/" + String(deviceId) + "/health";
  commandTopic = "backend/" + String(deviceId) + "/commands";
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  
  // Setup MQTT
  espClient.setInsecure(); // Skip certificate verification (use CA cert in production)
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  reconnect();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Send telemetry every 10 seconds
  static unsigned long lastTelemetry = 0;
  if (millis() - lastTelemetry > 10000) {
    sendTelemetry();
    lastTelemetry = millis();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "apadbandhav-device-" + String(deviceId);
    
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected!");
      
      // Subscribe to commands
      client.subscribe(commandTopic.c_str());
      
      // Send health status
      sendHealth();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse command
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  
  const char* command = doc["command"];
  Serial.print("Command: ");
  Serial.println(command);
}

void sendTelemetry() {
  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject location = doc.createNestedObject("location");
  location["lat"] = 16.3067;  // Replace with actual GPS
  location["lng"] = 80.4365;
  
  doc["speed"] = 45;
  doc["batteryLevel"] = 85;
  doc["signalStrength"] = WiFi.RSSI();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  client.publish(telemetryTopic.c_str(), buffer);
  Serial.println("Telemetry sent");
}

void sendHealth() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = getISOTimestamp();
  doc["status"] = "online";
  doc["batteryLevel"] = 85;
  doc["firmwareVersion"] = "1.0.0";
  doc["uptime"] = millis() / 1000;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish(healthTopic.c_str(), buffer);
}

void sendAccident(float impact, float speed, float lat, float lng) {
  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = getISOTimestamp();
  doc["event"] = "accident";
  doc["impact"] = impact;
  doc["speed"] = speed;
  
  JsonObject location = doc.createNestedObject("location");
  location["lat"] = lat;
  location["lng"] = lng;
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  client.publish(accidentTopic.c_str(), buffer, true); // Retain message
  Serial.println("ACCIDENT ALERT SENT!");
}

String getISOTimestamp() {
  // Simplified - use NTP in production
  return "2025-12-06T14:00:00Z";
}
```

---

## NodeMCU (ESP8266) Code

```cpp
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Same configuration as ESP32...
// (Replace WiFiClientSecure with BearSSL::WiFiClientSecure for ESP8266)

BearSSL::WiFiClientSecure espClient;
// Rest of the code is similar to ESP32
```

---

## Frontend React Usage

```tsx
import { useAccidentAlerts, useDeviceTelemetry } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

function Dashboard() {
  const { toast } = useToast();
  
  // Listen for accidents
  const accidents = useAccidentAlerts((accident) => {
    toast({
      variant: "destructive",
      title: "🚨 Accident Detected!",
      description: `Device ${accident.data.deviceId} reported an accident`,
    });
  });
  
  // Listen for telemetry
  const telemetry = useDeviceTelemetry();
  
  return (
    <div>
      <h2>Recent Accidents: {accidents.length}</h2>
      {telemetry && (
        <div>
          Speed: {telemetry.data?.speed} km/h
          Battery: {telemetry.data?.batteryLevel}%
        </div>
      )}
    </div>
  );
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mqtt/stats` | Get MQTT connection stats |
| GET | `/api/mqtt/events?deviceId=...` | Get events for device |
| GET | `/api/mqtt/accidents` | Get recent accidents |

---

## Troubleshooting

### Connection Issues
1. Verify MQTT credentials in `.env`
2. Check if port 8883 is not blocked by firewall
3. Ensure SSL/TLS is enabled (mqtts protocol)

### No Messages Received
1. Check topic subscriptions in logs
2. Verify device is publishing to correct topics
3. Test with MQTTX client first

### WebSocket Not Connecting
1. Ensure backend is running on correct port
2. Check CORS configuration
3. Verify Socket.IO client version matches server
