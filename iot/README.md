# 🌿 PhytoVaria IoT - ESP32 Telemetry Node

PhytoVaria is an AI-powered smart agriculture and plant pathology monitoring system. This IoT module provides real-time ambient telemetry (temperature, relative humidity, and heat index) collected via an ESP32 microcontroller and DHT11/DHT22 sensor, streaming data every 30 seconds to the PhytoVaria backend API.

---

## 1. Hardware Requirements

| Component | Description | Quantity |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32 Dev Module / NodeMCU-32S / ESP-WROOM-32 | 1 |
| **Environmental Sensor** | DHT22 (AM2302) recommended or DHT11 | 1 |
| **Pull-up Resistor** | 10kΩ 1/4W resistor (Required only for bare 4-pin sensors) | 1 |
| **Prototyping Board** | Half-size or full-size solderless breadboard | 1 |
| **Jumper Wires** | Male-to-Male or Male-to-Female Dupont wires | 3–5 |
| **Connection Cable** | Micro-USB or USB-C (Data + Power cable) | 1 |
| **Power Supply** | 5V USB wall adapter or Computer USB port | 1 |

---

## 2. Required Arduino Libraries

Install these libraries via **Arduino IDE Library Manager** (`Sketch` -> `Include Library` -> `Manage Libraries...` or `Ctrl+Shift+I`):

| Library Name | Author | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **DHT sensor library** | Adafruit | `v1.4.6` | DHT11/DHT22 communication driver |
| **Adafruit Unified Sensor** | Adafruit | `v1.1.14` | Hardware abstraction layer for Adafruit sensors |
| **ArduinoJson** | Benoit Blanchon | `v7.0.4` (or `v6.21.5`) | High-performance JSON serialization |
| **WiFi** | Espressif Systems | Built-in (ESP32 Core) | 802.11 b/g/n wireless connectivity |
| **HTTPClient** | Espressif Systems | Built-in (ESP32 Core) | HTTP REST client for telemetry POST |

---

## 3. Toolchain & Board Package Installation

### Step 1: Install Arduino IDE
Download and install **Arduino IDE 2.x** (or 1.8.19+) from the official [Arduino Website](https://www.arduino.cc/en/software).

### Step 2: Add ESP32 Board Package URL
1. Open Arduino IDE and navigate to **File** -> **Preferences** (`Ctrl + ,`).
2. Locate **Additional boards manager URLs** and append:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Click **OK**.

### Step 3: Install ESP32 Board Core
1. Navigate to **Tools** -> **Board** -> **Boards Manager...** (or click the Board icon on the left sidebar).
2. Search for `esp32` by **Espressif Systems**.
3. Click **Install** (version `2.0.14` or `3.0.x`).

### Step 4: Select Board & Port
1. Go to **Tools** -> **Board** -> **esp32** -> Select **ESP32 Dev Module** (or your specific board model).
2. Connect your ESP32 board via USB.
3. Go to **Tools** -> **Port** -> Select the active COM port (e.g., `COM3`, `COM4` on Windows).

---

## 4. Firmware Configuration

Open [`esp32_firmware/config.h`](file:///C:/Users/agraw/.gemini/antigravity/scratch/phytovaria/iot/esp32_firmware/config.h) and customize the settings:

```cpp
// 1. Enter your local 2.4 GHz WiFi credentials
#define WIFI_SSID     "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// 2. Set backend endpoint (Use your local machine's IP if hosting locally)
#define BACKEND_URL   "http://192.168.1.100:8000"

// 3. Set the target plant identifier
#define PLANT_ID      "TOMATO-001"

// 4. Set GPIO pin & sensor type
#define DHT_PIN       4       // GPIO4
#define DHT_TYPE      DHT22   // Set to DHT11 if using blue DHT11 sensor

// 5. Set telemetry interval
#define INTERVAL_MS   30000   // 30 seconds
```

> [!NOTE]
> ESP32 supports **2.4 GHz WiFi only**. It will not connect to 5 GHz-only SSIDs.

---

## 5. Wiring the Circuit

Refer to the complete guide in [`wiring_diagram.md`](file:///C:/Users/agraw/.gemini/antigravity/scratch/phytovaria/iot/wiring_diagram.md).

Quick connection summary:
- **DHT VCC** -> ESP32 **3V3**
- **DHT GND** -> ESP32 **GND**
- **DHT DATA** -> ESP32 **GPIO 4** (with 10kΩ pull-up to 3V3 if bare 4-pin sensor)

---

## 6. Flashing the Firmware

1. Open [`esp32_firmware/phytovaria_sensor.ino`](file:///C:/Users/agraw/.gemini/antigravity/scratch/phytovaria/iot/esp32_firmware/phytovaria_sensor.ino) in Arduino IDE.
2. Verify board settings:
   - **Board:** `ESP32 Dev Module`
   - **Upload Speed:** `921600` or `115200`
   - **Flash Frequency:** `80MHz`
   - **Flash Mode:** `QIO`
3. Click the **Verify** button (Checkmark icon) to compile.
4. Click the **Upload** button (Right Arrow icon).
   - *Note:* If you see `Connecting........_____.....` in the console, press and hold the **BOOT / IO0** button on the ESP32 until the flashing percentage begins.

---

## 7. Using the Serial Monitor

1. Open **Tools** -> **Serial Monitor** (`Ctrl + Shift + M`).
2. Set the baud rate in the bottom right corner to **115200 baud**.
3. Press the **EN / RST** button on the ESP32.
4. You will see the startup banner and periodic telemetry logs:

```text
==================================================
   🌱 PhytoVaria Smart Plant Telemetry System 🌱   
          ESP32 + DHT Sensor Node Firmware         
==================================================
Configured Plant ID: TOMATO-001
DHT Sensor Type:     DHT22 / AM2302
DHT Data Pin:        GPIO 4
Update Interval:     30 seconds
Backend Endpoint:    http://192.168.1.100:8000
==================================================
[INIT] DHT sensor initialized.
[WiFi] Connecting to SSID: HomeNetwork
........
[WiFi] Successfully connected!
[WiFi] Assigned IP Address: 192.168.1.145
[WiFi] Signal Strength (RSSI): -54 dBm
--------------------------------------------------
[DHT SENSOR READ] Temp: 26.4 °C | Humidity: 68.2 % | Heat Index: 27.1 °C
[HTTP] Initiating POST request to: http://192.168.1.100:8000/api/sensor-data
[HTTP] Payload: {"plant_id":"TOMATO-001","temperature":26.4,"humidity":68.2,"soil_moisture":null,"light":null}
[HTTP] Response Code: 200 (Took 112 ms)
[HTTP] Response: {"status":"success","message":"Telemetry recorded","id":"66c1b3f..."}
[SUCCESS] Sensor telemetry synced successfully with PhytoVaria Backend.
[TIMER] Next update in 30 seconds...
```

---

## 8. Backend API Endpoint Specification

### `POST /api/sensor-data`

Receives live sensor telemetry payloads from IoT nodes.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Payload
```json
{
  "plant_id": "TOMATO-001",
  "temperature": 26.4,
  "humidity": 68.2,
  "soil_moisture": null,
  "light": null
}
```

#### Field Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `plant_id` | `string` | Unique plant / batch identifier matching database records |
| `temperature` | `float` | Ambient temperature in degrees Celsius (`°C`) |
| `humidity` | `float` | Relative humidity percentage (`%`) |
| `soil_moisture`| `float \| null` | Optional soil moisture percentage (0-100%) or `null` |
| `light` | `float \| null` | Optional ambient illuminance (lux) or `null` |

#### Successful Response (`200 OK` / `201 Created`)
```json
{
  "status": "success",
  "message": "Telemetry recorded successfully",
  "timestamp": "2026-08-18T00:15:00Z"
}
```

---

## 9. Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`[SENSOR ERROR] Failed to read from DHT sensor!`** | Loose wiring, wrong GPIO pin, or missing pull-up resistor | • Verify data pin is connected to `GPIO 4`.<br>• For 4-pin bare DHT, insert a 10kΩ pull-up resistor between VCC and DATA.<br>• Check that sensor is receiving 3.3V power. |
| **`[WiFi ERROR] Failed to connect`** | Incorrect SSID/password or 5GHz network | • Verify credentials in `config.h`.<br>• Ensure WiFi router broadcasts 2.4 GHz. |
| **`[HTTP ERROR] POST request failed! Error code: -1`** | Backend server unreachable / firewall blocking | • Ensure backend is running (`uvicorn backend.main:app --host 0.0.0.0 --port 8000`).<br>• Check that ESP32 and host machine are on the same subnet.<br>• Allow port 8000 through Windows Defender Firewall. |
| **Serial Monitor displays garbled text (``)** | Baud rate mismatch | Change Serial Monitor baud rate setting to `115200 baud`. |
| **Upload error: `A fatal error occurred: Failed to connect to ESP32`** | ESP32 failed to enter bootloader | Hold down the **BOOT** button on the ESP32 while Arduino IDE displays `Connecting...`, then release once uploading starts. |
| **Continuous ESP32 reboot / Brownout detector triggered** | Inadequate USB power supply | Use a powered USB hub or higher quality USB cable. |

---

## 10. Demo Mode Instructions (No Hardware / Disconnected ESP32)

If physical ESP32 or DHT sensors are not connected during presentation or hackathon judging:

1. **Frontend Demo Mode Toggle:**
   - In the PhytoVaria web dashboard navigation bar, click the **Demo Mode** toggle switch.
   - When enabled, the frontend automatically simulates incoming real-time telemetry curves, temperature/humidity fluctuations, and disease risk alerts without requiring active hardware.

2. **Simulated Telemetry Generator (Backend CLI):**
   - You can also simulate an active ESP32 node sending real POST requests by running the backend mock telemetry script:
     ```bash
     curl -X POST http://localhost:8000/api/sensor-data \
       -H "Content-Type: application/json" \
       -d "{\"plant_id\": \"TOMATO-001\", \"temperature\": 27.5, \"humidity\": 65.0, \"soil_moisture\": null, \"light\": null}"
     ```
