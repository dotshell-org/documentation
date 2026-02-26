# CLI Reference

The Raptor GTFS Pipeline provides a command-line interface with two main commands: `convert` and `validate`.

## Basic Usage

```bash
# Show help
python -m raptor_pipeline.cli --help

# Show version
python -m raptor_pipeline.cli --version

# Enable verbose output
python -m raptor_pipeline.cli -v convert --input path/to/gtfs --output ./output
```

## Convert Command

Converts GTFS data to optimized binary format.

### Basic Conversion

```bash
python -m raptor_pipeline.cli convert --input path/to/gtfs --output ./raptor_data
```

### Options

#### Input/Output
- `--input` (required): Path to GTFS directory or ZIP file
- `--output` (default: `./raptor_data`): Output directory
- `--format` (choices: `binary`, `json`, `both`, default: `binary`): Output format

#### Compression
- `--compression` (default: `true`): Enable delta compression for binary format

#### Debug Output
- `--debug-json` (default: `false`): Generate debug JSON files alongside binary output

#### Transfer Generation
- `--gen-transfers` (default: `false`): Generate walking transfers between stops
- `--speed-walk` (default: `1.33`): Walking speed in meters per second
- `--transfer-cutoff` (default: `500`): Maximum distance for transfer generation in meters

#### Service Period Splitting
- `--split-by-periods` (default: `false`): Generate separate folders per service period
- `--mode` (choices: `auto`, `lyon`, default: `auto`): Period detection mode

#### Performance
- `--jobs` (default: `1`): Number of parallel jobs
- `--allow-partial-trips` (default: `false`): Allow partial trips in output

### Examples

```bash
# Convert with compression (default)
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./output

# Convert with service period splitting
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./output --split-by-periods true

# Convert with transfer generation
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./output --gen-transfers true --speed-walk 1.2

# Convert with JSON debug output
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./output --debug-json true

# Convert using Lyon mode for period detection
python -m raptor_pipeline.cli convert --input gtfs.zip --output ./output --split-by-periods true --mode lyon
```

## Validate Command

Validates binary output files.

### Basic Validation

```bash
python -m raptor_pipeline.cli validate --input ./raptor_data
```

### Examples

```bash
# Validate binary output
python -m raptor_pipeline.cli validate --input ./raptor_data

# Validate with verbose output
python -m raptor_pipeline.cli validate -v --input ./raptor_data
```

## Service Period Splitting

When using `--split-by-periods true`, the tool creates separate subdirectories:

- `weekday/` - Monday to Friday schedules
- `saturday/` - Saturday schedules
- `sunday/` - Sunday and holiday schedules
- `weekend/` - Weekend schedules (if applicable)
- `daily/` - Daily schedules (if applicable)
- `custom_N/` - Custom patterns (if applicable)

Each subdirectory contains its own set of binary files with only the trips that operate during that service period.

## Using with Test Files

The project includes several test GTFS files you can use:

```bash
# Convert England GTFS
python -m raptor_pipeline.cli convert --input england_gtfs.zip --output ./england_data

# Convert Finland GTFS with period splitting
python -m raptor_pipeline.cli convert --input finland_gtfs.zip --output ./finland_data --split-by-periods true

# Convert TCL GTFS
python -m raptor_pipeline.cli convert --input GTFS_TCL.ZIP --output ./tcl_data

# Convert IDFM GTFS
python -m raptor_pipeline.cli convert --input IDFM-gtfs.zip --output ./idfm_data
```