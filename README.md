# Date-Track

A hub for event management and third-party integrations.

## Overview

Date-Track is a lightweight REST API for creating, reading, updating, and deleting
time-based events. It is built with [Flask](https://flask.palletsprojects.com/) and
is designed to serve as the backend foundation for calendar and scheduling features.

## Requirements

- Python 3.10+

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the development server
python app.py
```

The API will be available at `http://127.0.0.1:5000`.

## API Reference

### Events

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/events` | List all events (supports `?from=` and `?to=` ISO 8601 filters) |
| `POST` | `/events` | Create a new event |
| `GET` | `/events/<id>` | Get a single event |
| `PUT` | `/events/<id>` | Update an event |
| `DELETE` | `/events/<id>` | Delete an event |

#### Event fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Short name for the event |
| `start` | ISO 8601 datetime | ✅ | Start date/time (e.g. `2026-03-01T10:00:00`) |
| `end` | ISO 8601 datetime | | Optional end date/time |
| `description` | string | | Free-text description |
| `location` | string | | Physical or virtual location |

#### Example

```bash
# Create an event
curl -X POST http://127.0.0.1:5000/events \
  -H "Content-Type: application/json" \
  -d '{"title": "Team sync", "start": "2026-03-01T10:00:00", "end": "2026-03-01T10:30:00"}'

# List events in March 2026
curl "http://127.0.0.1:5000/events?from=2026-03-01T00:00:00&to=2026-03-31T23:59:59"
```

## Running Tests

```bash
pip install pytest
pytest tests/ -v
```
