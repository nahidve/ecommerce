import React from 'react';
import './Rating.css';

const Rating = ({ rating, maxStars = 5, onRate, clickable = false }) => {
  const stars = [];
  const roundedRating = Math.round(rating || 0);

  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      <span
        key={i}
        className={`star-icon ${i <= roundedRating ? 'filled' : ''} ${clickable ? 'clickable' : ''}`}
        onClick={() => clickable && onRate && onRate(i)}
      >
        ★
      </span>
    );
  }

  return <div className="rating-stars">{stars}</div>;
};

export default Rating;
