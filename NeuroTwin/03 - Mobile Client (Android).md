---
project: NeuroTwin
tags: [neurotwin, neurotwin/mobile]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Mobile Client (Android)

## Language & Framework Rationale: Native Kotlin + Jetpack Compose

The NeuroTwin mobile client is built strictly using **native Kotlin** and **Jetpack Compose**. Cross-platform frameworks (such as Flutter, React Native, or KMP UI wrappers) were deliberately excluded.

> [!decision] Native Kotlin vs. Cross-Platform
> CameraX image lifecycle management, persistent background execution via Foreground Services, and precise Bluetooth/`AudioManager` audio routing represent the exact primitives where cross-platform frameworks fight the underlying operating system. Native Kotlin provides direct, uninhibited access to Android platform APIs.

---

## Core Responsibilities

1. **Continuous CameraX Capture & Framing:**
   - Initializes and manages the camera lifecycle across device rotations and backgrounding.
   - Throttles frame extraction to 1–2 frames per second (fps) rather than processing full 30fps video streams, conserving device battery and computational overhead.

2. **On-Device Pre-Filtering Gate (ML Kit):**
   - Runs Google ML Kit Face Detection and Object Detection lightweight models directly on the image buffer.
   - **Gating Rule:** Only frames containing at least one detected face or designated target object are encoded and uploaded to the server. All other frames are immediately discarded from memory.

3. **Bluetooth Audio Routing & Streaming:**
   - Listens for connected Bluetooth SCO/A2DP audio peripherals (earbuds, hearing aids, external wearable speakers).
   - Manages audio focus via native `AudioManager` and streams synthesized TTS audio seamlessly without interrupting native system alerts.

4. **Background Service & WorkManager:**
   - Wraps camera capture and network transmission within a persistent Android Foreground Service with an ongoing notification.
   - Utilizes `WorkManager` for scheduled background tasks such as offline telemetry sync and health ping maintenance.

---

## Required Android Permissions

The `AndroidManifest.xml` must declare and dynamically request the following permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## Networking Approach

- **HTTP/REST & WebSockets Client:** Built using **Retrofit 2** with **OkHttp 4** (or **Ktor Client**).
- **Transport Security & Topology:** Communicates with the FastAPI backend over the local Wi-Fi LAN when at home, or over an encrypted **WireGuard VPN tunnel** when operating outside the home network.
- **Payload Encoding:** Images are compressed into optimized JPEG byte arrays before HTTP multipart transmission. Voice clips are sent as compressed WAV/AAC audio streams.

---

## Battery & Power Optimization

- **Frame Rate Throttling:** Operating at 1–2 fps reduces camera sensor power consumption and GPU usage by >80% compared to 30fps video streaming.
- **On-Device ML Kit Execution:** Pre-filtering avoids expensive cellular/Wi-Fi data transfers for empty rooms.
- **WakeLock Management:** Utilizes partial wake locks judiciously inside the Foreground Service to prevent CPU sleeping while actively monitoring surroundings.

---

## Open Architectural Considerations

> [!question] Caregiver App Integration Mode
> It is currently undecided whether the Caregiver management interface should be built as a separate dedicated Android application, a web dashboard, or a toggleable secondary mode/screen within this primary patient application.
> See [[07 - Caregiver App]] and [[12 - Open Questions]].

---

## Related Documentation
- [[02 - Architecture Overview]] — Data flow and component interaction.
- [[13 - Dev Environment and Tooling]] — Android Studio, Android-MCP, and ADB testing configuration.
