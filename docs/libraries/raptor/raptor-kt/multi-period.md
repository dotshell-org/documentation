# Multi-Period Management

Raptor-KT supports managing multiple datasets for different periods (e.g., winter vs summer schedules).

## Period Concept

Periods allow managing different schedule datasets:

- **Seasonal periods**: Winter/summer, weekday/weekend
- **Special periods**: School holidays, special events
- **Temporary periods**: Disruptions, construction work

## Initialization with Multiple Periods

```kotlin
import io.raptor.PeriodData

// Load multiple periods
val raptor = RaptorLibrary(listOf(
    PeriodData(
        periodId = "winter",
        stopsInputStream = assets.open("stops_winter.bin"),
        routesInputStream = assets.open("routes_winter.bin")
    ),
    PeriodData(
        periodId = "summer",
        stopsInputStream = assets.open("stops_summer.bin"),
        routesInputStream = assets.open("routes_summer.bin")
    ),
    PeriodData(
        periodId = "holidays",
        stopsInputStream = assets.open("stops_holidays.bin"),
        routesInputStream = assets.open("routes_holidays.bin")
    )
))
```

## Period Management

### Get Available Periods

```kotlin
// List all available periods
val availablePeriods = raptor.getAvailablePeriods()
println("Available periods: ${availablePeriods.joinToString(", ")}")
// Prints: "Available periods: winter, summer, holidays"
```

### Change Active Period

```kotlin
// Change to summer period
raptor.setPeriod("summer")

// All subsequent searches will use summer data
val journeys = raptor.getOptimizedPaths(
    originStopIds = originStops.map { it.id },
    destinationStopIds = destinationStops.map { it.id },
    departureTime = departureTime
)
```

### Get Current Period

```kotlin
val currentPeriod = raptor.getCurrentPeriod()
println("Current period: $currentPeriod")
// Prints: "Current period: summer"
```

## Period Management Strategies

### Automatic Selection

```kotlin
fun selectPeriodBasedOnDate(): String {
    val currentDate = LocalDate.now()
    val month = currentDate.monthValue
    
    return when (month) {
        6, 7, 8 -> "summer"
        12, 1, 2 -> "holidays"
        else -> "winter"
    }
}

// Apply period automatically
val autoPeriod = selectPeriodBasedOnDate()
raptor.setPeriod(autoPeriod)
```

### Manual User Selection

```kotlin
// In an Activity or Fragment
val periods = raptor.getAvailablePeriods()

// Create a dialog for user to choose
AlertDialog.Builder(this)
    .setTitle("Select Period")
    .setItems(periods.toTypedArray()) { dialog, which ->
        val selectedPeriod = periods[which]
        raptor.setPeriod(selectedPeriod)
        preferences.edit().putString("selected_period", selectedPeriod).apply()
        Toast.makeText(this, "Period changed to $selectedPeriod", Toast.LENGTH_SHORT).show()
    }
    .setNegativeButton("Cancel", null)
    .show()
```

## Best Practices

### Period Persistence

```kotlin
// Save selected period
fun saveSelectedPeriod(period: String) {
    val prefs = getSharedPreferences("TransitAppPrefs", Context.MODE_PRIVATE)
    prefs.edit().putString("selected_period", period).apply()
}

// Load saved period
fun loadSelectedPeriod(): String? {
    val prefs = getSharedPreferences("TransitAppPrefs", Context.MODE_PRIVATE)
    return prefs.getString("selected_period", null)
}

// On app startup
val savedPeriod = loadSelectedPeriod()
savedPeriod?.let { raptor.setPeriod(it) }
```

### Error Handling

```kotlin
try {
    // Try to set a period
    raptor.setPeriod("nonexistent")
} catch (e: IllegalArgumentException) {
    println("Error: Invalid period - ${e.message}")
    // Fall back to default period
    raptor.setPeriod("winter")
}
```

### Performance Optimization

```kotlin
// If you always use the same period, initialize with a single period
val raptorSingle = RaptorLibrary(
    stopsInputStream = assets.open("stops_winter.bin"),
    routesInputStream = assets.open("routes_winter.bin")
)

// This avoids the overhead of managing multiple periods
```

## Advanced Use Cases

### Switch Between Periods for Comparison

```kotlin
fun comparePeriods(originName: String, destinationName: String, departureTime: Int) {
    val originStops = raptor.searchStopsByName(originName)
    val destinationStops = raptor.searchStopsByName(destinationName)
    
    val periods = raptor.getAvailablePeriods()
    
    for (period in periods) {
        raptor.setPeriod(period)
        val journeys = raptor.getOptimizedPaths(
            originStopIds = originStops.map { it.id },
            destinationStopIds = destinationStops.map { it.id },
            departureTime = departureTime
        )
        
        println("\nPeriod: $period")
        if (journeys.isNotEmpty()) {
            val bestJourney = journeys.first()
            println("Best route: ${bestJourney.totalTime / 60} minutes")
        } else {
            println("No routes found")
        }
    }
}
```

### Dynamic Period Management

```kotlin
// Update periods dynamically (e.g., after download)
fun updatePeriods(newPeriods: List<PeriodData>) {
    // Create new instance with new periods
    val newRaptor = RaptorLibrary(newPeriods)
    
    // Replace old instance
    raptor = newRaptor
    
    // Select default period
    raptor.setPeriod("winter")
}
```