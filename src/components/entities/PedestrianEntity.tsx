
import React from 'react';
import { Pedestrian } from '../../types/game';

interface PedestrianEntityProps {
  pedestrian: Pedestrian;
}

const PedestrianEntity: React.FC<PedestrianEntityProps> = ({ pedestrian }) => {
  return (
    <div 
      className={`absolute rounded-full ${pedestrian.isHostile ? 'bg-red-500' : 'bg-green-500'}`}
      style={{
        left: pedestrian.position.x,
        top: pedestrian.position.y,
        width: pedestrian.width,
        height: pedestrian.height,
        transition: 'transform 0.1s',
        transform: `rotate(${
          pedestrian.direction === 'up' ? '0deg' :
          pedestrian.direction === 'right' ? '90deg' :
          pedestrian.direction === 'down' ? '180deg' :
          pedestrian.direction === 'left' ? '270deg' : '0deg'
        })`,
      }}
    >
      {/* Yeux pour indiquer la direction */}
      <div className="absolute bg-white w-1 h-1 rounded-full" style={{ left: '25%', top: '25%' }}></div>
      <div className="absolute bg-white w-1 h-1 rounded-full" style={{ right: '25%', top: '25%' }}></div>
    </div>
  );
};

export default PedestrianEntity;
