
import React from 'react';
import { Car } from '../../types/game';

interface CarEntityProps {
  car: Car;
}

const CarEntity: React.FC<CarEntityProps> = ({ car }) => {
  const isHorizontal = car.direction === 'left' || car.direction === 'right';
  
  return (
    <div 
      className={`absolute rounded ${car.driver?.type === 'police' ? 'bg-police' : 'bg-opacity-90'}`}
      style={{
        left: car.position.x,
        top: car.position.y,
        width: isHorizontal ? car.width : car.height,
        height: isHorizontal ? car.height : car.width,
        backgroundColor: car.driver?.type === 'police' ? undefined : car.color,
        transition: 'transform 0.1s',
        transform: `rotate(${
          car.direction === 'up' ? '0deg' :
          car.direction === 'right' ? '90deg' :
          car.direction === 'down' ? '180deg' :
          car.direction === 'left' ? '270deg' : '0deg'
        })`,
      }}
    >
      {/* Fenêtres de la voiture */}
      <div className="absolute bg-black bg-opacity-30 w-1/2 h-1/2 top-1/4 left-1/4"></div>
      
      {/* Feux de voiture */}
      {car.driver?.type === 'police' && (
        <div className="absolute top-0 left-0 right-0 mx-auto w-4 h-2 flex">
          <div className="w-2 h-2 bg-blue-500 animate-pulse"></div>
          <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default CarEntity;
