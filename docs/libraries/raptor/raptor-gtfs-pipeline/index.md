# Raptor GTFS Pipeline

Convert GTFS datasets to compact binary formats optimized for RAPTOR routing algorithm.

## Overview

The Raptor GTFS Pipeline is a command-line tool that converts GTFS (General Transit Feed Specification) datasets into optimized binary formats specifically designed for the RAPTOR routing algorithm. It supports advanced features like service period splitting to create separate datasets for different day types (weekdays, weekends, etc.).

## Key Features

- **Binary Format Conversion**: Convert GTFS to compact binary format (routes.bin, stops.bin, index.bin)
- **Service Period Splitting**: Automatically split datasets by service periods
- **Validation**: Validate both input GTFS and output binary files
- **Optimized for RAPTOR**: Binary format designed for efficient route planning
- **Multiple Output Formats**: Binary (default) and JSON debug output

## Installation

```bash
# Clone the repository
git clone https://github.com/dotshell-org/raptor-gtfs-pipeline.git
cd raptor-gtfs-pipeline

# Install dependencies
make install
```

## Quick Start

Convert a GTFS dataset to binary format:

```bash
# Using make (recommended)
make run GTFS=path/to/gtfs.zip

# Or using CLI directly
python -m raptor_pipeline.cli convert --input path/to/gtfs --output ./raptor_data
```

This will:
- Extract the GTFS data if it's a ZIP file
- Convert it to optimized binary format
- Generate files in `./raptor_data/` directory
