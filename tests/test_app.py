import json
import pytest
from app import app, events


@pytest.fixture(autouse=True)
def clear_events():
    """Reset the in-memory event store before each test."""
    events.clear()
    yield
    events.clear()


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def post_event(client, title="Team meeting", start="2026-03-01T10:00:00", **kwargs):
    payload = {"title": title, "start": start, **kwargs}
    return client.post("/events", data=json.dumps(payload), content_type="application/json")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def test_create_event_minimal(client):
    resp = post_event(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Team meeting"
    assert data["start"] == "2026-03-01T10:00:00"
    assert data["end"] is None
    assert "id" in data


def test_create_event_full(client):
    resp = post_event(
        client,
        title="Sprint review",
        start="2026-03-05T14:00:00",
        end="2026-03-05T15:00:00",
        description="End-of-sprint demo",
        location="Conf room A",
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["end"] == "2026-03-05T15:00:00"
    assert data["description"] == "End-of-sprint demo"
    assert data["location"] == "Conf room A"


def test_create_event_missing_title(client):
    resp = client.post(
        "/events",
        data=json.dumps({"start": "2026-03-01T10:00:00"}),
        content_type="application/json",
    )
    assert resp.status_code == 400


def test_create_event_missing_start(client):
    resp = client.post(
        "/events",
        data=json.dumps({"title": "No start event"}),
        content_type="application/json",
    )
    assert resp.status_code == 400


def test_create_event_invalid_datetime(client):
    resp = post_event(client, start="not-a-date")
    assert resp.status_code == 400


def test_create_event_no_body(client):
    resp = client.post("/events", content_type="application/json")
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Read / List
# ---------------------------------------------------------------------------

def test_list_events_empty(client):
    resp = client.get("/events")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_list_events_returns_all(client):
    post_event(client, start="2026-03-01T10:00:00")
    post_event(client, title="Another", start="2026-03-02T09:00:00")
    resp = client.get("/events")
    assert resp.status_code == 200
    assert len(resp.get_json()) == 2


def test_list_events_sorted_by_start(client):
    post_event(client, title="Later", start="2026-03-03T10:00:00")
    post_event(client, title="Earlier", start="2026-03-01T10:00:00")
    data = client.get("/events").get_json()
    assert data[0]["title"] == "Earlier"
    assert data[1]["title"] == "Later"


def test_list_events_filter_from(client):
    post_event(client, title="Old", start="2026-02-01T10:00:00")
    post_event(client, title="New", start="2026-03-01T10:00:00")
    data = client.get("/events?from=2026-02-15T00:00:00").get_json()
    assert len(data) == 1
    assert data[0]["title"] == "New"


def test_list_events_filter_to(client):
    post_event(client, title="Old", start="2026-02-01T10:00:00")
    post_event(client, title="New", start="2026-03-01T10:00:00")
    data = client.get("/events?to=2026-02-15T00:00:00").get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Old"


def test_get_event(client):
    created = post_event(client).get_json()
    resp = client.get(f"/events/{created['id']}")
    assert resp.status_code == 200
    assert resp.get_json()["id"] == created["id"]


def test_get_event_not_found(client):
    resp = client.get("/events/nonexistent-id")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

def test_update_event(client):
    created = post_event(client).get_json()
    resp = client.put(
        f"/events/{created['id']}",
        data=json.dumps({"title": "Updated title", "location": "Online"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["title"] == "Updated title"
    assert data["location"] == "Online"


def test_update_event_not_found(client):
    resp = client.put(
        "/events/nonexistent-id",
        data=json.dumps({"title": "X"}),
        content_type="application/json",
    )
    assert resp.status_code == 404


def test_update_event_no_body(client):
    created = post_event(client).get_json()
    resp = client.put(f"/events/{created['id']}", content_type="application/json")
    assert resp.status_code == 400


def test_update_event_clear_end(client):
    created = post_event(client, end="2026-03-01T11:00:00").get_json()
    resp = client.put(
        f"/events/{created['id']}",
        data=json.dumps({"end": None}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert resp.get_json()["end"] is None


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

def test_delete_event(client):
    created = post_event(client).get_json()
    resp = client.delete(f"/events/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/events/{created['id']}").status_code == 404


def test_delete_event_not_found(client):
    resp = client.delete("/events/nonexistent-id")
    assert resp.status_code == 404
