
import React from 'react';
import Game from '../components/Game';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <h1 className="text-4xl font-bold mb-6 text-white">Pixel Crime Escape</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Game />
      </div>
      
      <div className="mt-6 text-gray-300 max-w-lg text-center">
        <p className="mb-2">
          Échappez à la police, volez des voitures et créez le chaos dans la ville!
        </p>
        <p className="text-yellow-400">
          Plus vous commettez de crimes, plus la police sera à vos trousses!
        </p>
      </div>
    </div>
  );
};

export default Index;
