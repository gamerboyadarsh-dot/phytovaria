#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// PhytoVaria ESP32 IoT Node Configuration
// ============================================================================

// WiFi Network Credentials
#define WIFI_SSID     "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// Backend Server Configuration
// Note: Ensure your ESP32 and Backend are on the same local network or use a public URL.
// Format: "http://<IP_OR_HOSTNAME>:<PORT>" (e.g., "http://192.168.1.100:8000")
#define BACKEND_URL   "http://192.168.1.100:8000"

// Target Plant Identifier in the PhytoVaria Monitoring System
#define PLANT_ID      "TOMATO-001"

// DHT Sensor Hardware Configuration
#define DHT_PIN       4       // GPIO4 on ESP32 DevKit
#define DHT_TYPE      DHT22   // DHT22 (AM2302) or DHT11

// Telemetry Transmission Interval (in milliseconds)
#define INTERVAL_MS   30000   // 30,000 ms = 30 seconds

// WiFi & Network Retries
#define WIFI_TIMEOUT_MS     15000  // 15 seconds max connection wait
#define HTTP_TIMEOUT_MS     5000   // 5 seconds HTTP timeout
#define SENSOR_RETRY_DELAY  2000   // 2 seconds delay before retrying a failed DHT read

#endif // CONFIG_H
