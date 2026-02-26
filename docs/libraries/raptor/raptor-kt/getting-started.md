# Getting Started

This guide will help you integrate Raptor-KT into your Android application.

## Prerequisites

- Android Studio (recent version)
- Android project with Gradle
- Minimum API level: 21 (Android 5.0 Lollipop)

## Installation

### Step 1: Add the dependency

In your `build.gradle.kts` file (module level), add:

```kotlin
dependencies {
    implementation("eu.dotshell:raptor-kt:1.1.0")
}
```

### Step 2: Sync the project

Click "Sync Now" in Android Studio or run:

```bash
./gradlew sync
```

### Step 3: Add data files

Raptor-KT uses optimized binary files (`stops.bin` and `routes.bin`). Place these files in your project's `assets` folder:

```
app/src/main/assets/
  ├── stops.bin
  └── routes.bin
```

> **Note**: You can obtain these files using [raptor-gtfs-pipeline](../raptor-gtfs-pipeline/index.md) to convert your GTFS data.

## Initial Configuration

### Basic Initialization

```kotlin
import io.raptor.RaptorLibrary

class TransitActivity : AppCompatActivity() {
    private lateinit var raptor: RaptorLibrary
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_transit)
        
        // Initialize Raptor with default files
        raptor = RaptorLibrary(
            stopsInputStream = assets.open("stops.bin"),
            routesInputStream = assets.open("routes.bin")
        )
    }
}
```

### Lifecycle Management

For better resource management, initialize Raptor in `onCreate` and release resources in `onDestroy`:

```kotlin
override fun onDestroy() {
    super.onDestroy()
    // The library automatically handles resource release
}
```

## Installation Verification

To verify everything is working correctly, you can test a simple search:

```kotlin
// Test stop search
val stops = raptor.searchStopsByName("Perrache")
if (stops.isNotEmpty()) {
    Log.d("RaptorTest", "Found ${stops.size} stops matching 'Perrache'")
    for (stop in stops) {
        Log.d("RaptorTest", "Stop: ${stop.name} (ID: ${stop.id})")
    }
} else {
    Log.e("RaptorTest", "No stops found - check your data files")
}
```
