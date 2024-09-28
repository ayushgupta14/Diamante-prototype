import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Payments from './Payments';


function Home() {
  return (
    <div className="container">
      <header className="header">
        <h1 className="main-title"> Cross-border Payment Transaction</h1>
      </header>

      <section className="about">
        <div className="about-text">
          <h2>About Our App</h2>
          <p>We revolutionize global transactions with instant blockchain-based transfers.</p>
          <p>Crypto transfers between wallets occur on the blockchain, bypassing traditional systems.</p>
          <p>Option between Diamante and Eth network for users. </p>
        </div>
      </section>

      <Link to='/payments'>

        <button className="payment-btn">
          Go to Payment Page
        </button>
      </Link>

      <div className="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
    </div>
  );

}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/payments" element={<Payments />} />
      </Routes>
    </Router>
  );
}

export default App;
