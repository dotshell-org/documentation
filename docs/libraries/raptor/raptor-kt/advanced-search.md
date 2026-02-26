# Advanced Search

Raptor-KT offers advanced search features to meet various use cases.

## Arrival Time Search (Arrive-By)

Arrival time search is useful when the user needs to arrive at the destination before a specific time.

### Concept

- **Standard search**: "I leave at 8am, where can I go?"
- **Arrival search**: "I need to be at the destination before 9am, what's the latest possible departure?"

### Usage

```kotlin
// Desired arrival time (in seconds since midnight)
val arrivalTime = 9 * 3600 // 09:00:00

// Search window (in minutes)
val searchWindowMinutes = 180 // Search for departures up to 3 hours before

// Calculate routes to arrive on time
val journeys = raptor.getOptimizedPathsArriveBy(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    arrivalTime = arrivalTime,
    searchWindowMinutes = searchWindowMinutes
)

// Results are sorted by departure time (from latest to earliest)
if (journeys.isNotEmpty()) {
    val bestJourney = journeys.first()
    println("Best option: departure at ${formatTime(bestJourney.departureTime)}, arrival at ${formatTime(bestJourney.arrivalTime)}")
}
```

### Use Case

```kotlin
// Find the last bus to arrive on time for a meeting
fun findLastBusForMeeting(meetingTime: Int, meetingLocation: String, currentLocation: String) {
    val originStops = raptor.searchStopsByName(currentLocation)
    val destinationStops = raptor.searchStopsByName(meetingLocation)
    
    // Arrive 15 minutes before the meeting
    val arrivalTime = meetingTime - (15 * 60)
    
    val journeys = raptor.getOptimizedPathsArriveBy(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        arrivalTime = arrivalTime,
        searchWindowMinutes = 240 // Search up to 4 hours before
    )
    
    return journeys.firstOrNull()
}
```

## Route Filtering

### Filtering by Route Names (Whitelist)

```kotlin
// Allow only certain lines
val allowedRoutes = setOf("JD2", "JD3", "RX")

val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    allowedRouteNames = allowedRoutes
)

// Only routes using the allowed lines will be returned
```

### Filtering by Route IDs (Blacklist)

```kotlin
// Exclude certain lines
val blockedRouteIds = setOf(12, 27, 45)

val journeys = raptor.getOptimizedPathsArriveBy(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    arrivalTime = arrivalTime,
    blockedRouteIds = blockedRouteIds
)

// Routes using the blocked lines will be excluded
```

### Combining Filters

```kotlin
// Use both whitelist and blacklist
val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    allowedRouteNames = setOf("JD2", "JD3"), // Whitelist
    blockedRouteIds = setOf(12) // Additional blacklist
)
```

## Combined Search

### Convenience Method for Search and Display

```kotlin
// Search and display in one method
raptor.searchAndDisplayRoute(
    originName = "Perrache",
    destinationName = "Cuire",
    departureTime = 8 * 3600,
    allowedRouteNames = setOf("JD2", "JD3"),
    maxResults = 3
)
```

### Search with Multiple Origins/Destinations

```kotlin
// Search from multiple origin stops
val originAreas = listOf("Perrache", "Bellecour", "Part-Dieu")
val destinationAreas = listOf("Cuire", "Caluire")

val allOriginStops = originAreas.flatMap { raptor.searchStopsByName(it) }
val allDestinationStops = destinationAreas.flatMap { raptor.searchStopsByName(it) }

val journeys = raptor.getOptimizedPaths(
    originStopIds = allOriginStops.map { it.id },
    destinationStopIds = allDestinationStops.map { it.id },
    departureTime = departureTime
)
```

## Search Optimization

### Limiting Number of Results

```kotlin
// Limit to 5 results maximum
val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    maxResults = 5
)
```

### Batch Search

```kotlin
// For complex searches, use batches
fun batchSearch(departureTimes: List<Int>): Map<Int, List<Journey>> {
    val results = mutableMapOf<Int, List<Journey>>()
    
    for (time in departureTimes) {
        val journeys = raptor.getOptimizedPaths(
            originStopIds = originStops.map { it.id },
            destinationStopIds = destinationStops.map { it.id },
            departureTime = time
        )
        results[time] = journeys
    }
    
    return results
}
```

## Advanced Use Cases

### Trip Planning with Constraints

```kotlin
fun planTripWithConstraints(
    origin: String,
    destination: String,
    departureTime: Int,
    maxTravelTimeMinutes: Int,
    preferredRoutes: Set<String>
): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    val maxTravelTimeSeconds = maxTravelTimeMinutes * 60
    
    val journeys = raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        allowedRouteNames = preferredRoutes
    )
    
    // Filter by maximum travel time
    return journeys.filter { it.totalTime <= maxTravelTimeSeconds }
}
```

### Finding Optimal Transfers

```kotlin
fun findOptimalTransfer(
    origin: String,
    intermediate: String,
    destination: String,
    departureTime: Int
): Triple<List<Journey>, List<Journey>, Int>? {
    val originStops = raptor.searchStopsByName(origin)
    val intermediateStops = raptor.searchStopsByName(intermediate)
    val destinationStops = raptor.searchStopsByName(destination)
    
    // First part of the trip
    val firstLeg = raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = intermediateStops.map { it.id },
        departureTime = departureTime
    )
    
    if (firstLeg.isEmpty()) return null
    
    // Second part of the trip (arrive-by search based on first part's arrival)
    val arrivalTime = firstLeg.first().arrivalTime
    val secondLeg = raptor.getOptimizedPathsArriveBy(
        originStopIds = intermediateStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        arrivalTime = arrivalTime,
        searchWindowMinutes = 60
    )
    
    if (secondLeg.isEmpty()) return null
    
    return Triple(firstLeg, secondLeg, arrivalTime)
}
```

## Best Practices

1. **Cache results**: For frequent searches, use a cache
2. **Thread management**: Raptor operations are thread-safe
3. **Input validation**: Check that parameters are valid
4. **Exception handling**: Handle cases where no routes are found
5. **Filter optimization**: Use filters to reduce the search space