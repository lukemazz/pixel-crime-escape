
import React from 'react';

interface GameMapProps {
  width: number;
  height: number;
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Road {
  x: number;
  y: number;
  width: number;
  height: number;
  isVertical: boolean;
}

const GameMap: React.FC<GameMapProps> = ({ width, height }) => {
  // Générer des bâtiments aléatoires
  const buildings: Building[] = [
    // Quartier haut gauche
    { x: 50, y: 50, width: 100, height: 80 },
    { x: 50, y: 150, width: 60, height: 70 },
    { x: 180, y: 50, width: 70, height: 100 },
    
    // Quartier haut droit
    { x: 550, y: 50, width: 120, height: 90 },
    { x: 700, y: 50, width: 70, height: 120 },
    { x: 650, y: 170, width: 90, height: 60 },
    
    // Quartier bas gauche
    { x: 50, y: 400, width: 110, height: 80 },
    { x: 180, y: 450, width: 70, height: 100 },
    
    // Quartier bas droit
    { x: 600, y: 450, width: 90, height: 100 },
    { x: 720, y: 400, width: 50, height: 70 },
  ];
  
  // Générer les routes
  const roads: Road[] = [
    // Routes horizontales
    { x: 0, y: 250, width, height: 40, isVertical: false },
    { x: 0, y: 350, width, height: 30, isVertical: false },
    
    // Routes verticales
    { x: 300, y: 0, width: 40, height, isVertical: true },
    { x: 500, y: 0, width: 30, height, isVertical: true },
  ];
  
  return (
    <div className="absolute inset-0 bg-grass">
      {/* Routes */}
      {roads.map((road, index) => (
        <div 
          key={`road-${index}`}
          className="absolute bg-road"
          style={{
            left: road.x,
            top: road.y,
            width: road.width,
            height: road.height,
          }}
        >
          {/* Lignes médianes de la route */}
          {road.isVertical ? (
            <div 
              className="absolute h-full w-1 bg-yellow-400 left-1/2 transform -translate-x-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #333333 10px, #333333 20px)' 
              }}
            ></div>
          ) : (
            <div 
              className="absolute w-full h-1 bg-yellow-400 top-1/2 transform -translate-y-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #333333 10px, #333333 20px)' 
              }}
            ></div>
          )}
        </div>
      ))}
      
      {/* Bâtiments */}
      {buildings.map((building, index) => (
        <div 
          key={`building-${index}`}
          className="absolute bg-building"
          style={{
            left: building.x,
            top: building.y,
            width: building.width,
            height: building.height,
            boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Fenêtres des bâtiments */}
          {Array.from({ length: Math.floor(building.width / 20) }).map((_, i) => (
            Array.from({ length: Math.floor(building.height / 20) }).map((_, j) => (
              <div 
                key={`window-${index}-${i}-${j}`}
                className="absolute bg-yellow-100"
                style={{
                  left: 5 + i * 20,
                  top: 5 + j * 20,
                  width: 10,
                  height: 10
                }}
              ></div>
            ))
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameMap;
