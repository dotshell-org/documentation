# Performance

Raptor-KT is optimized to deliver high performance on Android devices. This section covers benchmarks, optimizations, and best practices.

## JMH Benchmarks

Rigorous benchmarks using [JMH](https://github.com/openjdk/jmh) (Java Microbenchmark Harness) with 1000 random seeded query pairs per dataset (stop coordinates from GTFS).

**System:** Windows 11, Java HotSpot 21.0.9, 16 CPU cores

**JMH config:** 3 forks, 10 warmup × 1 s, 20 measurement × 1 s, mode `avgt`

### Forward Routing

| Dataset | Avg (μs/op) | ms/op | Error | GC alloc (B/op) |
|:--------|------------:|------:|------:|----------------:|
| RTM Marseille | 261 | 0.26 | ± 1.00 | 4,216 |
| Finland | 4,624 | 4.6 | ± 75.7 | 3,222 |
| IDFM Paris | 5,157 | 5.2 | ± 186.8 | 1,586 |

### Arrive-By Routing

| Dataset | Avg (μs/op) | ms/op | Error | GC alloc (B/op) |
|:--------|------------:|------:|------:|----------------:|
| RTM Marseille | 1,636 | 1.6 | ± 9.08 | 3,120 |
| Finland | 31,599 | 31.6 | ± 4,241 | 640 |
| IDFM Paris | 31,986 | 32.0 | ± 2,542 | 1,298 |

### Arrive-By / Forward Ratio

| Dataset | Forward (μs) | Arrive-By (μs) | Ratio |
|:--------|-------------:|---------------:|------:|
| RTM Marseille | 261 | 1,636 | 6.3× |
| Finland | 4,624 | 31,599 | 6.8× |
| IDFM Paris | 5,157 | 31,986 | 6.2× |

The consistent **~6.4× overhead** for arrive-by matches the expected ~7 forward calls per arrive-by query (120 min window / 60 s binary search steps).

### Network Loading Time

Cold load: binary deserialization + Network construction. SingleShotTime, 5 forks.

| Dataset | Avg (ms) | Error |
|:--------|--------:|------:|
| RTM Marseille | 6.7 | ± 0.42 |
| IDFM Paris | 71.4 | ± 3.0 |
| Finland | 83.3 | ± 3.9 |

All datasets load in **< 100 ms** — fast enough for seamless app cold start.

### Memory / GC Allocation

Per-query allocation measured via JMH GC profiler (SingleShotTime, 5 forks, 500 iterations).

| Dataset | Avg time (μs) | GC alloc (B/op) | GC alloc rate |
|:--------|-------------:|----------------:|--------------:|
| RTM Marseille | 545 | 5,136 | 8.4 MB/s |
| IDFM Paris | 6,608 | 16,133 | 1.7 MB/s |

Peak allocation of 16 KB/op — well within acceptable range for Android (16 ms frame budget).

## Comparison with OpenTripPlanner v2

To put these numbers in perspective, here is a comparison with [OpenTripPlanner v2](https://www.opentripplanner.org/) on the same RTM Marseille dataset.

:::note
OTP is benchmarked end-to-end via HTTP/GraphQL, which includes street graph access/egress, transfer optimization, itinerary filtering, and HTTP + JSON serialization — not just the RAPTOR algorithm. A direct algorithm-to-algorithm comparison would require instrumenting OTP's internal RAPTOR timing.
:::

**OTP system:** Same machine, Java 21, graph size 267 MB

**OTP JMH config:** 3 forks, 5 warmup × 2 s, 20 measurement × 2 s, mode `avgt`

### RTM Marseille — Routing Performance

| Engine | Forward (ms) | Arrive-By (ms) |
|:-------|------------:|---------------:|
| **raptor-kt** (pure algorithm) | 0.26 | 1.6 |
| **OTP v2** (end-to-end HTTP) | 245.3 | 196.0 |

raptor-kt's pure RAPTOR algorithm is **~943× faster** than OTP's full end-to-end pipeline on forward routing. This is expected — OTP includes many additional layers beyond the core routing algorithm.

### RTM Marseille — Startup / Loading Time

| Engine | Loading time | Data size |
|:-------|------------:|---------:|
| **raptor-kt** (binary deserialization) | 6.7 ms | ~10 MB |
| **OTP v2** (graph load + server start) | 15,964 ms (~16 s) | 267 MB |

raptor-kt loads its network **~2,400× faster** than OTP starts its server — making it suitable for on-demand mobile cold starts where OTP requires a persistent server process.

### Key Takeaways

- **raptor-kt** measures pure RAPTOR algorithm time via direct API calls (0.3–5 ms depending on network size).
- **OTP v2** measures real-world end-to-end query time including HTTP overhead, street routing, and response serialization (~196–245 ms).
- raptor-kt loads in **milliseconds**, enabling instant cold starts on mobile. OTP requires a **~16 s server startup**, designed for persistent server deployment.
- The comparison highlights the overhead of a full-stack routing server vs. an embedded algorithm library.

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