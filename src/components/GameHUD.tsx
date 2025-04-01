
import React from 'react';

interface GameHUDProps {
  wantedLevel: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ wantedLevel }) => {
  return (
    <div className="w-full max-w-3xl mb-4 flex justify-between items-center p-2 bg-gray-800 text-white rounded">
      <div>
        <h2 className="font-bold text-xl">Pixel Crime Escape</h2>
      </div>
      
      <div className="flex items-center">
        <span className="mr-2 font-bold">WANTED:</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((level) => (
            <div 
              key={`wanted-${level}`}
              className={`w-5 h-5 mx-0.5 rounded-full ${level <= wantedLevel ? 'bg-wanted-level animate-pulse-wanted' : 'bg-gray-500'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
