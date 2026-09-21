import "../styles/Landing.css";
import { Link } from "react-router-dom";

const Landing = () => {
    return (
        <div className="landing-page">

            {/* Navbar */}
            <nav className="navbar">

                <div className="logo">
                    E-Rickshaw
                </div>
            </nav>


            {/* Hero Section */}
            <section className="hero-section">

                <div className="hero-content">

                    <p className="hero-tag">
                        ONLINE E-RICKSHAW BOOKING
                    </p>

                    <h1>
                        Your Ride,
                        <span> Your Way.</span>
                    </h1>

                    <p className="hero-description">
                        Book an e-rickshaw quickly and easily.
                        Find a ride, choose your destination,
                        and get moving without the hassle.
                    </p>

                    <div className="hero-buttons">

                        <Link
                            to="/login"
                            className="primary-btn"
                        >
                            Book a Ride
                        </Link>

                        <Link
                            to="/register"
                            className="secondary-btn"
                        >
                            Create Account
                        </Link>

                    </div>

                </div>


                {/* Hero Visual */}
                <div className="hero-visual">

                    <div className="ride-circle">

                        <div className="rickshaw">
                            🛺
                        </div>

                    </div>

                    <div className="location-card pickup-card">
                        <span className="location-dot"></span>

                        <div>
                            <small>Pickup</small>
                            <strong>Your Location</strong>
                        </div>
                    </div>

                    <div className="location-card destination-card">
                        <span className="destination-dot"></span>

                        <div>
                            <small>Destination</small>
                            <strong>Your Destination</strong>
                        </div>
                    </div>

                </div>

            </section>


            {/* Benefits Section */}
            <section className="benefits-section">

                <div className="section-heading">

                    <p>
                        WHY E-RIDE?
                    </p>

                    <h2>
                        Simple. Fast. Reliable.
                    </h2>

                </div>


                <div className="benefits-grid">

                    <div className="benefit-card">

                        <div className="benefit-icon">
                            ⚡
                        </div>

                        <h3>
                            Quick & Convenient
                        </h3>

                        <p>
                            Book your e-rickshaw in just a
                            few clicks and get moving quickly.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            💰
                        </div>

                        <h3>
                            Affordable Travel
                        </h3>

                        <p>
                            Enjoy convenient transportation
                            at an affordable fare.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            🌱
                        </div>

                        <h3>
                            Eco-Friendly
                        </h3>

                        <p>
                            Choose electric mobility and
                            make your everyday travel greener.
                        </p>

                    </div>


                    <div className="benefit-card">

                        <div className="benefit-icon">
                            📱
                        </div>

                        <h3>
                            Easy Booking
                        </h3>

                        <p>
                            Enter your pickup and destination
                            and book your ride with ease.
                        </p>

                    </div>

                </div>

            </section>


            {/* CTA Section */}
            <section className="cta-section">

                <div className="cta-content">

                    <h2>
                        Ready to ride?
                    </h2>

                    <p>
                        Create your account and book your
                        first e-rickshaw ride today.
                    </p>

                    <Link
                        to="/register"
                        className="cta-button"
                    >
                        Get Started
                    </Link>

                </div>

            </section>


            {/* Footer */}
            <footer className="footer">

                <div className="footer-logo">
                    E-Ride
                </div>

                <p>
                    Online E-Rickshaw Booking System
                </p>

                <p className="copyright">
                    © 2026 E-Rickshaw. All rights reserved.
                </p>

            </footer>

        </div>
    );
};

export default Landing;