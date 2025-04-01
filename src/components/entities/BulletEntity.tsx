
import React from 'react';
import { Bullet } from '../../types/game';

interface BulletEntityProps {
  bullet: Bullet;
}

const BulletEntity: React.FC<BulletEntityProps> = ({ bullet }) => {
  return (
    <div 
      className="absolute bg-yellow-500 rounded-full animate-bullet"
      style={{
        left: bullet.position.x,
        top: bullet.position.y,
        width: bullet.width,
        height: bullet.height,
      }}
    ></div>
  );
};

export default BulletEntity;
