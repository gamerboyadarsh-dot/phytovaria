# PhytoVaria ESP32 + DHT11 / DHT22 Wiring Guide

This document describes the hardware wiring, electrical specifications, and pin mapping between the **ESP32 DevKit** and **DHT11 / DHT22 (AM2302)** temperature and humidity sensors.

---

## 1. Pin Connection Table

### Option A: 3-Pin DHT Module (Sensor on breakout PCB with built-in pull-up resistor)

| DHT Module Pin | Label / Markings | ESP32 DevKit Pin | Function | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Pin 1 (VCC)** | `+` or `VCC` | `3V3` (or `VIN` / `5V`) | Power Supply | 3.3V is recommended for direct ESP32 GPIO logic compatibility |
| **Pin 2 (DATA)**| `OUT` or `S` or `DAT` | `GPIO 4` (D4) | 1-Wire Bi-directional Data | Configured as `DHT_PIN 4` in `config.h` |
| **Pin 3 (GND)** | `-` or `GND` | `GND` | Common Ground | Connect to any ESP32 ground pin |

> [!TIP]
> Most 3-pin breakout modules (KY-015, Adafruit, or Keyes DHT modules) already have a surface-mount 10kΩ pull-up resistor soldered on the PCB. No external resistor is required for 3-pin modules.

---

### Option B: 4-Pin Bare DHT Sensor (DHT22 / AM2302 / DHT11 without breakout board)

| DHT Pin Number | Pin Name | ESP32 DevKit Pin | Notes / Pull-Up |
| :--- | :--- | :--- | :--- |
| **Pin 1 (Left)** | **VCC** | `3V3` | Power supply (+3.3V to +5V) |
| **Pin 2** | **DATA** | `GPIO 4` | Connected to `GPIO 4` **AND** tied to VCC via **10kΩ pull-up resistor** |
| **Pin 3** | **NC / NULL** | *Do Not Connect* | Not connected internally |
| **Pin 4 (Right)** | **GND** | `GND` | Ground reference |

---

## 2. Resistor Requirements

- **Pull-Up Resistor Value:** `4.7kΩ` to `10kΩ` (10kΩ is standard).
- **Placement:** Connected between **VCC** (Pin 1) and **DATA** (Pin 2).
- **Purpose:** The 1-wire DHT protocol relies on an open-drain/open-collector communication bus. The pull-up resistor ensures the data line defaults to logic HIGH (`3.3V`) when neither the ESP32 nor the sensor is pulling it LOW.

---

## 3. Power Requirements

| Parameter | DHT11 | DHT22 (AM2302) | ESP32 NodeMCU / DevKit |
| :--- | :--- | :--- | :--- |
| **Operating Voltage** | 3.0V – 5.5V DC | 3.3V – 6.0V DC | 3.3V (Internal) / 5V (USB/VIN) |
| **Logic Level** | Matches VCC | Matches VCC | 3.3V LVTTL (Not 5V tolerant on GPIOs) |
| **Recommended VCC** | **3.3V** | **3.3V** | Powered via USB 5V or Li-ion battery |
| **Current Draw (Active)** | 0.5mA – 2.5mA | 1.0mA – 1.5mA | 80mA – 240mA (with WiFi TX) |
| **Current Draw (Standby)**| 100µA – 150µA | 40µA – 50µA | ~10µA (Deep Sleep) |
| **Sampling Rate Limit** | 1 Hz (Every 1s) | 0.5 Hz (Every 2s) | Configured to 30s interval (`INTERVAL_MS`) |

> [!IMPORTANT]
> Always power the DHT sensor from the ESP32's `3V3` pin when directly connecting DATA to ESP32 GPIOs. If powered from 5V/VIN, the data line voltage will exceed 3.3V and can damage the ESP32 GPIO pin unless a level shifter or voltage divider is used.

---

## 4. ASCII Circuit Diagram

### Bare 4-Pin DHT22 / DHT11 Sensor Circuit

```text
               +----------------------------------+
               |          ESP32 DEVKIT            |
               |                                  |
               |  [3V3]   [GND]         [GPIO 4]  |
               +----+-------+--------------+------+
                    |       |              |
                    |       |              |
          +3.3V     |       |              |
          ----------+       |              |
          |                 |              |
          |     10kΩ        |              |
          |   Resistor      |              |
          |  +--[===]--+    |              |
          |  |         |    |              |
          |  |         |    |              |
        +----+---------+----+----------------+
        | Pin 1      Pin 2  Pin 3      Pin 4 |
        | [VCC]     [DATA]  [NC]       [GND] |
        |                                    |
        |       +--------------------+       |
        |       |                    |       |
        |       |    DHT22 / DHT11   |       |
        |       |   Sensor Front     |       |
        |       |   (Grid Faced)     |       |
        |       |                    |       |
        |       +--------------------+       |
        +------------------------------------+
```

### 3-Pin Sensor Module (Built-In Resistor)

```text
               +----------------------------------+
               |          ESP32 DEVKIT            |
               |                                  |
               |  [3V3]         [GND]   [GPIO 4]  |
               +----+-------------+--------+------+
                    |             |        |
                    |             |        |
                    |             |        |
               +----+-------------+--------+------+
               |   VCC           GND      DATA    |
               |   (+)           (-)      (S/OUT) |
               |                                  |
               |        DHT MODULE PCB            |
               |     [With SMD 10k Resistor]      |
               +----------------------------------+
```

---

## 5. Breadboard Assembly Step-by-Step

1. **Insert ESP32:** Place the ESP32 across the center divider of a standard breadboard so pins on both sides remain accessible.
2. **Connect Ground:** Run a jumper wire from an ESP32 `GND` pin to the breadboard negative power rail (`-`).
3. **Connect 3.3V Power:** Run a jumper wire from the ESP32 `3V3` pin to the breadboard positive power rail (`+`).
4. **Place DHT Sensor:**
   - Connect DHT Pin 1 (`VCC`) to the positive `3V3` rail.
   - Connect DHT Pin 4 (`GND` or `-`) to the negative `GND` rail.
   - Connect DHT Pin 2 (`DATA` or `OUT`) to ESP32 pin `GPIO 4`.
5. **Add Pull-Up Resistor (Only if 4-pin bare sensor):** Place a `10kΩ` resistor between DHT Pin 1 (`VCC`) and DHT Pin 2 (`DATA`).
6. **Verify USB Cable:** Plug the ESP32 into your computer via a data-capable Micro-USB / USB-C cable.
