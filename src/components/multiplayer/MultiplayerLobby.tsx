
import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Game from '../Game';

const MultiplayerLobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  
  const handleStartGame = () => {
    if (!playerName.trim()) {
      alert('Inserisci un nome per iniziare a giocare!');
      return;
    }
    
    // In un'implementazione reale, qui configureremmo una connessione multiplayer
    // Per ora simuliamo semplicemente l'avvio del gioco
    setGameStarted(true);
  };
  
  if (gameStarted) {
    return <Game />;
  }
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg w-[800px] text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Lobby Multiplayer</h2>
      
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          onClick={() => setJoinMode('create')} 
          variant={joinMode === 'create' ? 'default' : 'outline'}
          className={joinMode === 'create' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Crea Partita
        </Button>
        <Button 
          onClick={() => setJoinMode('join')} 
          variant={joinMode === 'join' ? 'default' : 'outline'}
          className={joinMode === 'join' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          Unisciti a Partita
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Il tuo nome:</label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Inserisci il tuo nome"
            className="w-full bg-gray-700"
          />
        </div>
        
        {joinMode === 'join' && (
          <div>
            <label className="block mb-2">Codice Lobby:</label>
            <Input
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              placeholder="Inserisci il codice della lobby"
              className="w-full bg-gray-700"
            />
          </div>
        )}
        
        {joinMode === 'create' && (
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <p className="mb-2">Codice lobby da condividere:</p>
            <p className="text-xl font-mono bg-gray-900 p-2 rounded">{generateLobbyCode()}</p>
            <p className="mt-2 text-sm text-gray-400">Condividi questo codice con i tuoi amici per farli unire alla partita</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Button 
            onClick={handleStartGame}
            className="bg-red-600 hover:bg-red-700 font-bold text-lg px-8 py-3"
          >
            {joinMode === 'create' ? 'Crea e Inizia Partita' : 'Unisciti alla Partita'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Funzione per generare un codice lobby casuale
function generateLobbyCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export default MultiplayerLobby;
