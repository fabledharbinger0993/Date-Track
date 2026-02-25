import React from 'react';
import './App.css';
import Home from './pages/Home';

function App() {
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <h1>Date-Track</h1>
        </div>
        <div className="nav-links">
          <a href="/">Home</a>
        </div>
      </nav>
      <main className="app-main">
        <Home />
      </main>
    </div>
  );
}

export default App;
