# Service Period Splitting

One of the most powerful features of the Raptor GTFS Pipeline is automatic service period splitting. This feature creates separate datasets for different service periods (weekdays, weekends, etc.), significantly reducing file sizes and improving routing performance.

## Overview

Service period splitting analyzes the GTFS calendar data and automatically groups trips by their operating patterns. This is particularly useful for:

- **Reducing data size**: Each period contains only relevant trips
- **Faster routing**: Less data to load and process for specific queries
- **Clear organization**: Easy to select the right data for a given day
- **Flexible deployment**: Different periods can be deployed independently

## How It Works

The pipeline performs these steps:

1. **Reads calendar data**: Analyzes `calendar.txt` and `calendar_dates.txt`
2. **Identifies patterns**: Groups services by day-of-week patterns
3. **Filters trips**: Assigns trips to appropriate periods based on `service_id`
4. **Generates outputs**: Creates separate binary files for each period

## Basic Usage

```bash
python -m raptor_pipeline.cli convert \
  --input path/to/gtfs \
  --output ./periods_data \
  --split-by-periods true
```

## Period Detection Modes

### Auto Mode (Default)

The `auto` mode detects standard patterns:

- **weekday**: Monday to Friday
- **saturday**: Saturday only
- **sunday**: Sunday and holidays
- **weekend**: Saturday and Sunday (if applicable)
- **daily**: Every day (if applicable)

```bash
python -m raptor_pipeline.cli convert \
  --input gtfs.zip \
  --output ./output \
  --split-by-periods true \
  --mode auto
```

### Lyon Mode

The `lyon` mode is specialized for Lyon's school calendar:

- **school_on**: School days (Monday-Friday during school periods)
- **school_off**: Weekdays during school holidays
- **sat**: Saturday
- **sun**: Sunday

```bash
python -m raptor_pipeline.cli convert \
  --input GTFS_TCL.ZIP \
  --output ./lyon_periods \
  --split-by-periods true \
  --mode lyon
```

## Output Structure

When using period splitting, the output directory contains:

```
periods_data/
├── weekday/
│   ├── routes.bin
│   ├── stops.bin
│   ├── index.bin
│   └── manifest.json
├── saturday/
│   ├── routes.bin
│   ├── stops.bin
│   ├── index.bin
│   └── manifest.json
├── sunday/
│   ├── routes.bin
│   ├── stops.bin
│   ├── index.bin
│   └── manifest.json
├── manifest.json          # Master manifest
└── (optional) other periods
```

## Period-Specific Manifests

Each period subdirectory contains its own `manifest.json` with period-specific statistics:

```json
{
  "schema_version": 2,
  "period": "weekday",
  "service_ids": ["WEEKDAY", "MON-FRI"],
  "stats": {
    "stops": 1234,
    "routes": 56,
    "trips": 3456,
    "stop_times": 45678
  },
  "calendar_pattern": "1111100"
}
```

## Benefits of Period Splitting

### Size Comparison

| Format          | Size (MB) | Trips | Use Case |
|----------------|-----------|-------|----------|
| Full dataset     | 120       | 8000  | Complete coverage |
| Weekday only    | 75        | 5000  | Monday-Friday routing |
| Saturday only   | 30        | 1500  | Saturday routing |
| Sunday only     | 25        | 1200  | Sunday routing |

### Performance Impact

- **Loading time**: 30-50% faster for period-specific datasets
- **Memory usage**: 40-60% reduction when loading single periods
- **Routing speed**: 20-40% improvement due to reduced data

## Advanced Usage

### Combining with Other Options

```bash
# Period splitting with transfer generation
python -m raptor_pipeline.cli convert \
  --input gtfs.zip \
  --output ./advanced_output \
  --split-by-periods true \
  --gen-transfers true \
  --speed-walk 1.2 \
  --transfer-cutoff 400

# Period splitting with debug output
python -m raptor_pipeline.cli convert \
  --input gtfs.zip \
  --output ./debug_output \
  --split-by-periods true \
  --debug-json true \
  --format both
```

### Custom Period Handling

For GTFS feeds with custom calendar patterns, the pipeline automatically creates custom directories:

```
periods_data/
├── weekday/
├── saturday/
├── sunday/
├── custom_one/    # Custom pattern 1
├── custom_two/    # Custom pattern 2
└── manifest.json
```

## Best Practices

### When to Use Period Splitting

✅ **Use period splitting when:**
- You need to route for specific days of the week
- You want to optimize storage and memory usage
- You have large GTFS datasets (>50MB)
- You need faster loading times

❌ **Avoid period splitting when:**
- You need complete dataset for analytics
- Your GTFS has very simple calendar patterns
- You're working with small datasets (&lt10MB)

### Deployment Strategies

**Strategy 1: Load on demand**
```python
# Pseudocode for routing application
def get_router(day_type):
    if day_type == "weekday":
        load_data("periods/weekday")
    elif day_type == "saturday":
        load_data("periods/saturday")
    elif day_type == "sunday":
        load_data("periods/sunday")
```

**Strategy 2: Pre-load all periods**
```python
# For applications needing fast switching
routers = {
    "weekday": load_data("periods/weekday"),
    "saturday": load_data("periods/saturday"),
    "sunday": load_data("periods/sunday")
}
```

## Troubleshooting

### Common Issues

**No periods created**
- Check that your GTFS has proper `calendar.txt` and `calendar_dates.txt`
- Verify that trips have valid `service_id` references
- Use `--debug-json true` to inspect the calendar patterns

**Empty period directories**
- Some periods might have no trips (e.g., no Sunday service)
- Check the master `manifest.json` for period statistics

**Unexpected period assignments**
- Review your GTFS calendar exceptions in `calendar_dates.txt`
- Use Lyon mode for school-based calendars: `--mode lyon`

### Debugging Period Detection

```bash
# Generate debug output to inspect period assignment
python -m raptor_pipeline.cli convert \
  --input gtfs.zip \
  --output ./debug_periods \
  --split-by-periods true \
  --debug-json true

# This creates JSON files showing which trips go to which periods
```

## Technical Details

### Calendar Pattern Analysis

The pipeline analyzes these GTFS files:

1. **calendar.txt**: Base weekly patterns
2. **calendar_dates.txt**: Date-specific exceptions

### Pattern Matching Algorithm

The algorithm processes each service_id through these steps:

1. Get base pattern from calendar.txt
2. Apply exceptions from calendar_dates.txt
3. Normalize to standard patterns
4. Assign to closest matching period

### Period Assignment Rules

- **weekday**: Services operating Mon-Fri with pattern `1111100`
- **saturday**: Services operating only Saturday with pattern `0000010`
- **sunday**: Services operating Sunday and holidays with pattern `0000001`
- **weekend**: Services operating Sat-Sun with pattern `0000011`
- **daily**: Services operating every day with pattern `1111111`

## Comparison with Full Dataset

### Storage Efficiency

| Dataset Type      | Relative Size | Use Case |
|-------------------|---------------|----------|
| Full dataset        | 100%          | Complete coverage |
| Period-split        | 50-70%        | Day-specific routing |
| Single period       | 20-40%        | Single day type |

### Performance Characteristics

| Operation          | Full Dataset | Period Dataset | Improvement |
|-------------------|--------------|----------------|-------------|
| Load time          | 100ms        | 40ms           | 2.5x faster |
| Memory usage       | 200MB        | 80MB           | 2.5x less |
| Routing speed      | 100 req/s    | 140 req/s      | 1.4x faster |
