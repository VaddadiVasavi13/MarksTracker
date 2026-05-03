import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, Award, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    { icon: <TrendingUp />, title: 'Track Progress', description: 'Monitor academic performance with detailed analytics' },
    { icon: <Users />, title: 'Easy Management', description: 'Teachers can manage multiple students efficiently' },
    { icon: <Award />, title: 'Instant Insights', description: 'Get real-time averages and performance metrics' },
    { icon: <Shield />, title: 'Secure Platform', description: 'Role-based access with JWT authentication' }
  ];

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title fade-in">
            Smart Marks Tracking
            <span className="gradient-text"> For Modern Education</span>
          </h1>
          <p className="hero-subtitle">
            GradeFlow helps teachers manage student marks and helps students track their academic progress in real-time.
          </p>
          <div className="hero-buttons">
            {!user ? (
              <>
                <Link to="/register" className="btn-primary">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
              </>
            ) : (
              <Link to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} className="btn-primary">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Why Choose GradeFlow?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card card-hover">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Data Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Accessibility</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">Secure</div>
            <div className="stat-label">Authentication</div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to streamline grade management?</h2>
          <p>Join thousands of educators and students using GradeFlow</p>
          {!user && (
            <Link to="/register" className="btn-primary">
              Start Free <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;