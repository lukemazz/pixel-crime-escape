
import React from 'react';
import { Bullet } from '../../types/game';

interface BulletEntityProps {
  bullet: Bullet;
}

const BulletEntity: React.FC<BulletEntityProps> = ({ bullet }) => {
  // Change bullet color based on shooter
  const bulletColor = bullet.shooter.type === 'police' ? 'bg-red-500' : 'bg-yellow-400';
  const glowColor = bullet.shooter.type === 'police' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 215, 0, 0.8)';
  
  return (
    <div 
      className={`absolute ${bulletColor} rounded-full shadow-lg`}
      style={{
        left: bullet.position.x,
        top: bullet.position.y,
        width: bullet.width,
        height: bullet.height,
        zIndex: 30,
        boxShadow: `0 0 10px 3px ${glowColor}`,
        transform: `scale(${1 + (bullet.distanceTraveled / bullet.range) * 0.5})`,
        opacity: 1 - (bullet.distanceTraveled / bullet.range) * 0.7,
        transition: 'transform 100ms linear, opacity 100ms linear',
      }}
    ></div>
  );
};

export default BulletEntity;
