# Validation

The Raptor GTFS Pipeline includes comprehensive validation for both input GTFS data and output binary files to ensure data integrity and correctness.

## Input Validation (GTFS)

The pipeline validates GTFS input files during conversion to catch issues early.

### Validated GTFS Files

- **agency.txt** - Agency information
- **stops.txt** - Stop locations
- **routes.txt** - Route definitions
- **trips.txt** - Trip schedules
- **stop_times.txt** - Stop time sequences
- **calendar.txt** - Service calendars
- **calendar_dates.txt** - Calendar exceptions

### Validation Checks

#### Structural Validation

- **Required files present**: All mandatory GTFS files exist
- **File format**: Proper CSV format with headers
- **Column count**: Correct number of columns
- **Data types**: Valid data types for each field

#### Referential Integrity

- **service_id references**: All trip service_ids exist in calendar
- **route_id references**: All trip route_ids exist in routes
- **stop_id references**: All stop_times stop_ids exist in stops
- **agency_id references**: All route agency_ids exist in agency

#### Data Quality

- **Geographic coordinates**: Valid latitude/longitude ranges
- **Time formats**: Proper HH:MM:SS format
- **Date ranges**: Valid calendar date ranges
- **Trip sequences**: Proper stop sequence ordering

#### Business Rules

- **Service consistency**: Calendar patterns make sense
- **Trip coverage**: Trips cover reasonable time ranges
- **Stop coverage**: Stops are properly connected

## Output Validation

Validate binary output files to ensure successful conversion:

```bash
python -m raptor_pipeline.cli validate --input ./output_directory
```

### Validation Process

1. **File existence**: Check all required files are present
2. **File sizes**: Verify files are not empty
3. **Magic numbers**: Validate binary file headers
4. **Schema versions**: Check version compatibility
5. **Checksums**: Verify file integrity (SHA-256)
6. **Index consistency**: Validate index structures
7. **Cross-references**: Check internal data consistency

### Validation Output

```bash
# Successful validation
python -m raptor_pipeline.cli validate --input ./good_output
# Validation successful!
# Stats: {'stops': 1234, 'routes': 56, 'trips': 7890}

# Failed validation
python -m raptor_pipeline.cli validate --input ./bad_output
# Validation failed with 3 errors:
#   - Missing file: routes.bin
#   - Invalid magic number in stops.bin
#   - Checksum mismatch for index.bin
```

## Validation Report Structure

```json
{
  "valid": true,
  "schema_version": 2,
  "timestamp": "2024-12-06T14:30:00.123456",
  "input_path": "./output_directory",
  "files": {
    "routes.bin": {
      "exists": true,
      "size": 1234567,
      "magic_valid": true,
      "schema_version": 2,
      "checksum_valid": true,
      "checksum": "a1b2c3..."
    },
    "stops.bin": {
      "exists": true,
      "size": 890123,
      "magic_valid": true,
      "schema_version": 2,
      "checksum_valid": true,
      "checksum": "d4e5f6..."
    },
    "index.bin": {
      "exists": true,
      "size": 456789,
      "magic_valid": true,
      "schema_version": 1,
      "checksum_valid": true,
      "checksum": "789abc..."
    },
    "manifest.json": {
      "exists": true,
      "valid_json": true,
      "schema_version": 2
    }
  },
  "stats": {
    "stops": 1234,
    "routes": 56,
    "trips": 7890,
    "stop_times": 123456,
    "transfers": 4567
  },
  "warnings": [
    "Index schema version 1 is older than current version 2"
  ],
  "errors": [],
  "validation_time": 0.456
}
```

## Common Validation Issues

### Input GTFS Issues

**Missing required files**
```
Error: Missing required GTFS file: calendar.txt
Solution: Ensure your GTFS feed has all required files
```

**Invalid references**
```
Error: Trip with service_id='HOLIDAY' references non-existent service
Solution: Check calendar.txt and calendar_dates.txt
```

**Invalid coordinates**
```
Error: Stop 'DOWNTOWN' has invalid coordinates (lat=999, lon=999)
Solution: Fix geographic coordinates in stops.txt
```

### Output Binary Issues

**Missing files**
```
Error: Missing required output file: routes.bin
Solution: Re-run conversion and check for errors
```

**Invalid magic numbers**
```
Error: Invalid magic number in stops.bin (expected 'RST2', got 'XXXX')
Solution: File may be corrupted - re-run conversion
```

**Checksum mismatches**
```
Error: Checksum mismatch for index.bin
Solution: File may be corrupted or modified - re-run conversion
```

## Best Practices

### Input Validation

```bash
# Always validate GTFS before conversion
# Check file structure
unzip -l your_gtfs.zip

# Check for common issues
python -c "
import pandas as pd
stops = pd.read_csv('stops.txt')
print('Stops with invalid coords:', stops[(stops.stop_lat > 90) | (stops.stop_lat < -90)].count())
"
```

### Output Validation

```bash
# Validate immediately after conversion
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./data
python -m raptor_pipeline.cli validate --input ./data

# Validate before deployment
python -m raptor_pipeline.cli validate --input ./production_data
```

### Continuous Integration

Add validation to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Validate GTFS conversion
  run: |
    python -m raptor_pipeline.cli convert --input test_gtfs.zip --output ./test_output
    python -m raptor_pipeline.cli validate --input ./test_output
    if [ $? -ne 0 ]; then exit 1; fi
```

## Advanced Validation

### Custom Validation Scripts

```python
from raptor_pipeline.validation import validate_output

# Programmatic validation
report = validate_output("./output_directory")

if report.valid:
    print("✅ Validation successful")
    print(f"Stats: {report.stats}")
else:
    print(f"❌ Validation failed: {len(report.errors)} errors")
    for error in report.errors:
        print(f"  - {error}")
```

### Validation with Period Splitting

When using service period splitting, validate each period:

```bash
# Validate all periods
for period in weekday saturday sunday; do
  echo "Validating $period..."
  python -m raptor_pipeline.cli validate --input ./periods_data/$period
  if [ $? -ne 0 ]; then
    echo "❌ $period validation failed"
    exit 1
  fi
  echo "✅ $period validation successful"
done

# Validate master manifest
python -m raptor_pipeline.cli validate --input ./periods_data
```

## Troubleshooting Validation

### False Positives

Some validation warnings can be safely ignored:

- **Schema version warnings**: Older versions may still work
- **Unused fields**: Some GTFS fields may not be used
- **Future dates**: Calendar dates far in the future

### Debugging Validation Failures

```bash
# Enable verbose output
python -m raptor_pipeline.cli -v validate --input ./problem_data

# Check individual files
ls -la ./problem_data/
hexdump -C ./problem_data/routes.bin | head -20

# Compare with known good output
python -m raptor_pipeline.cli convert --input test_gtfs.zip --output ./good_output
python -m raptor_pipeline.cli validate --input ./good_output
```

## Validation Performance

### Optimization Tips

- **Validate during development**: Catch issues early
- **Parallel validation**: Validate multiple outputs simultaneously
- **Incremental validation**: Validate as you build complex datasets
- **Automate validation**: Integrate into build scripts

### Performance Metrics

| Dataset Size | Validation Time |
|-------------|-----------------|
| < 10MB       | < 0.1s          |
| 10-100MB     | 0.1-0.5s        |
| 100-500MB    | 0.5-2s          |
| > 500MB      | 2-10s           |

## Integration with Data Pipelines

### Pre-conversion Validation

```bash
# Validate GTFS before processing
python your_gtfs_validator.py input_gtfs.zip
if [ $? -ne 0 ]; then
  echo "GTFS validation failed"
  exit 1
fi

# Then convert
python -m raptor_pipeline.cli convert --input input_gtfs.zip --output ./output
```

### Post-conversion Validation

```bash
# Convert and validate
python -m raptor_pipeline.cli convert --input input_gtfs.zip --output ./output
VALIDATION_RESULT=$(python -m raptor_pipeline.cli validate --input ./output 2>&1)

if [[ $VALIDATION_RESULT == *"successful"* ]]; then
  echo "Conversion successful"
  # Proceed with deployment
else
  echo "Conversion failed validation"
  # Rollback or notify
fi
```

## Future Validation Enhancements

Planned improvements:

- **Custom validation rules**: User-defined validation scripts
- **Schema validation**: JSON Schema for manifest files
- **Cross-dataset validation**: Compare multiple outputs
- **Performance optimization**: Faster validation for large datasets
- **Automatic repair**: Fix common issues automatically