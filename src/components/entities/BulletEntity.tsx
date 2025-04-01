
import React from 'react';
import { Bullet } from '../../types/game';

interface BulletEntityProps {
  bullet: Bullet;
}

const BulletEntity: React.FC<BulletEntityProps> = ({ bullet }) => {
  return (
    <div 
      className="absolute bg-yellow-500 rounded-full shadow-lg animate-pulse"
      style={{
        left: bullet.position.x,
        top: bullet.position.y,
        width: bullet.width,
        height: bullet.height,
        zIndex: 30,
        boxShadow: '0 0 5px 2px rgba(255, 255, 0, 0.7)',
      }}
    ></div>
  );
};

export default BulletEntity;
