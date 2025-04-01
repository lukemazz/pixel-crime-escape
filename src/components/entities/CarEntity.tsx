
import React from 'react';
import { Car } from '../../types/game';

interface CarEntityProps {
  car: Car;
}

const CarEntity: React.FC<CarEntityProps> = ({ car }) => {
  const isHorizontal = car.direction === 'left' || car.direction === 'right';
  
  // Calculate drift angle based on velocity
  let driftAngle = 0;
  if (car.velocity) {
    const speed = Math.sqrt(car.velocity.x * car.velocity.x + car.velocity.y * car.velocity.y);
    if (speed > 0.5) {
      // Calculate drift angle based on the difference between velocity direction and car direction
      const velocityDirection = Math.atan2(car.velocity.y, car.velocity.x) * (180 / Math.PI);
      let carDirectionDegrees = 0;
      
      switch (car.direction) {
        case 'right': carDirectionDegrees = 0; break;
        case 'down': carDirectionDegrees = 90; break;
        case 'left': carDirectionDegrees = 180; break;
        case 'up': carDirectionDegrees = 270; break;
      }
      
      // Normalize difference
      let diff = (velocityDirection - carDirectionDegrees) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      // Calculate drift - limit to reasonable values
      driftAngle = Math.max(-30, Math.min(30, diff * 0.5));
    }
  }
  
  // Determine rotation based on direction
  let rotationDegrees = 0;
  switch (car.direction) {
    case 'up': rotationDegrees = 0; break;
    case 'right': rotationDegrees = 90; break;
    case 'down': rotationDegrees = 180; break;
    case 'left': rotationDegrees = 270; break;
  }
  
  return (
    <div 
      className={`absolute rounded ${car.driver?.type === 'police' ? 'bg-police' : 'bg-opacity-90'}`}
      style={{
        left: car.position.x,
        top: car.position.y,
        width: car.width,
        height: car.height,
        backgroundColor: car.driver?.type === 'police' ? undefined : car.color,
        transition: 'transform 0.1s',
        transform: `rotate(${rotationDegrees}deg) rotate(${driftAngle}deg)`,
        zIndex: 25
      }}
    >
      {/* Car windows */}
      <div className="absolute bg-black bg-opacity-30 w-1/2 h-1/2 top-1/4 left-1/4"></div>
      
      {/* Police lights */}
      {car.driver?.type === 'police' && (
        <div className="absolute top-0 left-0 right-0 mx-auto w-4 h-2 flex">
          <div className="w-2 h-2 bg-blue-500 animate-pulse"></div>
          <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
        </div>
      )}
      
      {/* Tire marks/skid effect when drifting */}
      {Math.abs(driftAngle) > 10 && (
        <div className="absolute -bottom-1 left-0 right-0 mx-auto w-full h-1 bg-gray-800 opacity-70"></div>
      )}
    </div>
  );
};

export default CarEntity;
