/**
 * ============================================================================
 * Project:      PhytoVaria - Smart Plant Disease & Environmental Monitoring
 * Component:    ESP32 IoT Sensor Node Firmware
 * File:         phytovaria_sensor.ino
 * Target Board: ESP32 Dev Module / NodeMCU-32S
 * Sensor:       DHT11 / DHT22 (AM2302) Temperature & Humidity Sensor
 * Baud Rate:    115200 bps
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// Initialize DHT Sensor instance
DHT dht(DHT_PIN, DHT_TYPE);

// Non-blocking timer tracking
unsigned long lastTransmissionTime = 0;
unsigned long wifiReconnectCounter = 0;

/**
 * @brief Initialize WiFi connection with timeout and retry handling
 */
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.println();
  Serial.println(F("=================================================="));
  Serial.print(F("[WiFi] Connecting to SSID: "));
  Serial.println(WIFI_SSID);
  Serial.println(F("=================================================="));

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();

  // Attempt connection until timeout
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < WIFI_TIMEOUT_MS) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("[WiFi] Successfully connected!"));
    Serial.print(F("[WiFi] Assigned IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[WiFi] Signal Strength (RSSI): "));
    Serial.print(WiFi.RSSI());
    Serial.println(F(" dBm"));
    Serial.print(F("[WiFi] MAC Address: "));
    Serial.println(WiFi.macAddress());
    Serial.println(F("=================================================="));
  } else {
    Serial.print(F("[WiFi ERROR] Failed to connect to "));
    Serial.println(WIFI_SSID);
    Serial.println(F("[WiFi ERROR] Will retry in main loop..."));
  }
}

/**
 * @brief Ensures active WiFi connectivity; reconnects if disconnected.
 * @return true if connected, false otherwise.
 */
bool ensureWiFiConnection() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println(F("[WiFi WARNING] Connection lost. Attempting reconnection..."));
  wifiReconnectCounter++;
  connectToWiFi();

  return (WiFi.status() == WL_CONNECTED);
}

/**
 * @brief Reads temperature and humidity from DHT sensor with validation.
 * @param temperature Reference to store valid temperature (Celsius)
 * @param humidity Reference to store valid relative humidity (%)
 * @return true if both readings are valid numbers, false if NaN
 */
bool readSensorData(float &temperature, float &humidity) {
  // Read humidity (%) and temperature (Celsius)
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  // Validate sensor readings
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("[SENSOR ERROR] Failed to read from DHT sensor!"));
    Serial.println(F("[SENSOR TIP] Check wiring, power supply (3.3V/5V), and pull-up resistor."));
    
    // Quick retry after short delay
    delay(SENSOR_RETRY_DELAY);
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println(F("[SENSOR ERROR] Retry reading also failed. Skipping cycle."));
      return false;
    }
  }

  // Compute Heat Index in Celsius
  float heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  Serial.println(F("--------------------------------------------------"));
  Serial.print(F("[DHT SENSOR READ] Temp: "));
  Serial.print(temperature, 1);
  Serial.print(F(" °C | Humidity: "));
  Serial.print(humidity, 1);
  Serial.print(F(" % | Heat Index: "));
  Serial.print(heatIndex, 1);
  Serial.println(F(" °C"));

  return true;
}

/**
 * @brief Packages sensor metrics into JSON and transmits to PhytoVaria backend via HTTP POST.
 * @param temperature Temperature in degrees Celsius
 * @param humidity Relative humidity in percent
 * @return true if HTTP status 200/201 was received, false otherwise.
 */
bool sendTelemetry(float temperature, float humidity) {
  if (!ensureWiFiConnection()) {
    Serial.println(F("[HTTP ERROR] Cannot send telemetry: No WiFi connection!"));
    return false;
  }

  HTTPClient http;
  String endpoint = String(BACKEND_URL) + "/api/sensor-data";

  Serial.print(F("[HTTP] Initiating POST request to: "));
  Serial.println(endpoint);

  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT_MS);

  // Construct JSON Payload compatible with both ArduinoJson v6 and v7
  // Schema: {"plant_id": PLANT_ID, "temperature": T, "humidity": H, "soil_moisture": null, "light": null}
#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<256> doc;
#endif

  doc["plant_id"] = PLANT_ID;
  doc["temperature"] = round(temperature * 10.0) / 10.0;
  doc["humidity"] = round(humidity * 10.0) / 10.0;
  doc["soil_moisture"] = nullptr; // Nullable until soil probe ADC pin is attached
  doc["light"] = nullptr;         // Nullable until LDR / BH1750 is attached

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.print(F("[HTTP] Payload: "));
  Serial.println(requestBody);

  // Send HTTP POST
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.POST(requestBody);
  unsigned long requestDuration = millis() - requestStartTime;

  bool success = false;

  if (httpResponseCode > 0) {
    Serial.print(F("[HTTP] Response Code: "));
    Serial.print(httpResponseCode);
    Serial.print(F(" (Took "));
    Serial.print(requestDuration);
    Serial.println(F(" ms)"));

    String responsePayload = http.getString();
    Serial.print(F("[HTTP] Response: "));
    Serial.println(responsePayload);

    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println(F("[SUCCESS] Sensor telemetry synced successfully with PhytoVaria Backend."));
      success = true;
    } else {
      Serial.print(F("[HTTP WARNING] Backend returned non-success code: "));
      Serial.println(httpResponseCode);
    }
  } else {
    Serial.print(F("[HTTP ERROR] POST request failed! Error code: "));
    Serial.println(httpResponseCode);
    Serial.print(F("[HTTP ERROR] Description: "));
    Serial.println(http.errorToString(httpResponseCode).c_str());
    Serial.println(F("[HTTP TIP] Verify backend server is running and accessible at BACKEND_URL."));
  }

  http.end();
  return success;
}

/**
 * @brief Arduino setup routine: initializes hardware and network.
 */
void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);
  while (!Serial && millis() < 3000) {
    // Wait for native USB serial (if applicable)
  }

  delay(500);
  Serial.println();
  Serial.println(F("=================================================="));
  Serial.println(F("   🌱 PhytoVaria Smart Plant Telemetry System 🌱   "));
  Serial.println(F("          ESP32 + DHT Sensor Node Firmware         "));
  Serial.println(F("=================================================="));
  Serial.print(F("Configured Plant ID: "));
  Serial.println(PLANT_ID);
  Serial.print(F("DHT Sensor Type:     "));
  Serial.println((DHT_TYPE == DHT22) ? F("DHT22 / AM2302") : F("DHT11"));
  Serial.print(F("DHT Data Pin:        GPIO "));
  Serial.println(DHT_PIN);
  Serial.print(F("Update Interval:     "));
  Serial.print(INTERVAL_MS / 1000);
  Serial.println(F(" seconds"));
  Serial.print(F("Backend Endpoint:    "));
  Serial.println(BACKEND_URL);
  Serial.println(F("=================================================="));

  // Initialize DHT Sensor
  dht.begin();
  Serial.println(F("[INIT] DHT sensor initialized."));

  // Connect to WiFi network
  connectToWiFi();

  Serial.println(F("[INIT] Setup complete. Starting periodic sensor monitoring loop..."));
  Serial.println();
}

/**
 * @brief Main periodic execution loop.
 */
void loop() {
  unsigned long currentMillis = millis();

  // Execute transmission every INTERVAL_MS
  if (currentMillis - lastTransmissionTime >= INTERVAL_MS || lastTransmissionTime == 0) {
    lastTransmissionTime = currentMillis;

    float temperature = 0.0;
    float humidity = 0.0;

    // Read DHT Sensor
    if (readSensorData(temperature, humidity)) {
      // Transmit Telemetry over HTTP
      sendTelemetry(temperature, humidity);
    } else {
      Serial.println(F("[LOOP WARNING] Telemetry skipped due to invalid sensor reading."));
    }

    Serial.print(F("[TIMER] Next update in "));
    Serial.print(INTERVAL_MS / 1000);
    Serial.println(F(" seconds..."));
    Serial.println();
  }

  // Small delay to prevent tight loop and allow ESP32 RTOS background housekeeping
  delay(50);
}
