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

const staticSeed = 12345;
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const seededRandom = (index: number) => {
  return pseudoRandom(staticSeed + index);
};

const GameMap: React.FC<GameMapProps> = ({ width, height }) => {
  const { roads, buildings, waters, parks } = useMemo(() => {
    const roads: Road[] = [];
    
    for (let y = 150; y < height; y += 250) {
      roads.push({
        x: 0,
        y,
        width,
        height: 40,
        isVertical: false
      });
    }
    
    for (let x = 150; x < width; x += 250) {
      roads.push({
        x,
        y: 0,
        width: 40,
        height,
        isVertical: true
      });
    }
    
    const buildings: Building[] = [];
    const buildingTypes: ('residential' | 'commercial' | 'industrial')[] = ['residential', 'commercial', 'industrial'];
    
    let buildingIndex = 0;
    for (let gridX = 0; gridX < Math.floor(width / 250); gridX++) {
      for (let gridY = 0; gridY < Math.floor(height / 250); gridY++) {
        const startX = gridX * 250 + 50;
        const startY = gridY * 250 + 50;
        const districtIndex = gridX * Math.floor(height / 250) + gridY;
        const quarterType = buildingTypes[Math.floor(seededRandom(districtIndex * 1000) * buildingTypes.length)];
        
        const buildingsCount = 3 + Math.floor(seededRandom(districtIndex) * 5);
        
        for (let i = 0; i < buildingsCount; i++) {
          const randSeed1 = buildingIndex * 3 + 1;
          const randSeed2 = buildingIndex * 3 + 2;
          const randSeed3 = buildingIndex * 3 + 3;
          const randSeed4 = buildingIndex * 3 + 4;
          
          const buildingX = startX + seededRandom(randSeed1) * 100;
          const buildingY = startY + seededRandom(randSeed2) * 100;
          const buildingWidth = 30 + seededRandom(randSeed3) * 60;
          const buildingHeight = 30 + seededRandom(randSeed4) * 60;
          
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
          
          buildingIndex++;
        }
      }
    }
    
    const waters: Water[] = [
      { x: width * 0.4, y: height * 0.4, width: width * 0.2, height: height * 0.2 },
      { x: width * 0.05, y: height * 0.7, width: width * 0.15, height: height * 0.2 },
      { x: width * 0.7, y: height * 0.1, width: width * 0.2, height: height * 0.15 }
    ];
    
    const parks: Park[] = [
      { x: width * 0.3, y: height * 0.3, width: width * 0.1, height: height * 0.1 },
      { x: width * 0.6, y: height * 0.6, width: width * 0.15, height: height * 0.15 }
    ];
    
    return { roads, buildings, waters, parks };
  }, []); // Empty dependency array ensures map is only generated once
  
  return (
    <div className="absolute inset-0 bg-grass">
      <div className="absolute inset-0 bg-emerald-800"></div>
      
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
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
            zIndex: 10
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-blue-400 animate-pulse"></div>
        </div>
      ))}
      
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
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)',
            zIndex: 11
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={`tree-${index}-${i}`}
              className="absolute bg-green-800 rounded-full"
              style={{
                left: seededRandom(i * 100 + index * 1000) * (park.width - 15),
                top: seededRandom(i * 100 + index * 1000 + 50) * (park.height - 15),
                width: 15,
                height: 15
              }}
            ></div>
          ))}
        </div>
      ))}
      
      {roads.map((road, index) => (
        <div 
          key={`road-${index}`}
          className="absolute bg-road"
          style={{
            left: road.x,
            top: road.y,
            width: road.width,
            height: road.height,
            zIndex: 15
          }}
        >
          {road.isVertical ? (
            <div 
              className="absolute h-full w-1 bg-yellow-400 left-1/2 transform -translate-x-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #333333 10px, #333333 20px)',
                zIndex: 16
              }}
            ></div>
          ) : (
            <div 
              className="absolute w-full h-1 bg-yellow-400 top-1/2 transform -translate-y-1/2"
              style={{ 
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #333333 10px, #333333 20px)',
                zIndex: 16
              }}
            ></div>
          )}
        </div>
      ))}
      
      {buildings.map((building, index) => {
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
