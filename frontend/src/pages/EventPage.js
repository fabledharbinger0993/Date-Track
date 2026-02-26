import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import EventForm from '../components/EventForm/EventForm';

const API_BASE = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;

const EventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      axios
        .get(`${API_BASE}/events`)
        .then((res) => {
          const foundEvent = res.data.find((e) => e.id === id);
          if (foundEvent) {
            setEvent(foundEvent);
          } else {
            setError('Event not found');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          setError('Failed to load event');
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleSubmit = (formData) => {
    const request = isEdit
      ? axios.put(`${API_BASE}/events/${id}`, formData)
      : axios.post(`${API_BASE}/events`, formData);

    request
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        console.error('Error saving event:', err);
        alert(err.response?.data?.message || 'Failed to save event');
      });
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <EventForm
        initialEvent={event}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EventPage;
