
import React from 'react';
import { Police } from '../../types/game';

interface PoliceEntityProps {
  police: Police;
}

const PoliceEntity: React.FC<PoliceEntityProps> = ({ police }) => {
  return (
    <div 
      className={`absolute rounded-full bg-police ${police.chasing ? 'animate-pulse' : ''}`}
      style={{
        left: police.position.x,
        top: police.position.y,
        width: police.width,
        height: police.height,
        transition: 'transform 0.1s',
        transform: `rotate(${
          police.direction === 'up' ? '0deg' :
          police.direction === 'right' ? '90deg' :
          police.direction === 'down' ? '180deg' :
          police.direction === 'left' ? '270deg' : '0deg'
        })`,
      }}
    >
      {/* Yeux pour indiquer la direction */}
      <div className="absolute bg-white w-2 h-2 rounded-full" style={{ left: '25%', top: '25%' }}></div>
      <div className="absolute bg-white w-2 h-2 rounded-full" style={{ right: '25%', top: '25%' }}></div>
      
      {/* Sirène de police */}
      <div className="absolute top-0 left-0 right-0 mx-auto w-4 h-2 flex">
        <div className="w-2 h-2 bg-blue-500 animate-pulse"></div>
        <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PoliceEntity;
