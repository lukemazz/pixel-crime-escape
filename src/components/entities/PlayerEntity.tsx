
import React from 'react';
import { Player } from '../../types/game';

interface PlayerEntityProps {
  player: Player;
}

const PlayerEntity: React.FC<PlayerEntityProps> = ({ player }) => {
  return (
    <div 
      className="absolute bg-blue-500 rounded-full"
      style={{
        left: player.position.x,
        top: player.position.y,
        width: player.width,
        height: player.height,
        transition: 'transform 0.1s',
        transform: `rotate(${
          player.direction === 'up' ? '0deg' :
          player.direction === 'right' ? '90deg' :
          player.direction === 'down' ? '180deg' :
          player.direction === 'left' ? '270deg' : '0deg'
        })`,
      }}
    >
      {/* Yeux pour indiquer la direction */}
      <div className="absolute bg-white w-2 h-2 rounded-full" style={{ left: '25%', top: '25%' }}></div>
      <div className="absolute bg-white w-2 h-2 rounded-full" style={{ right: '25%', top: '25%' }}></div>
    </div>
  );
};

export default PlayerEntity;
