from flask import Flask, request, jsonify, abort
from datetime import datetime, timezone
import uuid

app = Flask(__name__)

# In-memory store for events
events = {}


def _parse_datetime(value):
    """Parse an ISO 8601 datetime string."""
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        abort(400, description=f"Invalid datetime format: '{value}'. Use ISO 8601 (e.g. 2026-03-01T10:00:00).")


def _event_to_dict(event):
    return {
        "id": event["id"],
        "title": event["title"],
        "description": event.get("description", ""),
        "start": event["start"].isoformat(),
        "end": event["end"].isoformat() if event.get("end") else None,
        "location": event.get("location", ""),
        "created_at": event["created_at"].isoformat(),
        "updated_at": event["updated_at"].isoformat(),
    }


@app.route("/events", methods=["GET"])
def list_events():
    """Return all events, optionally filtered by date range."""
    from_str = request.args.get("from")
    to_str = request.args.get("to")

    result = list(events.values())

    if from_str:
        from_dt = _parse_datetime(from_str)
        result = [e for e in result if e["start"] >= from_dt]
    if to_str:
        to_dt = _parse_datetime(to_str)
        result = [e for e in result if e["start"] <= to_dt]

    result.sort(key=lambda e: e["start"])
    return jsonify([_event_to_dict(e) for e in result])


@app.route("/events", methods=["POST"])
def create_event():
    """Create a new event."""
    data = request.get_json(silent=True)
    if not data:
        abort(400, description="Request body must be JSON.")

    if not data.get("title"):
        abort(400, description="'title' is required.")
    if not data.get("start"):
        abort(400, description="'start' datetime is required.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    event = {
        "id": str(uuid.uuid4()),
        "title": data["title"],
        "description": data.get("description", ""),
        "start": _parse_datetime(data["start"]),
        "end": _parse_datetime(data["end"]) if data.get("end") else None,
        "location": data.get("location", ""),
        "created_at": now,
        "updated_at": now,
    }
    events[event["id"]] = event
    return jsonify(_event_to_dict(event)), 201


@app.route("/events/<event_id>", methods=["GET"])
def get_event(event_id):
    """Return a single event by ID."""
    event = events.get(event_id)
    if event is None:
        abort(404, description=f"Event '{event_id}' not found.")
    return jsonify(_event_to_dict(event))


@app.route("/events/<event_id>", methods=["PUT"])
def update_event(event_id):
    """Update an existing event."""
    event = events.get(event_id)
    if event is None:
        abort(404, description=f"Event '{event_id}' not found.")

    data = request.get_json(silent=True)
    if not data:
        abort(400, description="Request body must be JSON.")

    if "title" in data:
        event["title"] = data["title"]
    if "description" in data:
        event["description"] = data["description"]
    if "start" in data:
        event["start"] = _parse_datetime(data["start"])
    if "end" in data:
        event["end"] = _parse_datetime(data["end"]) if data["end"] else None
    if "location" in data:
        event["location"] = data["location"]
    event["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None)

    return jsonify(_event_to_dict(event))


@app.route("/events/<event_id>", methods=["DELETE"])
def delete_event(event_id):
    """Delete an event by ID."""
    if event_id not in events:
        abort(404, description=f"Event '{event_id}' not found.")
    del events[event_id]
    return "", 204


@app.errorhandler(400)
def bad_request(e):
    return jsonify(error=str(e.description)), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify(error=str(e.description)), 404


if __name__ == "__main__":
    app.run(debug=True)
