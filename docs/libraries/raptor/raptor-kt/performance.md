# Performance

Raptor-KT is optimized to deliver high performance on Android devices. This section covers benchmarks, optimizations, and best practices.

## Official Benchmarks

The following benchmarks were conducted on a Pixel 6 with Android 12, after JVM warmup.

### TCL Lyon — 14,386 stops, 331 routes, 19,523 trips (~14 MB)

| Route | Standard Search | Arrive-By Search |
|:-----------|------------------:|-------------------:|
| Perrache → Vaulx-en-Velin La Soie | 0.36 ms | 1.48 ms |
| Bellecour → Part-Dieu | 0.20 ms | 0.90 ms |
| Gare de Vaise → Oullins Centre | 0.28 ms | 1.60 ms |
| Perrache → Cuire | 0.33 ms | 2.34 ms |
| Laurent Bonnevay → Gorge de Loup | 0.28 ms | 2.10 ms |
| Part-Dieu → Bellecour | 0.18 ms | 0.97 ms |

*100 iterations (standard), 10 iterations (arrive-by)*

### RTM Marseille — 2,754 stops, 243 routes, 43,590 trips (~10 MB)

| Route | Standard Search | Arrive-By Search |
|:-----------|------------------:|-------------------:|
| Vieux-Port → La Rose | 0.13 ms | 0.54 ms |
| Castellane → Bougainville | 0.18 ms | 0.58 ms |
| Gare St Charles → Rond-Point du Prado | 0.37 ms | 2.39 ms |
| La Timone → Joliette | 0.21 ms | 1.03 ms |
| La Rose → Castellane | 0.11 ms | 0.64 ms |
| Noailles → Sainte-Marguerite Dromel | 0.03 ms | 0.18 ms |
| Bougainville → La Fourragère | 0.30 ms | 1.64 ms |

*100 iterations (standard), 10 iterations (arrive-by)*

### IDFM Paris — 53,944 stops, 3,744 routes, 377,225 trips (~142 MB)

| Route | Standard Search | Arrive-By Search |
|:-----------|------------------:|-------------------:|
| Gare de Lyon → Gare du Nord | 2.38 ms | 19.89 ms |
| Gare Saint-Lazare → Montparnasse Bienvenue | 3.01 ms | 20.35 ms |
| Charles de Gaulle - Étoile → Nation | 1.17 ms | 8.33 ms |
| République → Bastille | 0.86 ms | 4.22 ms |
| Gare du Nord → Gare Montparnasse | 6.35 ms | 42.98 ms |
| Bastille → Gare Saint-Lazare | 2.95 ms | 29.73 ms |
| Glacière → Bonne Nouvelle | 7.19 ms | 51.55 ms |

*50 iterations (standard), 5 iterations (arrive-by)*

## Performance Optimization

### Optimal Initialization

```kotlin
// For better performance, initialize Raptor only once
class TransitApplication : Application() {
    companion object {
        lateinit var raptor: RaptorLibrary
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Single initialization at application startup
        raptor = RaptorLibrary(
            stopsInputStream = assets.open("stops.bin"),
            routesInputStream = assets.open("routes.bin")
        )
    }
}

// Usage in Activities
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val raptor = TransitApplication.raptor
        // Use raptor...
    }
}
```

### Cache Management

```kotlin
// Implement a simple cache for frequent searches
class RaptorCache(private val raptor: RaptorLibrary) {
    private val journeyCache = mutableMapOf<String, List<Journey>>()
    
    fun getCachedJourneys(
        origin: String,
        destination: String,
        departureTime: Int,
        cacheKey: String
    ): List<Journey> {
        return journeyCache[cacheKey] ?: run {
            val originStops = raptor.searchStopsByName(origin)
            val destinationStops = raptor.searchStopsByName(destination)
            val journeys = raptor.getOptimizedPaths(
                originStopIds = originStops.map { it.id },
                destinationStopIds = destinationStops.map { it.id },
                departureTime = departureTime
            )
            journeyCache[cacheKey] = journeys
            journeys
        }
    }
    
    fun clearCache() {
        journeyCache.clear()
    }
}
```

### Search Optimization

```kotlin
// Optimize searches with appropriate parameters
fun optimizedSearch(origin: String, destination: String, departureTime: Int): List<Journey> {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    // Limit number of results if needed
    val maxResults = if (originStops.size > 5 || destinationStops.size > 5) {
        3 // Fewer results for complex searches
    } else {
        10 // More results for simple searches
    }
    
    return raptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        maxResults = maxResults
    )
}
```

## Performance Best Practices

### 1. Instance Reuse

```kotlin
// ❌ Avoid - creating a new instance for each search
fun badPractice() {
    val raptor = RaptorLibrary(assets.open("stops.bin"), assets.open("routes.bin"))
    val journeys = raptor.getOptimizedPaths(...)
}

// ✅ Best practice - reuse the instance
class TransitViewModel : ViewModel() {
    private val raptor = RaptorLibrary(assets.open("stops.bin"), assets.open("routes.bin"))
    
    fun searchJourneys(...): List<Journey> {
        return raptor.getOptimizedPaths(...)
    }
}
```

### 2. Thread Management

```kotlin
// Execute searches in background
fun searchInBackground(origin: String, destination: String, callback: (List<Journey>) -> Unit) {
    CoroutineScope(Dispatchers.IO).launch {
        val originStops = raptor.searchStopsByName(origin)
        val destinationStops = raptor.searchStopsByName(destination)
        
        val journeys = raptor.getOptimizedPaths(
            originStopIds = originStops.map { it.id },
            destinationStopIds = destinationStops.map { it.id },
            departureTime = 8 * 3600
        )
        
        withContext(Dispatchers.Main) {
            callback(journeys)
        }
    }
}
```

### 3. Memory Optimization

```kotlin
// For large applications, manage memory
fun optimizeMemoryUsage() {
    // If you have multiple periods but only use one at a time
    // consider loading only the necessary period
    
    // For very large networks, consider splitting data
    // by geographic zones
}
```

### 4. Data Pre-loading

```kotlin
// Pre-load frequently used data
class TransitService : Service() {
    private lateinit var raptor: RaptorLibrary
    private val preloadedData = mutableMapOf<String, Any>()
    
    override fun onCreate() {
        super.onCreate()
        raptor = RaptorLibrary(assets.open("stops.bin"), assets.open("routes.bin"))
        
        // Pre-load popular stops
        CoroutineScope(Dispatchers.IO).launch {
            val popularStops = listOf("Perrache", "Bellecour", "Part-Dieu")
            for (stopName in popularStops) {
                val stops = raptor.searchStopsByName(stopName)
                preloadedData[stopName] = stops
            }
        }
    }
}
```

## Performance Measurement

### Profiling Tools

```kotlin
// Measure the performance of your implementation
fun measurePerformance(origin: String, destination: String, iterations: Int = 100) {
    val originStops = raptor.searchStopsByName(origin)
    val destinationStops = raptor.searchStopsByName(destination)
    
    var totalTime = 0L
    var successfulSearches = 0
    
    for (i in 0 until iterations) {
        val startTime = System.nanoTime()
        
        try {
            val journeys = raptor.getOptimizedPaths(
                originStopIds = originStops.map { it.id },
                destinationStopIds = destinationStops.map { it.id },
                departureTime = 8 * 3600
            )
            
            if (journeys.isNotEmpty()) {
                successfulSearches++
            }
            
            val endTime = System.nanoTime()
            totalTime += (endTime - startTime)
        } catch (e: Exception) {
            println("Error at iteration $i: ${e.message}")
        }
    }
    
    val avgTimeMs = totalTime / 1_000_000.0 / iterations
    val successRate = successfulSearches.toDouble() / iterations * 100
    
    println("Average performance: %.3f ms per search".format(avgTimeMs))
    println("Success rate: %.1f%%".format(successRate))
}
```

### Result Analysis

```kotlin
// Analyze performance of different search types
fun compareSearchTypes() {
    val testCases = listOf(
        "Perrache" to "Cuire",
        "Bellecour" to "Part-Dieu",
        "Gare de Vaise" to "Oullins Centre"
    )
    
    for ((origin, destination) in testCases) {
        println("\nTest: $origin → $destination")
        
        // Test standard search
        measurePerformance(origin, destination, 100)
        
        // Test arrive-by search
        measureArriveByPerformance(origin, destination, 10)
    }
}
```

## Optimization for Different Devices

### Performance Adaptation

```kotlin
// Adapt parameters based on device performance
fun getDevicePerformanceTier(): PerformanceTier {
    val memoryClass = (getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager)
        .memoryClass
    
    return when {
        memoryClass >= 300 -> PerformanceTier.HIGH
        memoryClass >= 150 -> PerformanceTier.MEDIUM
        else -> PerformanceTier.LOW
    }
}

enum class PerformanceTier {
    HIGH, MEDIUM, LOW
}

fun getOptimizedSearchParams(tier: PerformanceTier): SearchParams {
    return when (tier) {
        PerformanceTier.HIGH -> SearchParams(maxResults = 10, timeoutMs = 500)
        PerformanceTier.MEDIUM -> SearchParams(maxResults = 5, timeoutMs = 300)
        PerformanceTier.LOW -> SearchParams(maxResults = 3, timeoutMs = 200)
    }
}

data class SearchParams(
    val maxResults: Int,
    val timeoutMs: Long
)
```

### Large Network Management

```kotlin
// For very large networks like Paris
fun handleLargeNetworks() {
    // Consider the following approaches:
    
    // 1. Geographic division
    // 2. Progressive loading
    // 3. Aggressive caching
    // 4. Result limitation
    
    val largeNetworkRaptor = RaptorLibrary(
        stopsInputStream = assets.open("stops_paris.bin"),
        routesInputStream = assets.open("routes_paris.bin")
    )
    
    // Use conservative parameters
    val journeys = largeNetworkRaptor.getOptimizedPaths(
        originStopIds = originStops.map { it.id },
        destinationStopIds = destinationStops.map { it.id },
        departureTime = departureTime,
        maxResults = 3 // Limit for large networks
    )
}
```

## Custom Benchmarking

### Creating Performance Tests

```kotlin
// Create custom benchmarks
fun createCustomBenchmark() {
    val benchmarkResults = mutableListOf<BenchmarkResult>()
    
    // Define test cases
    val testCases = listOf(
        TestCase("Perrache", "Cuire", 8 * 3600),
        TestCase("Bellecour", "Part-Dieu", 17 * 3600),
        TestCase("Gare de Vaise", "Oullins Centre", 12 * 3600)
    )
    
    // Run benchmarks
    for (testCase in testCases) {
        val result = runBenchmark(testCase)
        benchmarkResults.add(result)
    }
    
    // Save or display results
    saveBenchmarkResults(benchmarkResults)
}

data class TestCase(
    val origin: String,
    val destination: String,
    val departureTime: Int
)

data class BenchmarkResult(
    val testCase: TestCase,
    val averageTimeMs: Double,
    val successRate: Double,
    val memoryUsageMb: Double
)
```

### Comparative Analysis

```kotlin
// Compare different versions or configurations
fun compareConfigurations() {
    // Configuration 1: Standard
    val config1 = RaptorLibrary(
        stopsInputStream = assets.open("stops.bin"),
        routesInputStream = assets.open("routes.bin")
    )
    
    // Configuration 2: With filtering
    val config2 = RaptorLibrary(
        stopsInputStream = assets.open("stops.bin"),
        routesInputStream = assets.open("routes.bin")
    )
    
    // Run the same tests on both configurations
    val testResults1 = runTests(config1)
    val testResults2 = runTests(config2)
    
    // Compare results
    compareResults(testResults1, testResults2)
}
```