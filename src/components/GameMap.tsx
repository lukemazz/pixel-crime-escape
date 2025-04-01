
import React, { useMemo } from 'react';

interface GameMapProps {
  width: number;
  height: number;
}

interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'residential' | 'commercial' | 'industrial';
}

interface Road {
  x: number;
  y: number;
  width: number;
  height: number;
  isVertical: boolean;
}

interface Water {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Park {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GameMap: React.FC<GameMapProps> = ({ width, height }) => {
  // Using useMemo to ensure the map is generated only once and remains static
  const { roads, buildings, waters, parks } = useMemo(() => {
    // Generate a grid of roads
    const roads: Road[] = [];
    
    // Horizontal roads
    for (let y = 150; y < height; y += 250) {
      roads.push({
        x: 0,
        y,
        width,
        height: 40,
        isVertical: false
      });
    }
    
    // Vertical roads
    for (let x = 150; x < width; x += 250) {
      roads.push({
        x,
        y: 0,
        width: 40,
        height,
        isVertical: true
      });
    }
    
    // Generate districts
    const buildings: Building[] = [];
    const buildingTypes: ('residential' | 'commercial' | 'industrial')[] = ['residential', 'commercial', 'industrial'];
    
    // Cycle through the "districts" created by roads
    for (let gridX = 0; gridX < Math.floor(width / 250); gridX++) {
      for (let gridY = 0; gridY < Math.floor(height / 250); gridY++) {
        const startX = gridX * 250 + 50;
        const startY = gridY * 250 + 50;
        const quarterType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
        
        // Generate multiple buildings within each district
        const buildingsCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < buildingsCount; i++) {
          const buildingX = startX + Math.random() * 100;
          const buildingY = startY + Math.random() * 100;
          const buildingWidth = 30 + Math.random() * 60;
          const buildingHeight = 30 + Math.random() * 60;
          
          // Avoid overlapping with roads
          const overlapsRoad = roads.some(road => (
            (buildingX < road.x + road.width) &&
            (buildingX + buildingWidth > road.x) &&
            (buildingY < road.y + road.height) &&
            (buildingY + buildingHeight > road.y)
          ));
          
          if (!overlapsRoad) {
            buildings.push({
              x: buildingX,
              y: buildingY,
              width: buildingWidth,
              height: buildingHeight,
              type: quarterType
            });
          }
        }
      }
    }
    
    // Generate water (lakes, rivers) - making a larger central lake for water bikes
    const waters: Water[] = [
      { x: width * 0.4, y: height * 0.4, width: width * 0.2, height: height * 0.2 },
      { x: width * 0.05, y: height * 0.7, width: width * 0.15, height: height * 0.2 },
      { x: width * 0.7, y: height * 0.1, width: width * 0.2, height: height * 0.15 }
    ];
    
    // Generate parks
    const parks: Park[] = [
      { x: width * 0.3, y: height * 0.3, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.6, y: height * 0.6, width: width * 0.15, height: height * 0.15 }
    ];
    
    return { roads, buildings, waters, parks };
  }, [width, height]); // Dependencies for useMemo
  
  return (
    <div className="absolute inset-0 bg-grass">
      {/* Background */}
      <div className="absolute inset-0 bg-emerald-800"></div>
      
      {/* Water */}
      {waters.map((water, index) => (
        <div 
          key={`water-${index}`}
          className="absolute bg-blue-600"
          style={{
            left: water.x,
            top: water.y,
            width: water.width,
            height: water.height,
            borderRadius: '30%',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Subtle waves on water */}
          <div className="absolute inset-0 opacity-20 bg-blue-400 animate-pulse"></div>
        </div>
      ))}
      
      {/* Parks */}
      {parks.map((park, index) => (
        <div 
          key={`park-${index}`}
          className="absolute bg-green-600"
          style={{
            left: park.x,
            top: park.y,
            width: park.width,
            height: park.height,
            borderRadius: '10px',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Trees in the park */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={`tree-${index}-${i}`}
              className="absolute bg-green-800 rounded-full"
              style={{
                left: Math.random() * (park.width - 15),
                top: Math.random() * (park.height - 15),
                width: 15,
                height: 15
              }}
            ></div>
          ))}
        </div>
      ))}
      
      {/* Roads */}
      {roads.map((road, index) => (
        <div 
          key={`road-${index}`}
          className="absolute bg-road"
          style={{
            left: road.x,
            top: road.y,
            width: road.width,
            height: road.height,
            zIndex: 10
          }}
        >
          {/* Center lines of the road */}
          {road.isVertical ? (
            <div 
              className="absolute h-full w-1 bg-yellow-400 left-1/2 transform -translate-x-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #333333 10px, #333333 20px)',
                zIndex: 11
              }}
            ></div>
          ) : (
            <div 
              className="absolute w-full h-1 bg-yellow-400 top-1/2 transform -translate-y-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #333333 10px, #333333 20px)',
                zIndex: 11
              }}
            ></div>
          )}
        </div>
      ))}
      
      {/* Buildings */}
      {buildings.map((building, index) => {
        // Determine the color of the building based on type
        let bgColor = 'bg-building';
        let windowColor = 'bg-yellow-100';
        
        switch (building.type) {
          case 'residential':
            bgColor = 'bg-orange-800';
            break;
          case 'commercial':
            bgColor = 'bg-gray-600';
            windowColor = 'bg-blue-200';
            break;
          case 'industrial':
            bgColor = 'bg-gray-800';
            windowColor = 'bg-gray-400';
            break;
        }
        
        return (
          <div 
            key={`building-${index}`}
            className={`absolute ${bgColor}`}
            style={{
              left: building.x,
              top: building.y,
              width: building.width,
              height: building.height,
              boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.5)',
              zIndex: 20
            }}
          >
            {/* Windows of buildings */}
            {Array.from({ length: Math.floor(building.width / 15) }).map((_, i) => (
              Array.from({ length: Math.floor(building.height / 15) }).map((_, j) => (
                <div 
                  key={`window-${index}-${i}-${j}`}
                  className={`absolute ${windowColor}`}
                  style={{
                    left: 5 + i * 15,
                    top: 5 + j * 15,
                    width: 8,
                    height: 8
                  }}
                ></div>
              ))
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GameMap;
