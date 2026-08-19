---
project: NeuroTwin
tags: [neurotwin, neurotwin/mobile]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Mobile Client (Android)

## Language & Framework Rationale: Native Kotlin + Jetpack Compose

The NeuroTwin mobile client is built strictly using **native Kotlin** and **Jetpack Compose** (located under `mobile/`). Cross-platform frameworks (such as Flutter, React Native, or KMP UI wrappers) were deliberately excluded.

> [!decision] Native Kotlin vs. Cross-Platform
> CameraX image lifecycle management, persistent background execution via Foreground Services, and precise Bluetooth/`AudioManager` audio routing represent the exact primitives where cross-platform frameworks fight the underlying operating system. Native Kotlin provides direct, uninhibited access to Android platform APIs.

---

## Directory Architecture (`mobile/`)

```
mobile/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/
│   └── libs.versions.toml
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/neurotwin/app/
            ├── MainActivity.kt               # Jetpack Compose UI
            ├── ml/
            │   └── MlKitFilter.kt            # Local ML Kit Face Detection Gating
            ├── network/
            │   └── NeuroTwinApiService.kt    # Retrofit client for FastAPI backend
            └── service/
                └── CameraForegroundService.kt # Foreground service keeping camera active
```

---

## Core Responsibilities & Modules

1. **Continuous CameraX Capture & Framing:**
   - Initializes and manages the camera lifecycle across device rotations and backgrounding.
   - Throttles frame extraction to 1.5 frames per second (fps) rather than processing full 30fps video streams, conserving device battery and computational overhead.

2. **On-Device Pre-Filtering Gate (`MlKitFilter.kt`):**
   - Runs Google ML Kit Face Detection (`FaceDetection.getClient()`) directly on the image buffer.
   - **Gating Rule:** Only frames containing at least one detected face or designated target object are encoded and uploaded to the server. All other frames are immediately discarded from memory.

3. **Background Service (`CameraForegroundService.kt`):**
   - Wraps camera capture and network transmission within a persistent Android Foreground Service with an ongoing notification channel (`neurotwin_camera_channel`).

4. **Network Service (`RetrofitClient`):**
   - Connects to the FastAPI backend (`http://10.0.2.2:8000/` for emulator loopback or host LAN IP).
   - Supports optional API key authentication via `X-API-Key` header interceptor.
   - Two voice endpoints: `sendVoiceQuery()` (JSON body) and `sendVoiceAudio()` (multipart audio upload for server-side Whisper STT).

---

## Required Android Permissions

The `AndroidManifest.xml` declares and dynamically requests:

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

## Related Documentation
- [[02 - Architecture Overview]] — Data flow and component interaction.
- [[04 - Backend (FastAPI on M4)]] — FastAPI server interacting with Retrofit.
- [[13 - Dev Environment and Tooling]] — Android Studio, Android-MCP, and ADB testing configuration.
