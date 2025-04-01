
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Player, Car, Police, Pedestrian, Direction, Bullet } from '../types/game';
import { detectCollision, moveEntity, playerShoot, stealCar, exitCar, updateWantedLevel, policeChasePlayer, movePolice, generateId } from '../utils/gameUtils';
import GameMap from './GameMap';
import PlayerEntity from './entities/PlayerEntity';
import PedestrianEntity from './entities/PedestrianEntity';
import PoliceEntity from './entities/PoliceEntity';
import CarEntity from './entities/CarEntity';
import BulletEntity from './entities/BulletEntity';
import GameHUD from './GameHUD';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const FPS = 60;

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Initialiser le joueur
    const player: Player = {
      id: 'player-1',
      type: 'player',
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      direction: 'down',
      speed: 3,
      width: 20,
      height: 20,
      isAlive: true,
      inCar: false,
      currentCar: null,
      wantedLevel: 0,
      hasGun: true
    };
    
    // Initialiser les piétons
    const pedestrians: Pedestrian[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `pedestrian-${i}`,
      type: 'pedestrian',
      position: {
        x: Math.random() * (GAME_WIDTH - 20),
        y: Math.random() * (GAME_HEIGHT - 20)
      },
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 1,
      width: 15,
      height: 15,
      isAlive: true,
      isHostile: Math.random() > 0.8
    }));
    
    // Initialiser la police
    const police: Police[] = Array.from({ length: 3 }).map((_, i) => ({
      id: `police-${i}`,
      type: 'police',
      position: {
        x: Math.random() * (GAME_WIDTH - 20),
        y: Math.random() * (GAME_HEIGHT - 20)
      },
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 2,
      width: 20,
      height: 20,
      isAlive: true,
      chasing: false,
      detectionRadius: 150
    }));
    
    // Initialiser les voitures
    const cars: Car[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `car-${i}`,
      type: 'car',
      position: {
        x: 100 + (i * 100),
        y: 100 + (i * 80)
      },
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 0,
      width: 30,
      height: 15,
      isAlive: true,
      color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][Math.floor(Math.random() * 5)],
      driver: null,
      maxSpeed: 5
    }));
    
    return {
      player,
      pedestrians,
      police,
      cars,
      bullets: [],
      score: 0,
      gameOver: false
    };
  });
  
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  
  // Gestionnaire de touches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.add(e.key.toLowerCase());
        return newSet;
      });
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        return newSet;
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Gestion des entrées utilisateur
  const handleUserInput = useCallback((state: GameState): GameState => {
    let { player, bullets, cars } = state;
    let direction: Direction | null = null;
    
    // Déplacement
    if (keysPressed.has('w') || keysPressed.has('arrowup')) direction = 'up';
    else if (keysPressed.has('s') || keysPressed.has('arrowdown')) direction = 'down';
    else if (keysPressed.has('a') || keysPressed.has('arrowleft')) direction = 'left';
    else if (keysPressed.has('d') || keysPressed.has('arrowright')) direction = 'right';
    
    // Si une direction est choisie, on met à jour la position du joueur ou de sa voiture
    if (direction) {
      player = { ...player, direction };
      
      if (player.inCar && player.currentCar) {
        const newPosition = moveEntity(player.currentCar, direction, state);
        const updatedCar = { ...player.currentCar, position: newPosition, direction };
        player = { ...player, currentCar: updatedCar };
        
        // Mettre à jour la voiture dans la liste des voitures
        cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
      } else {
        const newPosition = moveEntity(player, direction, state);
        player = { ...player, position: newPosition };
      }
    }
    
    // Tirer
    if (keysPressed.has(' ') && player.hasGun && !player.inCar) {
      const newBullet = playerShoot(player, player.direction);
      bullets = [...bullets, newBullet];
    }
    
    // Entrer/sortir d'une voiture
    if (keysPressed.has('e')) {
      if (player.inCar) {
        // Sortir de la voiture
        const { updatedPlayer, updatedCar } = exitCar(player);
        player = updatedPlayer;
        
        if (updatedCar) {
          cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
        }
      } else {
        // Chercher une voiture à proximité
        const nearbyCar = cars.find(car => !car.driver && detectCollision({
          ...player,
          width: player.width + 20, // Augmenter la zone de détection
          height: player.height + 20
        }, car));
        
        if (nearbyCar) {
          // Voler la voiture
          const { updatedPlayer, updatedCar } = stealCar(player, nearbyCar);
          player = updatedPlayer;
          
          // Mettre à jour le niveau de recherche
          player = updateWantedLevel(player, 'carTheft');
          
          cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
        }
      }
    }
    
    return { ...state, player, bullets, cars };
  }, [keysPressed]);
  
  // Mise à jour du jeu
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        // Sortir si le jeu est terminé
        if (prevState.gameOver) {
          return prevState;
        }
        
        // Traiter les entrées utilisateur
        let updatedState = handleUserInput(prevState);
        
        // Mettre à jour les balles
        let updatedBullets = updatedState.bullets
          .map(bullet => {
            // Déplacer la balle
            const newPosition = moveEntity(bullet, bullet.direction, updatedState);
            const distanceTraveled = bullet.distanceTraveled + bullet.speed;
            
            // Vérifier si la balle a dépassé sa portée
            if (distanceTraveled > bullet.range) {
              return { ...bullet, isAlive: false };
            }
            
            return { 
              ...bullet, 
              position: newPosition, 
              distanceTraveled
            };
          })
          .filter(bullet => bullet.isAlive);
        
        // Détecter les collisions des balles avec d'autres entités
        updatedState.pedestrians.forEach(pedestrian => {
          updatedBullets.forEach(bullet => {
            if (detectCollision(bullet, pedestrian)) {
              // Marquer la balle comme morte
              bullet.isAlive = false;
              
              // Marquer le piéton comme mort
              pedestrian.isAlive = false;
              
              // Augmenter le niveau de recherche du joueur
              if (bullet.shooter.type === 'player') {
                updatedState.player = updateWantedLevel(updatedState.player, 'killing');
              }
            }
          });
        });
        
        // Filtrer les piétons morts
        const updatedPedestrians = updatedState.pedestrians.filter(ped => ped.isAlive);
        
        // Mettre à jour la police
        const updatedPolice = updatedState.police.map(policeman => 
          policeChasePlayer(policeman, updatedState.player)
        ).map(policeman => 
          movePolice(policeman, updatedState)
        );
        
        // Vérifier si le joueur est capturé par la police
        let gameOver = false;
        updatedPolice.forEach(policeman => {
          if (detectCollision(policeman, updatedState.player)) {
            gameOver = true;
          }
        });
        
        return {
          ...updatedState,
          bullets: updatedBullets,
          pedestrians: updatedPedestrians,
          police: updatedPolice,
          gameOver
        };
      });
    }, 1000 / FPS);
    
    return () => clearInterval(gameLoop);
  }, [handleUserInput]);
  
  // Rendu du jeu
  return (
    <div className="w-full h-full flex flex-col items-center">
      <GameHUD wantedLevel={gameState.player.wantedLevel} />
      
      <div 
        className="relative" 
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT, 
          backgroundColor: '#333', 
          overflow: 'hidden'
        }}
      >
        <GameMap width={GAME_WIDTH} height={GAME_HEIGHT} />
        
        {/* Rendu des entités */}
        {gameState.cars.map(car => (
          <CarEntity key={car.id} car={car} />
        ))}
        
        {gameState.pedestrians.map(pedestrian => (
          <PedestrianEntity key={pedestrian.id} pedestrian={pedestrian} />
        ))}
        
        {gameState.police.map(policeman => (
          <PoliceEntity key={policeman.id} police={policeman} />
        ))}
        
        {gameState.bullets.map(bullet => (
          <BulletEntity key={bullet.id} bullet={bullet} />
        ))}
        
        {/* Afficher le joueur uniquement s'il n'est pas dans une voiture */}
        {!gameState.player.inCar && (
          <PlayerEntity player={gameState.player} />
        )}
        
        {/* Affichage de fin de jeu */}
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">BUSTED!</h2>
              <p className="text-xl mb-4">Vous avez été arrêté par la police!</p>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => window.location.reload()}
              >
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-gray-700">
        <p className="text-lg font-semibold">Contrôles:</p>
        <p>WASD ou flèches: Se déplacer</p>
        <p>E: Entrer/Sortir d'une voiture</p>
        <p>Espace: Tirer</p>
      </div>
    </div>
  );
};

export default Game;
