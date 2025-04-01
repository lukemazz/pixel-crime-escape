
import React from 'react';
import { WaterBike } from '../../types/game';

interface WaterBikeEntityProps {
  waterBike: WaterBike;
}

const WaterBikeEntity: React.FC<WaterBikeEntityProps> = ({ waterBike }) => {
  const isHorizontal = waterBike.direction === 'left' || waterBike.direction === 'right';
  
  return (
    <div 
      className="absolute rounded bg-cyan-500"
      style={{
        left: waterBike.position.x,
        top: waterBike.position.y,
        width: isHorizontal ? waterBike.width : waterBike.height,
        height: isHorizontal ? waterBike.height : waterBike.width,
        transition: 'transform 0.1s',
        transform: `rotate(${
          waterBike.direction === 'up' ? '0deg' :
          waterBike.direction === 'right' ? '90deg' :
          waterBike.direction === 'down' ? '180deg' :
          waterBike.direction === 'left' ? '270deg' : '0deg'
        })`,
        zIndex: 25 // Between buildings (20) and player (30)
      }}
    >
      {/* Water bike seat */}
      <div className="absolute bg-cyan-700 rounded-full" 
        style={{ 
          left: '30%', 
          top: '30%', 
          width: '40%', 
          height: '40%' 
        }}></div>
      
      {/* Water jet effect when moving */}
      {waterBike.speed > 0 && (
        <div className="absolute bg-blue-200 rounded-full animate-pulse" 
          style={{ 
            left: waterBike.direction === 'right' ? '-20%' : 
                 waterBike.direction === 'left' ? '100%' : '40%',
            top: waterBike.direction === 'down' ? '-20%' : 
                waterBike.direction === 'up' ? '100%' : '40%',
            width: '20%', 
            height: '20%' 
          }}></div>
      )}
    </div>
  );
};

export default WaterBikeEntity;
