# Route Filtering

Raptor-KT offers advanced route filtering features to meet specific needs.

## Filtering Concept

Filtering allows controlling which transit lines are used in route calculations:

- **Whitelist**: Allow only certain lines
- **Blacklist**: Exclude certain lines
- **Combination**: Use both approaches together

## Filtering by Route Names (Whitelist)

### Basic Usage

```kotlin
// Allow only certain lines by their name
val allowedRouteNames = setOf("JD2", "JD3", "RX")

val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    allowedRouteNames = allowedRouteNames
)

// Only routes using lines JD2, JD3 or RX will be returned
```

### Use Case: Specific Network

```kotlin
// Limit to lines of a specific network
fun getJourneysForNetwork(networkName: String, origin: String, destination: String): List<Journey> {
    // Define allowed lines for this network
    val networkRoutes = when (networkName) {
        "metro" -> setOf("A", "B", "C", "D")
        "tram" -> setOf("T1", "T2", "T3", "T4", "T5", "T6")
        "bus" -> setOf("C1", "C2", "C3", "C4", "C5")
        else -> emptySet()
    }
    
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        allowedRouteNames = networkRoutes
    )
}
```

## Filtering by Route IDs (Blacklist)

### Basic Usage

```kotlin
// Exclude certain lines by their ID
val blockedRouteIds = setOf(12, 27, 45)

val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    blockedRouteIds = blockedRouteIds
)

// Routes using lines 12, 27 or 45 will be excluded
```

### Use Case: Avoid Disruptions

```kotlin
// Exclude disrupted lines
fun getJourneysAvoidingDisruptions(
    origin: String,
    destination: String,
    disruptedRouteIds: Set<Int>
): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        blockedRouteIds = disruptedRouteIds
    )
}
```

## Combining Filters

### Whitelist + Blacklist

```kotlin
// Use both whitelist and blacklist
val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    allowedRouteNames = setOf("JD2", "JD3", "JD4"), // Whitelist
    blockedRouteIds = setOf(12) // Additional blacklist
)

// Only lines JD2, JD3, JD4 are allowed, but line 12 is blocked even if it's in the whitelist
```

### Complex Use Case

```kotlin
// Advanced filtering for a business trip
fun getBusinessJourney(
    origin: String,
    destination: String,
    preferredLines: Set<String>,
    avoidCrowdedLines: Set<Int>
): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        allowedRouteNames = preferredLines, // Preferred lines
        blockedRouteIds = avoidCrowdedLines // Lines to avoid
    )
}
```

## Filtering with Arrive-By Search

```kotlin
// Filtering also works with arrive-by search
val arrivalTime = 9 * 3600
val searchWindowMinutes = 120

val journeys = raptor.getOptimizedPathsArriveBy(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    arrivalTime = arrivalTime,
    searchWindowMinutes = searchWindowMinutes,
    allowedRouteNames = setOf("JD2", "JD3"),
    blockedRouteIds = setOf(12)
)
```

## Dynamic Filter Management

### Saving User Preferences

```kotlin
// Save filtering preferences
fun saveRoutePreferences(preferredRoutes: Set<String>, blockedRoutes: Set<Int>) {
    val prefs = getSharedPreferences("TransitAppPrefs", Context.MODE_PRIVATE)
    prefs.edit()
        .putStringSet("preferred_routes", preferredRoutes)
        .putStringSet("blocked_routes", blockedRoutes.map { it.toString() }.toSet())
        .apply()
}

// Load filtering preferences
fun loadRoutePreferences(): Pair<Set<String>, Set<Int>> {
    val prefs = getSharedPreferences("TransitAppPrefs", Context.MODE_PRIVATE)
    val preferredRoutes = prefs.getStringSet("preferred_routes", emptySet()) ?: emptySet()
    val blockedRoutes = prefs.getStringSet("blocked_routes", emptySet()) ?: emptySet()
    return Pair(
        preferredRoutes,
        blockedRoutes.mapNotNull { it.toIntOrNull() }.toSet()
    )
}
```

### User Interface for Selection

```kotlin
// Create an interface to select preferred lines
fun showRouteFilterDialog(currentPreferences: Pair<Set<String>, Set<Int>>) {
    val (preferred, blocked) = currentPreferences
    val allRoutes = getAllAvailableRoutes() // To be implemented
    
    val selectedPreferred = BooleanArray(allRoutes.size) { index -> 
        allRoutes[index] in preferred
    }
    
    val selectedBlocked = BooleanArray(allRoutes.size) { index -> 
        allRoutes[index].id in blocked
    }
    
    // Display a dialog with checkboxes for each line
    // ... (UI implementation)
}
```

## Performance and Optimization

### Performance Impact

```kotlin
// Filtering can improve performance by reducing the search space
val startTime = System.currentTimeMillis()

// Without filtering
val allJourneys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime
)

// With filtering
val filteredJourneys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime,
    allowedRouteNames = setOf("JD2", "JD3")
)

val endTime = System.currentTimeMillis()
println("Time without filtering: ${endTime - startTime}ms")
```

### Best Practices

1. **Avoid overly restrictive filters**: This can prevent finding routes
2. **Use broad filters**: Prefer line categories over specific lines
3. **Cache filtered results**: Filtered searches can be expensive
4. **Validate filters**: Ensure filters don't make searches impossible

## Advanced Use Cases

### Location-Based Filtering

```kotlin
// Filtering based on proximity
fun getLocalJourneys(origin: String, destination: String, userLocation: LatLng): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    // Find local lines (within 5km radius)
    val localRoutes = getRoutesNearLocation(userLocation, 5000.0) // To be implemented
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        allowedRouteNames = localRoutes
    )
}
```

### Time-Based Filtering

```kotlin
// Filtering based on time of day
fun getJourneysForTimeOfDay(origin: String, destination: String, departureTime: Int): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    // Determine appropriate lines for the time
    val appropriateRoutes = when (departureTime / 3600) {
        in 0..6 -> setOf("N1", "N2", "N3") // Night lines
        in 7..9 -> setOf("EXP1", "EXP2", "EXP3") // Morning express lines
        in 16..19 -> setOf("EXP1", "EXP2", "EXP3") // Evening express lines
        else -> emptySet() // All lines
    }
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        allowedRouteNames = appropriateRoutes
    )
}
```