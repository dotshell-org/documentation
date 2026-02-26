# Binary Format Specification

The Raptor GTFS Pipeline converts GTFS data into a compact binary format optimized for the RAPTOR routing algorithm. This format consists of three main binary files and a JSON manifest.

## File Structure

```
output_directory/
├── routes.bin      # Route data (v2 format)
├── stops.bin       # Stop data (v2 format)
├── index.bin       # Index data
├── manifest.json   # Metadata and checksums
└── (optional) debug files if --debug-json true
```

## routes.bin (v2 Format)

### Header Structure

```
Magic: b"RRT2" (4 bytes)
Schema Version: uint16 (2 bytes) = 2
Route Count: uint32 (4 bytes)
```

### Route Data Structure

For each route:
```
Route ID: uint32 (4 bytes)
Name Length: uint16 (2 bytes)
Name: UTF-8 bytes (variable)
Stop Count: uint32 (4 bytes)
Trip Count: uint32 (4 bytes)
Stop IDs: stop_count × uint32 (4 bytes each)
Trip IDs: trip_count × uint32 (4 bytes each)
Flat Stop Times: (trip_count × stop_count) × int32 (4 bytes each, delta-encoded, row-major)
```

### Encoding Details

- **Trips are pre-sorted** by departure time at first stop (ascending order)
- **Delta encoding**: Per trip row, first value is absolute, subsequent values are deltas
- **Row-major order**: All stop times for trip 1, then trip 2, etc.

### Example Structure

```python
# Conceptual representation
Route1 = {
    "id": 1,
    "name": "Bakerloo Line",
    "stop_ids": [101, 102, 103, 104],
    "trip_ids": [1001, 1002],
    "stop_times": [
        # Trip 1001: [08:00, 08:05, 08:10, 08:15] (absolute times)
        # Trip 1002: [08:30, 08:35, 08:40, 08:45] (absolute times)
        [08:00, 08:05, 08:10, 08:15, 08:30, 08:35, 08:40, 08:45]
    ]
}
```

## stops.bin (v2 Format)

### Header Structure

```
Magic: b"RST2" (4 bytes)
Schema Version: uint16 (2 bytes) = 2
Stop Count: uint32 (4 bytes)
```

### Stop Data Structure

For each stop:
```
Stop ID: uint32 (4 bytes)
Name Length: uint16 (2 bytes)
Name: UTF-8 bytes (variable)
Latitude: float64 (8 bytes)
Longitude: float64 (8 bytes)
Route Reference Count: uint32 (4 bytes)
Route IDs: route_ref_count × uint32 (4 bytes each)
Transfer Count: uint32 (4 bytes)
Transfers: transfer_count × {
    Target Stop ID: uint32 (4 bytes)
    Walk Time: int32 (4 bytes)
}
```

### Example Structure

```python
# Conceptual representation
Stop1 = {
    "id": 101,
    "name": "Victoria Station",
    "lat": 51.4967,
    "lon": -0.1433,
    "route_ids": [1, 2, 3],  # Routes serving this stop
    "transfers": [
        {"target_stop_id": 102, "walk_time": 120},  # 2 minutes
        {"target_stop_id": 103, "walk_time": 180}   # 3 minutes
    ]
}
```

## index.bin Format

### Header Structure

```
Magic: b"RIDX" (4 bytes)
Schema Version: uint16 (2 bytes)
```

### Index Data Structure

```
# Stop-to-Routes Index
Pairs Count: uint32 (4 bytes)
For each pair:
    Stop ID: uint32 (4 bytes)
    Route Count: uint32 (4 bytes)
    Route IDs: route_count × uint32 (4 bytes each)

# Route Offsets
Count: uint32 (4 bytes)
For each route:
    Route ID: uint32 (4 bytes)
    Offset: uint64 (8 bytes)

# Stop Offsets
Count: uint32 (4 bytes)
For each stop:
    Stop ID: uint32 (4 bytes)
    Offset: uint64 (8 bytes)
```

## manifest.json

The manifest file contains metadata, checksums, and statistics about the conversion process.

### Example manifest.json

```json
{
  "schema_version": 2,
  "tool_version": "0.1.0",
  "created_at": "2024-12-06T14:30:00.123456",
  "inputs": {
    "gtfs_path": "england_gtfs.zip",
    "gtfs_stats": {
      "stops": 1234,
      "routes": 56,
      "trips": 7890,
      "stop_times": 123456
    }
  },
  "outputs": {
    "routes.bin": {
      "sha256": "a1b2c3...",
      "size": 1234567
    },
    "stops.bin": {
      "sha256": "d4e5f6...",
      "size": 890123
    },
    "index.bin": {
      "sha256": "789abc...",
      "size": 456789
    }
  },
  "stats": {
    "stops": 1234,
    "routes": 56,
    "trips": 7890,
    "stop_times": 123456,
    "transfers": 4567
  },
  "build": {
    "python": "3.11.0",
    "platform": "Linux-5.15.0-x86_64",
    "timestamp": 1701878600.123456
  },
  "config": {
    "compression": true,
    "split_by_periods": false,
    "gen_transfers": false,
    "speed_walk": 1.33,
    "transfer_cutoff": 500
  }
}
```

## Binary Format Benefits

### Size Efficiency

- **Compact representation**: Binary format is significantly smaller than JSON
- **Delta encoding**: Reduces storage for stop times  
- **Efficient indexing**: Optimized for RAPTOR algorithm access patterns

### Performance

- **Fast loading**: Binary data loads quickly into memory
- **Cache-friendly**: Data structures designed for CPU cache efficiency
- **Direct access**: Indexes allow O(1) lookups for routing operations

### Data Integrity

- **Checksums**: SHA-256 hashes for all binary files
- **Versioning**: Schema version tracking
- **Metadata**: Complete conversion history and statistics

## Reading Binary Files

While the binary format is designed for programmatic access by routing algorithms, you can inspect the data:

```bash
# Convert to JSON for inspection
python -m raptor_pipeline.cli convert \
  --input path/to/gtfs \
  --output ./inspect_data \
  --format both \
  --debug-json true

# This will generate both binary and JSON files for comparison
```

## Format Evolution

The current format is version 2. Key improvements over version 1:

- **Better compression**: Enhanced delta encoding
- **Improved indexing**: More efficient route and stop lookups
- **Enhanced metadata**: Detailed statistics and checksums
- **Transfer support**: Built-in transfer information

## Technical Notes

### Endianness

All integers use **little-endian** encoding for compatibility with x86/x64 architectures.

### String Encoding

All text fields use **UTF-8** encoding.

### Floating Point

Coordinates use **IEEE 754 double precision** (64-bit) floating point format.

### File Integrity

The manifest.json file contains SHA-256 checksums for verifying file integrity after transfer or storage.