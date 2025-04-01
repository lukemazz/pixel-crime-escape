
import React, { useState } from 'react';
import Game from '../components/Game';
import MultiplayerLobby from '../components/multiplayer/MultiplayerLobby';
import { Button } from "../components/ui/button";

const Index: React.FC = () => {
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <h1 className="text-4xl font-bold mb-4 text-white">Pixel Crime Escape</h1>
      
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={() => setGameMode('solo')} 
          variant={gameMode === 'solo' ? 'default' : 'outline'}
          className={gameMode === 'solo' ? 'bg-red-600 hover:bg-red-700' : 'text-white'}
        >
          Modalità Solo
        </Button>
        <Button 
          onClick={() => setGameMode('multiplayer')} 
          variant={gameMode === 'multiplayer' ? 'default' : 'outline'} 
          className={gameMode === 'multiplayer' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white'}
        >
          Multiplayer
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {gameMode === 'solo' ? (
          <Game />
        ) : (
          <MultiplayerLobby />
        )}
      </div>
      
      <div className="mt-6 text-gray-300 max-w-lg text-center">
        <p className="mb-2">
          Échappez à la police, volez des voitures et créez le chaos dans la ville!
        </p>
        <p className="text-yellow-400 mb-2">
          Plus vous commettez de crimes, plus la police sera à vos trousses!
        </p>
        {gameMode === 'multiplayer' && (
          <p className="text-blue-400">
            Jouez avec vos amis et coordonnez vos crimes via le chat!
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;
