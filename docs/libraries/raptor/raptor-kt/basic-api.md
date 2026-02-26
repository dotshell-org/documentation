# Basic API

This guide covers the main features of the Raptor-KT API.

## Initialization

```kotlin
val raptor = RaptorLibrary(
    stopsInputStream = assets.open("stops.bin"),
    routesInputStream = assets.open("routes.bin")
)
```

## Stop Search

### Search by Name

```kotlin
// Search for stops by name (partial search supported)
val stops = raptor.searchStopsByName("Perrache")

// Iterate through results
for (stop in stops) {
    println("Stop: ${stop.name} (ID: ${stop.id})")
    println("  Latitude: ${stop.lat}, Longitude: ${stop.lon}")
}
```

### Search by ID

```kotlin
// Search for a specific stop by its ID
val stop = raptor.getStopById(12345)
stop?.let {
    println("Found: ${it.name}")
}
```

## Route Calculation

### Departure Time Search (Forward Search)

```kotlin
// Define origin and destination stops
val originStops = raptor.searchStopsByName("Perrache")
val destinationStops = raptor.searchStopsByName("Cuire")

// Departure time (in seconds since midnight)
val departureTime = 8 * 3600 // 08:00:00

// Calculate optimized routes
val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime
)

// Display results
for (journey in journeys) {
    raptor.displayJourney(journey)
}
```

### Arrival Time Search (Arrive-By Search)

```kotlin
// Desired arrival time (in seconds since midnight)
val arrivalTime = 9 * 3600 // 09:00:00

// Search window (in minutes)
val searchWindowMinutes = 120 // Search for departures up to 2 hours before

// Calculate routes to arrive on time
val journeys = raptor.getOptimizedPathsArriveBy(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    arrivalTime = arrivalTime,
    searchWindowMinutes = searchWindowMinutes
)

// Results will be sorted by departure time (from latest to earliest)
for (journey in journeys) {
    raptor.displayJourney(journey)
}
```

## Displaying Routes

### Built-in Method

```kotlin
// Use the built-in method to display a route
raptor.displayJourney(journey)
```

### Custom Display

```kotlin
fun displayCustomJourney(journey: Journey) {
    println("Route: ${journey.totalTime} seconds (${journey.totalTime / 60} minutes)")
    println("Departure: ${formatTime(journey.departureTime)}")
    println("Arrival: ${formatTime(journey.arrivalTime)}")
    
    for ((index, leg) in journey.legs.withIndex()) {
        println("\nStep ${index + 1}:")
        when (leg) {
            is Leg.WalkLeg -> {
                println("  Walk: ${leg.duration} seconds (${leg.duration / 60} minutes)")
                println("  From: ${leg.fromStopName} -> To: ${leg.toStopName}")
            }
            is Leg.TransitLeg -> {
                println("  Transit: Line ${leg.routeName} (${leg.routeId})")
                println("  Departure: ${formatTime(leg.departureTime)} from ${leg.fromStopName}")
                println("  Arrival: ${formatTime(leg.arrivalTime)} at ${leg.toStopName}")
                println("  Duration: ${leg.duration} seconds")
            }
        }
    }
}

private fun formatTime(secondsSinceMidnight: Int): String {
    val hours = secondsSinceMidnight / 3600
    val minutes = (secondsSinceMidnight % 3600) / 60
    return String.format("%02d:%02d", hours, minutes)
}
```

## Error Handling

```kotlin
try {
    val journeys = raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime
    )
    
    if (journeys.isEmpty()) {
        println("No routes found")
    } else {
        // Process results
    }
} catch (e: IllegalArgumentException) {
    println("Parameter error: ${e.message}")
} catch (e: Exception) {
    println("Error during calculation: ${e.message}")
}
```

## Best Practices

1. **Cache results**: For frequent searches, cache the results
2. **Thread management**: Raptor operations are thread-safe
3. **Input validation**: Check that stop IDs are valid
4. **Exception handling**: Handle cases where no routes are found