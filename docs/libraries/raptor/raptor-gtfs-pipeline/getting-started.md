# Getting Started

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- git (for cloning the repository)
- make (for using Makefile shortcuts)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/dotshell-org/raptor-gtfs-pipeline.git
cd raptor-gtfs-pipeline
```

### 2. Install dependencies

```bash
make install
```

This will create a virtual environment and install all required dependencies.

### 3. Verify installation

```bash
# Check CLI help
python -m raptor_pipeline.cli --help

# Check version
python -m raptor_pipeline.cli --version
```

## First Example

### Quick Conversion with Make

The easiest way to convert a GTFS file:

```bash
make run GTFS=path/to/your/gtfs.zip
```

This will:
- Extract the GTFS data if it's a ZIP file
- Convert it to binary format
- Generate files in `./raptor_data/` directory

### Using CLI Directly

```bash
# Basic conversion
python -m raptor_pipeline.cli convert --input path/to/gtfs --output ./output_data

# With verbose output
python -m raptor_pipeline.cli -v convert --input path/to/gtfs --output ./output_data
```

## Exploring the Output

After conversion, you'll find these files in your output directory:

```
output_data/
├── routes.bin      # Binary route data
├── stops.bin       # Binary stop data
├── index.bin       # Binary index data
├── manifest.json   # Metadata and statistics
└── (optional) *.json debug files if --debug-json true
```

### Understanding the Files

- **routes.bin**: Contains route information with stop sequences and schedules
- **stops.bin**: Contains stop locations and transfer information
- **index.bin**: Provides fast lookup indexes for routing
- **manifest.json**: Contains metadata, checksums, and statistics

## Service Period Splitting

One of the most powerful features is automatic service period splitting:

```bash
# Convert with period splitting
python -m raptor_pipeline.cli convert \
  --input gtfs.zip \
  --output ./periods_data \
  --split-by-periods true
```

This will create subdirectories:
```
periods_data/
├── weekday/
├── saturday/
├── sunday/
├── manifest.json
└── ...
```

Each subdirectory contains only the trips that operate during that period.

## Validation

Always validate your output:

```bash
# Validate binary output
python -m raptor_pipeline.cli validate --input ./output_data

# Validate with verbose output
python -m raptor_pipeline.cli -v validate --input ./output_data
```

## Next Steps

- [CLI Reference](cli-reference.md) - Learn all CLI options
- [Binary Format](binary-format.md) - Understand the binary format
- [Service Periods](service-periods.md) - Master period splitting
- [Validation](validation.md) - Learn about validation

## Troubleshooting

### Common Issues

**Issue: Command not found**
```bash
# Make sure you're using python3
python3 -m raptor_pipeline.cli --help

# Or activate the virtual environment
source .venv/bin/activate
```

**Issue: Missing dependencies**
```bash
# Reinstall dependencies
make install
```

**Issue: GTFS validation errors**
```bash
# Check your GTFS files for required files:
# agency.txt, stops.txt, routes.txt, trips.txt, stop_times.txt, calendar.txt
```