# Android Integration

This guide covers best practices for integrating Raptor-KT into an Android application.

## Recommended Architecture

### MVVM Structure

```kotlin
// ViewModel - Business logic management
class TransitViewModel(application: Application) : AndroidViewModel(application) {
    private val raptor: RaptorLibrary
    
    init {
        val appContext = application.applicationContext
        raptor = RaptorLibrary(
            stopsInputStream = appContext.assets.open("stops.bin"),
            routesInputStream = appContext.assets.open("routes.bin")
        )
    }
    
    fun searchJourneys(origin: String, destination: String, departureTime: Int): LiveData<List<Journey>> {
        return liveData(Dispatchers.IO) {
            val originStops = raptor.searchStopsByName(origin)
            val destinationStops = raptor.searchStopsByName(destination)
            
            val journeys = raptor.getOptimizedPaths(
                originStopIds = originStops.map { it.id },
                destinationStopIds = destinationStops.map { it.id },
                departureTime = departureTime
            )
            
            emit(journeys)
        }
    }
}

// Activity/Fragment - Display
class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: TransitViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        viewModel = ViewModelProvider(this).get(TransitViewModel::class.java)
        
        // Observe results
        viewModel.searchJourneys("Perrache", "Cuire", 8 * 3600).observe(this) { journeys ->
            // Update UI
            updateJourneyList(journeys)
        }
    }
}
```

### Architecture with Repository

```kotlin
// Repository - Data source abstraction
class TransitRepository(application: Application) {
    private val raptor: RaptorLibrary
    
    init {
        val appContext = application.applicationContext
        raptor = RaptorLibrary(
            stopsInputStream = appContext.assets.open("stops.bin"),
            routesInputStream = appContext.assets.open("routes.bin")
        )
    }
    
    suspend fun searchJourneys(origin: String, destination: String, departureTime: Int): List<Journey> {
        return withContext(Dispatchers.IO) {
            val originStops = raptor.searchStopsByName(origin)
            val destinationStops = raptor.searchStopsByName(destination)
            
            raptor.getOptimizedPaths(
                originStopIds = originStops.map { it.id },
                destinationStopIds = destinationStops.map { it.id },
                departureTime = departureTime
            )
        }
    }
    
    suspend fun searchStops(query: String): List<Stop> {
        return withContext(Dispatchers.IO) {
            raptor.searchStopsByName(query)
        }
    }
}

// ViewModel using the Repository
class TransitViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = TransitRepository(application)
    
    fun searchJourneys(origin: String, destination: String, departureTime: Int): LiveData<Result<List<Journey>>> {
        return liveData {
            emit(Result.loading())
            try {
                val journeys = repository.searchJourneys(origin, destination, departureTime)
                emit(Result.success(journeys))
            } catch (e: Exception) {
                emit(Result.error(e))
            }
        }
    }
}
```

## Lifecycle Management

### Optimal Initialization

```kotlin
// Initialization in an Application class
class TransitApp : Application() {
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
        val raptor = TransitApp.raptor
        // Use raptor...
    }
}
```

### Resource Management

```kotlin
// For applications with multiple periods
class MultiPeriodManager(application: Application) {
    private val appContext = application.applicationContext
    private var currentRaptor: RaptorLibrary
    private val periodCache = mutableMapOf<String, RaptorLibrary>()
    
    init {
        // Load default period
        currentRaptor = createRaptorForPeriod("winter")
    }
    
    private fun createRaptorForPeriod(periodId: String): RaptorLibrary {
        return periodCache[periodId] ?: run {
            val raptor = RaptorLibrary(
                stopsInputStream = appContext.assets.open("stops_$periodId.bin"),
                routesInputStream = appContext.assets.open("routes_$periodId.bin")
            )
            periodCache[periodId] = raptor
            raptor
        }
    }
    
    fun setPeriod(periodId: String) {
        currentRaptor = createRaptorForPeriod(periodId)
    }
    
    fun getCurrentRaptor(): RaptorLibrary = currentRaptor
    
    fun clearCache() {
        periodCache.clear()
    }
}
```

## User Interface

### Stop Search with Autocomplete

```kotlin
// Adapter for stop autocomplete
class StopAutocompleteAdapter(
    context: Context,
    private val raptor: RaptorLibrary
) : ArrayAdapter<Stop>(context, android.R.layout.simple_dropdown_item_1line) {
    
    fun updateResults(query: String) {
        clear()
        if (query.length >= 2) {
            CoroutineScope(Dispatchers.IO).launch {
                val results = raptor.searchStopsByName(query)
                withContext(Dispatchers.Main) {
                    addAll(results)
                    notifyDataSetChanged()
                }
            }
        }
    }
}

// Usage in an Activity
class SearchActivity : AppCompatActivity() {
    private lateinit var stopAdapter: StopAutocompleteAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)
        
        val raptor = TransitApp.raptor
        stopAdapter = StopAutocompleteAdapter(this, raptor)
        
        val originEditText = findViewById<AutoCompleteTextView>(R.id.originEditText)
        originEditText.setAdapter(stopAdapter)
        
        originEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                stopAdapter.updateResults(s.toString())
            }
            // Other required methods...
        })
    }
}
```

### Displaying Routes

```kotlin
// Adapter for the route list
class JourneyAdapter(private val journeys: List<Journey>) : 
    RecyclerView.Adapter<JourneyAdapter.JourneyViewHolder>() {
    
    class JourneyViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val durationText: TextView = view.findViewById(R.id.durationText)
        val departureText: TextView = view.findViewById(R.id.departureText)
        val arrivalText: TextView = view.findViewById(R.id.arrivalText)
        val stepsRecycler: RecyclerView = view.findViewById(R.id.stepsRecycler)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): JourneyViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_journey, parent, false)
        return JourneyViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: JourneyViewHolder, position: Int) {
        val journey = journeys[position]
        
        holder.durationText.text = "${journey.totalTime / 60} min"
        holder.departureText.text = formatTime(journey.departureTime)
        holder.arrivalText.text = formatTime(journey.arrivalTime)
        
        // Configure adapter for steps
        holder.stepsRecycler.adapter = JourneyStepAdapter(journey.legs)
    }
    
    override fun getItemCount(): Int = journeys.size
    
    private fun formatTime(secondsSinceMidnight: Int): String {
        val hours = secondsSinceMidnight / 3600
        val minutes = (secondsSinceMidnight % 3600) / 60
        return String.format("%02d:%02d", hours, minutes)
    }
}

// Adapter for route steps
class JourneyStepAdapter(private val legs: List<Leg>) : 
    RecyclerView.Adapter<JourneyStepAdapter.StepViewHolder>() {
    
    class StepViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val stepIcon: ImageView = view.findViewById(R.id.stepIcon)
        val stepDescription: TextView = view.findViewById(R.id.stepDescription)
        val stepTime: TextView = view.findViewById(R.id.stepTime)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StepViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_journey_step, parent, false)
        return StepViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: StepViewHolder, position: Int) {
        val leg = legs[position]
        
        when (leg) {
            is Leg.WalkLeg -> {
                holder.stepIcon.setImageResource(R.drawable.ic_walk)
                holder.stepDescription.text = "Walk from ${leg.fromStopName} to ${leg.toStopName}"
                holder.stepTime.text = "${leg.duration / 60} min"
            }
            is Leg.TransitLeg -> {
                holder.stepIcon.setImageResource(R.drawable.ic_bus)
                holder.stepDescription.text = "Line ${leg.routeName} from ${leg.fromStopName} to ${leg.toStopName}"
                holder.stepTime.text = "${formatTime(leg.departureTime)} - ${formatTime(leg.arrivalTime)}"
            }
        }
    }
    
    override fun getItemCount(): Int = legs.size
}
```

## Error Handling

### Exception Handling

```kotlin
// Robust error handling
sealed class TransitResult<T> {
    data class Success<T>(val data: T) : TransitResult<T>()
    data class Error<T>(val exception: Exception) : TransitResult<T>()
    class Loading<T> : TransitResult<T>()
}

class TransitViewModel(application: Application) : AndroidViewModel(application) {
    private val raptor: RaptorLibrary
    
    init {
        try {
            raptor = RaptorLibrary(
                stopsInputStream = application.assets.open("stops.bin"),
                routesInputStream = application.assets.open("routes.bin")
            )
        } catch (e: Exception) {
            // Handle initialization error
            throw TransitInitializationException("Failed to initialize Raptor", e)
        }
    }
    
    fun searchJourneys(origin: String, destination: String, departureTime: Int): LiveData<TransitResult<List<Journey>>> {
        return liveData {
            emit(TransitResult.Loading())
            
            try {
                // Input validation
                if (origin.isBlank() || destination.isBlank()) {
                    throw IllegalArgumentException("Origin and destination must not be empty")
                }
                
                if (departureTime < 0 || departureTime >= 24 * 3600) {
                    throw IllegalArgumentException("Invalid departure time")
                }
                
                val originStops = raptor.searchStopsByName(origin)
                val destinationStops = raptor.searchStopsByName(destination)
                
                if (originStops.isEmpty() || destinationStops.isEmpty()) {
                    throw TransitException("No stops found for the specified locations")
                }
                
                val journeys = raptor.getOptimizedPaths(
                    originStopIds = originStops.map { it.id },
                    destinationStopIds = destinationStops.map { it.id },
                    departureTime = departureTime
                )
                
                if (journeys.isEmpty()) {
                    emit(TransitResult.Error(TransitException("No journeys found")))
                } else {
                    emit(TransitResult.Success(journeys))
                }
                
            } catch (e: Exception) {
                emit(TransitResult.Error(e))
            }
        }
    }
}

class TransitException(message: String) : Exception(message)
class TransitInitializationException(message: String, cause: Throwable) : Exception(message, cause)
```

### Displaying Errors to Users

```kotlin
// In an Activity or Fragment
fun observeSearchResults() {
    viewModel.searchJourneys("Perrache", "Cuire", 8 * 3600).observe(this) { result ->
        when (result) {
            is TransitResult.Loading -> {
                showLoading(true)
                showError(false)
            }
            is TransitResult.Success -> {
                showLoading(false)
                showJourneys(result.data)
            }
            is TransitResult.Error -> {
                showLoading(false)
                showError(true)
                when (val error = result.exception) {
                    is TransitException -> {
                        showErrorMessage("No routes found. Try different stops.")
                    }
                    is IllegalArgumentException -> {
                        showErrorMessage("Please enter valid stops.")
                    }
                    else -> {
                        showErrorMessage("An error occurred. Please try again.")
                        logError(error)
                    }
                }
            }
        }
    }
}
```

## Best Practices

### 1. Data Management

```kotlin
// Caching frequently used data
class TransitDataCache(application: Application) {
    private val context = application.applicationContext
    private val cacheDir = File(context.cacheDir, "transit_cache")
    
    init {
        cacheDir.mkdirs()
    }
    
    fun cacheStopSearch(query: String, stops: List<Stop>) {
        try {
            val file = File(cacheDir, "stops_${query.hashCode()}.json")
            file.writeText(Json.encodeToString(stops))
        } catch (e: Exception) {
            // Handle error
        }
    }
    
    fun getCachedStops(query: String): List<Stop>? {
        try {
            val file = File(cacheDir, "stops_${query.hashCode()}.json")
            if (file.exists()) {
                return Json.decodeFromString(file.readText())
            }
        } catch (e: Exception) {
            // Handle error
        }
        return null
    }
    
    fun clearCache() {
        cacheDir.listFiles()?.forEach { it.delete() }
    }
}
```

### 2. Internationalization

```kotlin
// Multi-language support
fun getLocalizedStopName(stop: Stop, locale: Locale): String {
    // If your dataset contains localized names
    return when (locale.language) {
        "fr" -> stop.nameFr ?: stop.name
        "en" -> stop.nameEn ?: stop.name
        else -> stop.name
    }
}

// Time formatting according to locale
fun formatTimeForLocale(secondsSinceMidnight: Int, locale: Locale): String {
    val hours = secondsSinceMidnight / 3600
    val minutes = (secondsSinceMidnight % 3600) / 60
    val formatter = DateTimeFormatter.ofPattern("HH:mm", locale)
    val time = LocalTime.of(hours, minutes)
    return time.format(formatter)
}
```

### 3. Accessibility

```kotlin
// Accessibility best practices
fun setupAccessibleUI() {
    // For buttons
    searchButton.contentDescription = getString(R.string.search_button_desc)
    
    // For lists
    journeyList.setAccessibilityDelegate(object : RecyclerView.AccessibilityDelegate() {
        override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfo) {
            super.onInitializeAccessibilityNodeInfo(host, info)
            info.className = "androidx.recyclerview.widget.RecyclerView"
            info.collectionInfo = AccessibilityNodeInfo.CollectionInfo.obtain(
                1, journeyList.layoutManager?.itemCount ?: 0,
                false,
                AccessibilityNodeInfo.CollectionInfo.SELECTION_MODE_NONE
            )
        }
    })
    
    // For list items
    // In your ViewHolder:
    override fun onBindViewHolder(holder: JourneyViewHolder, position: Int) {
        val journey = journeys[position]
        
        // Add accessible descriptions
        holder.durationText.contentDescription = 
            "Trip duration: ${journey.totalTime / 60} minutes"
        
        holder.departureText.contentDescription = 
            "Departure at ${formatTime(journey.departureTime)}"
        
        holder.arrivalText.contentDescription = 
            "Arrival at ${formatTime(journey.arrivalTime)}"
    }
}
```

### 4. Testing

```kotlin
// Unit tests with Mockito
@RunWith(MockitoJUnitRunner::class)
class TransitViewModelTest {
    @Mock
    private lateinit var mockRaptor: RaptorLibrary
    
    @Mock
    private lateinit var application: Application
    
    private lateinit var viewModel: TransitViewModel
    
    @Before
    fun setup() {
        Mockito.`when`(application.assets).thenReturn(mockAssets())
        viewModel = TransitViewModel(application)
        viewModel.raptor = mockRaptor
    }
    
    @Test
    fun `searchJourneys should return results when available`() = runBlocking {
        // Setup
        val mockStops = listOf(Stop(1, "Perrache", 45.75, 4.82))
        val mockJourneys = listOf(createMockJourney())
        
        Mockito.`when`(mockRaptor.searchStopsByName("Perrache"))
            .thenReturn(mockStops)
        Mockito.`when`(mockRaptor.searchStopsByName("Cuire"))
            .thenReturn(mockStops)
        Mockito.`when`(mockRaptor.getOptimizedPaths(any(), any(), any()))
            .thenReturn(mockJourneys)
        
        // Test
        val result = viewModel.searchJourneys("Perrache", "Cuire", 8 * 3600)
        
        // Verify
        assert(result is TransitResult.Success)
        assert((result as TransitResult.Success).data == mockJourneys)
    }
    
    @Test
    fun `searchJourneys should handle empty results`() = runBlocking {
        // Setup
        val mockStops = listOf(Stop(1, "Perrache", 45.75, 4.82))
        
        Mockito.`when`(mockRaptor.searchStopsByName("Perrache"))
            .thenReturn(mockStops)
        Mockito.`when`(mockRaptor.searchStopsByName("Cuire"))
            .thenReturn(mockStops)
        Mockito.`when`(mockRaptor.getOptimizedPaths(any(), any(), any()))
            .thenReturn(emptyList())
        
        // Test
        val result = viewModel.searchJourneys("Perrache", "Cuire", 8 * 3600)
        
        // Verify
        assert(result is TransitResult.Error)
    }
}
```

## Integration with Other Services

### Integration with Maps

```kotlin
// Displaying routes on a map
fun displayJourneyOnMap(journey: Journey, googleMap: GoogleMap) {
    // Add markers for each step
    for (leg in journey.legs) {
        when (leg) {
            is Leg.WalkLeg -> {
                // Add a line for walking
                googleMap.addPolyline(
                    PolylineOptions()
                        .add(LatLng(leg.fromLat, leg.fromLon), LatLng(leg.toLat, leg.toLon))
                        .color(Color.BLUE)
                        .width(5f)
                )
            }
            is Leg.TransitLeg -> {
                // Add a line for transit
                googleMap.addPolyline(
                    PolylineOptions()
                        .add(LatLng(leg.fromLat, leg.fromLon), LatLng(leg.toLat, leg.toLon))
                        .color(getColorForRouteType(leg.routeType))
                        .width(8f)
                )
                
                // Add a marker for the stop
                googleMap.addMarker(
                    MarkerOptions()
                        .position(LatLng(leg.fromLat, leg.fromLon))
                        .title(leg.fromStopName)
                        .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE))
                )
            }
        }
    }
    
    // Center the camera
    val bounds = LatLngBounds.builder()
    for (leg in journey.legs) {
        bounds.include(LatLng(leg.fromLat, leg.fromLon))
        bounds.include(LatLng(leg.toLat, leg.toLon))
    }
    
    googleMap.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds.build(), 100))
}

private fun getColorForRouteType(routeType: Int): Int {
    return when (routeType) {
        0 -> Color.RED // Metro
        1 -> Color.GREEN // Tram
        2 -> Color.BLUE // Bus
        else -> Color.GRAY
    }
}
```

### Integration with Notifications

```kotlin
// Notification service for departures
class DepartureNotificationService : Service() {
    private lateinit var raptor: RaptorLibrary
    private lateinit var notificationManager: NotificationManager
    
    override fun onCreate() {
        super.onCreate()
        raptor = TransitApp.raptor
        notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "departure_channel",
                "Upcoming Departures",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun scheduleDepartureNotification(journey: Journey, minutesBefore: Int) {
        val departureTime = journey.departureTime
        val currentTime = getCurrentTimeInSeconds()
        
        // Calculate delay in milliseconds
        val delayMillis = (departureTime - currentTime - minutesBefore * 60) * 1000L
        
        if (delayMillis > 0) {
            val workRequest = OneTimeWorkRequestBuilder<NotificationWorker>()
                .setInitialDelay(delayMillis, TimeUnit.MILLISECONDS)
                .setInputData(workDataOf(
                    "journey_id" to journey.id.toString(),
                    "minutes_before" to minutesBefore
                ))
                .build()
            
            WorkManager.getInstance(this).enqueue(workRequest)
        }
    }
}

class NotificationWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        val journeyId = inputData.getString("journey_id")
        val minutesBefore = inputData.getInt("minutes_before", 10)
        
        // Retrieve trip details (simplified for example)
        val notification = NotificationCompat.Builder(applicationContext, "departure_channel")
            .setSmallIcon(R.drawable.ic_transit)
            .setContentTitle("Departure in $minutesBefore minutes")
            .setContentText("Your trip will start soon")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        
        val notificationManager = NotificationManagerCompat.from(applicationContext)
        notificationManager.notify(journeyId.hashCode(), notification)
        
        return Result.success()
    }
}
```

## Deployment and Maintenance

### Data Updates

```kotlin
// Data update service
class DataUpdateService : IntentService("DataUpdateService") {
    override fun onHandleIntent(intent: Intent?) {
        try {
            // Download new data
            val newStopsData = downloadFile("https://example.com/stops.bin")
            val newRoutesData = downloadFile("https://example.com/routes.bin")
            
            // Save to internal storage
            saveDataToInternalStorage(newStopsData, "stops.bin")
            saveDataToInternalStorage(newRoutesData, "routes.bin")
            
            // Notify the application
            sendBroadcast(Intent("DATA_UPDATE_COMPLETE"))
            
        } catch (e: Exception) {
            // Handle error and notify
            sendBroadcast(Intent("DATA_UPDATE_FAILED").putExtra("error", e.message))
        }
    }
    
    private fun downloadFile(url: String): ByteArray {
        // Download implementation
    }
    
    private fun saveDataToInternalStorage(data: ByteArray, filename: String) {
        val file = File(filesDir, filename)
        file.writeBytes(data)
    }
}

// Receiving updates in your Activity
class MainActivity : AppCompatActivity() {
    private val updateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                "DATA_UPDATE_COMPLETE" -> {
                    showUpdateSuccess()
                    // Reload data
                    reloadRaptorData()
                }
                "DATA_UPDATE_FAILED" -> {
                    val error = intent.getStringExtra("error")
                    showUpdateError(error)
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Register receiver
        registerReceiver(updateReceiver, IntentFilter().apply {
            addAction("DATA_UPDATE_COMPLETE")
            addAction("DATA_UPDATE_FAILED")
        })
    }
    
    override fun onDestroy() {
        unregisterReceiver(updateReceiver)
        super.onDestroy()
    }
    
    private fun reloadRaptorData() {
        // Reload Raptor with new data
        val newRaptor = RaptorLibrary(
            stopsInputStream = openFileInput("stops.bin"),
            routesInputStream = openFileInput("routes.bin")
        )
        
        // Replace existing instance
        TransitApp.raptor = newRaptor
    }
}
```

### Performance Monitoring

```kotlin
// Production performance monitoring
class PerformanceMonitor {
    private val performanceLogs = mutableListOf<PerformanceLog>()
    
    fun logSearchPerformance(
        origin: String,
        destination: String,
        startTime: Long,
        endTime: Long,
        resultCount: Int
    ) {
        val durationMs = endTime - startTime
        performanceLogs.add(PerformanceLog(
            timestamp = System.currentTimeMillis(),
            origin = origin,
            destination = destination,
            durationMs = durationMs,
            resultCount = resultCount,
            deviceInfo = getDeviceInfo()
        ))
        
        // Send logs periodically
        if (performanceLogs.size >= 100) {
            sendPerformanceLogs()
        }
    }
    
    private fun sendPerformanceLogs() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val logsJson = Json.encodeToString(performanceLogs)
                // Send to your analytics server
                sendToAnalyticsServer(logsJson)
                performanceLogs.clear()
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    private fun getDeviceInfo(): DeviceInfo {
        return DeviceInfo(
            model = Build.MODEL,
            manufacturer = Build.MANUFACTURER,
            sdkVersion = Build.VERSION.SDK_INT,
            memoryClass = getMemoryClass()
        )
    }
}

data class PerformanceLog(
    val timestamp: Long,
    val origin: String,
    val destination: String,
    val durationMs: Long,
    val resultCount: Int,
    val deviceInfo: DeviceInfo
)

data class DeviceInfo(
    val model: String,
    val manufacturer: String,
    val sdkVersion: Int,
    val memoryClass: Int
)
```