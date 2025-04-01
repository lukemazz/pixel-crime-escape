
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, Car, Police, Pedestrian, Direction, Bullet } from '../types/game';
import { detectCollision, moveEntity, playerShoot, stealCar, exitCar, updateWantedLevel, policeChasePlayer, movePolice, generateId, getRandomPosition } from '../utils/gameUtils';
import GameMap from './GameMap';
import PlayerEntity from './entities/PlayerEntity';
import PedestrianEntity from './entities/PedestrianEntity';
import PoliceEntity from './entities/PoliceEntity';
import CarEntity from './entities/CarEntity';
import BulletEntity from './entities/BulletEntity';
import GameHUD from './GameHUD';
import GameChat from './multiplayer/GameChat';

const GAME_WIDTH = 1600;  // Mappa più grande
const GAME_HEIGHT = 1200; // Mappa più grande
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const FPS = 60;

const Game: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
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
      hasGun: true,
      name: 'Player 1'
    };
    
    // Initialiser les piétons avec mouvement aléatoire
    const pedestrians: Pedestrian[] = Array.from({ length: 20 }).map((_, i) => ({
      id: `pedestrian-${i}`,
      type: 'pedestrian',
      position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 1 + Math.random(),
      width: 15,
      height: 15,
      isAlive: true,
      isHostile: Math.random() > 0.8,
      waypoints: Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map(() => 
        getRandomPosition(GAME_WIDTH, GAME_HEIGHT)
      ),
      currentWaypoint: 0,
      lastDirectionChange: Date.now()
    }));
    
    // Initialiser la police
    const police: Police[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `police-${i}`,
      type: 'police',
      position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 2,
      width: 20,
      height: 20,
      isAlive: true,
      chasing: false,
      detectionRadius: 150,
      patrolPath: Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map(() => 
        getRandomPosition(GAME_WIDTH, GAME_HEIGHT)
      ),
      currentPatrolIndex: 0
    }));
    
    // Initialiser les voitures
    const cars: Car[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `car-${i}`,
      type: 'car',
      position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 0,
      width: 30,
      height: 15,
      isAlive: true,
      color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#FFA500'][Math.floor(Math.random() * 8)],
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
      gameOver: false,
      messages: [],  // Chat messages
      camera: {
        x: player.position.x - VIEWPORT_WIDTH / 2,
        y: player.position.y - VIEWPORT_HEIGHT / 2
      }
    };
  });
  
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  // Aggiorna la viewport per seguire il giocatore
  useEffect(() => {
    // Calcola la posizione centrale della viewport basata sulla posizione del giocatore
    let centerX = gameState.player.position.x - VIEWPORT_WIDTH / 2;
    let centerY = gameState.player.position.y - VIEWPORT_HEIGHT / 2;
    
    // Limita la viewport entro i limiti della mappa
    centerX = Math.max(0, Math.min(centerX, GAME_WIDTH - VIEWPORT_WIDTH));
    centerY = Math.max(0, Math.min(centerY, GAME_HEIGHT - VIEWPORT_HEIGHT));
    
    setViewportPosition({ x: centerX, y: centerY });
  }, [gameState.player.position]);
  
  // Gestionnaire de touches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Apri la chat con il tasto T
      if (e.key.toLowerCase() === 't' && !showChat) {
        setShowChat(true);
        return;
      }
      
      // Se la chat è aperta, non processare altri input
      if (showChat) {
        // Chiudi la chat con ESC
        if (e.key === 'Escape') {
          setShowChat(false);
          setChatMessage("");
        }
        return;
      }
      
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
  }, [showChat]);
  
  // Gestione delle input di chat
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setGameState(prevState => ({
        ...prevState,
        messages: [
          ...prevState.messages,
          { sender: prevState.player.name, text: chatMessage, timestamp: new Date().toISOString() }
        ]
      }));
      setChatMessage("");
      setShowChat(false);
    }
  };
  
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
        const newPosition = moveEntity({ ...player.currentCar, speed: player.currentCar.maxSpeed }, direction, state);
        const updatedCar = { ...player.currentCar, position: newPosition, direction, speed: player.currentCar.maxSpeed };
        player = { ...player, currentCar: updatedCar };
        
        // Mettre à jour la voiture dans la liste des voitures
        cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
      } else {
        const newPosition = moveEntity(player, direction, state);
        player = { ...player, position: newPosition };
      }
    } else if (player.inCar && player.currentCar) {
      // Rallenta la macchina se non si preme nessun tasto di direzione
      const updatedCar = { ...player.currentCar, speed: Math.max(0, player.currentCar.speed - 0.2) };
      player = { ...player, currentCar: updatedCar };
      cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
    }
    
    // Tirer
    if (keysPressed.has(' ') && player.hasGun && !player.inCar) {
      // Limita la frequenza di fuoco
      const now = Date.now();
      const lastBulletTime = state.bullets[state.bullets.length - 1]?.timestamp || 0;
      
      if (now - lastBulletTime > 200) { // 200ms tra ogni colpo
        const newBullet = playerShoot(player, player.direction);
        bullets = [...bullets, { ...newBullet, timestamp: now }];
      }
    }
    
    // Entrer/sortir d'une voiture
    if (keysPressed.has('e')) {
      // Aggiungi un controllo per evitare di processare la pressione multipla del tasto E
      const now = Date.now();
      const lastActionTime = state.lastActionTime || 0;
      
      if (now - lastActionTime > 500) { // 500ms tra ogni azione
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
        
        // Aggiorna l'ultimo tempo di azione
        return { ...state, player, bullets, cars, lastActionTime: now };
      }
    }
    
    return { ...state, player, bullets, cars };
  }, [keysPressed]);
  
  // Aggiorna l'AI dei pedoni
  const updatePedestrians = useCallback((pedestrians: Pedestrian[], gameState: GameState): Pedestrian[] => {
    return pedestrians.map(pedestrian => {
      if (!pedestrian.isAlive) return pedestrian;
      
      // Cambia direzione ogni tanto
      const now = Date.now();
      const changeDirectionInterval = 2000 + Math.random() * 3000; // 2-5 secondi
      
      let direction = pedestrian.direction;
      let newPosition = { ...pedestrian.position };
      
      // Se il pedone ha waypoints, segui quelli
      if (pedestrian.waypoints && pedestrian.waypoints.length > 0) {
        const currentWaypoint = pedestrian.waypoints[pedestrian.currentWaypoint];
        const distToWaypoint = getDistance(pedestrian.position, currentWaypoint);
        
        // Se siamo abbastanza vicini al waypoint, vai al prossimo
        if (distToWaypoint < 20) {
          pedestrian.currentWaypoint = (pedestrian.currentWaypoint + 1) % pedestrian.waypoints.length;
        } else {
          // Calcola la direzione verso il waypoint
          if (Math.abs(currentWaypoint.x - pedestrian.position.x) > Math.abs(currentWaypoint.y - pedestrian.position.y)) {
            direction = currentWaypoint.x > pedestrian.position.x ? 'right' : 'left';
          } else {
            direction = currentWaypoint.y > pedestrian.position.y ? 'down' : 'up';
          }
        }
      } 
      // Altrimenti cambia direzione casualmente
      else if (now - pedestrian.lastDirectionChange > changeDirectionInterval) {
        direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction;
        pedestrian.lastDirectionChange = now;
      }
      
      // Muovi il pedone
      newPosition = moveEntity({ ...pedestrian, direction }, direction, gameState);
      
      return {
        ...pedestrian,
        position: newPosition,
        direction,
        lastDirectionChange: pedestrian.lastDirectionChange
      };
    });
  }, []);
  
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
        
        // Aggiorna i pedoni
        const updatedPedestrians = updatePedestrians(updatedState.pedestrians, updatedState);
        
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
        updatedPedestrians.forEach(pedestrian => {
          updatedBullets.forEach(bullet => {
            if (detectCollision(bullet, pedestrian)) {
              // Marquer la balle comme morte
              bullet.isAlive = false;
              
              // Marquer le piéton comme mort
              pedestrian.isAlive = false;
              
              // Augmenter le niveau de recherche du joueur
              if (bullet.shooter.type === 'player') {
                updatedState.player = updateWantedLevel(updatedState.player, 'killing');
                
                // Aggiungi un messaggio di sistema
                updatedState.messages.push({
                  sender: 'Sistema',
                  text: `${updatedState.player.name} ha ucciso un pedone! Livello di ricerca aumentato.`,
                  timestamp: new Date().toISOString(),
                  type: 'system'
                });
              }
            }
          });
        });
        
        // Filtrer les piétons morts
        const alivePedestrians = updatedPedestrians.filter(ped => ped.isAlive);
        
        // Spawn di nuovi pedoni se ce ne sono pochi
        let finalPedestrians = [...alivePedestrians];
        if (alivePedestrians.length < 15) {
          // Aggiungi nuovi pedoni
          const numNewPedestrians = Math.min(3, 15 - alivePedestrians.length);
          
          for (let i = 0; i < numNewPedestrians; i++) {
            finalPedestrians.push({
              id: `pedestrian-${generateId()}`,
              type: 'pedestrian',
              position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
              direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
              speed: 1 + Math.random(),
              width: 15,
              height: 15,
              isAlive: true,
              isHostile: Math.random() > 0.8,
              waypoints: Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map(() => 
                getRandomPosition(GAME_WIDTH, GAME_HEIGHT)
              ),
              currentWaypoint: 0,
              lastDirectionChange: Date.now()
            });
          }
        }
        
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
        
        // Aggiorna la camera
        const playerX = updatedState.player.position.x;
        const playerY = updatedState.player.position.y;
        
        let cameraX = playerX - VIEWPORT_WIDTH / 2;
        let cameraY = playerY - VIEWPORT_HEIGHT / 2;
        
        // Mantieni la camera all'interno dei limiti della mappa
        cameraX = Math.max(0, Math.min(cameraX, GAME_WIDTH - VIEWPORT_WIDTH));
        cameraY = Math.max(0, Math.min(cameraY, GAME_HEIGHT - VIEWPORT_HEIGHT));
        
        return {
          ...updatedState,
          bullets: updatedBullets,
          pedestrians: finalPedestrians,
          police: updatedPolice,
          gameOver,
          camera: { x: cameraX, y: cameraY }
        };
      });
    }, 1000 / FPS);
    
    return () => clearInterval(gameLoop);
  }, [handleUserInput, updatePedestrians]);
  
  // Calcola le posizioni relative alla viewport
  const getRelativePosition = (position: { x: number, y: number }) => {
    return {
      x: position.x - viewportPosition.x,
      y: position.y - viewportPosition.y
    };
  };
  
  // Verifica se un'entità è visibile nella viewport
  const isEntityVisible = (entity: { position: { x: number, y: number }, width: number, height: number }) => {
    return (
      entity.position.x + entity.width >= viewportPosition.x &&
      entity.position.x <= viewportPosition.x + VIEWPORT_WIDTH &&
      entity.position.y + entity.height >= viewportPosition.y &&
      entity.position.y <= viewportPosition.y + VIEWPORT_HEIGHT
    );
  };
  
  // Rendu du jeu
  return (
    <div className="w-full h-full flex flex-col items-center">
      <GameHUD wantedLevel={gameState.player.wantedLevel} />
      
      <div 
        ref={gameContainerRef}
        className="relative" 
        style={{ 
          width: VIEWPORT_WIDTH, 
          height: VIEWPORT_HEIGHT, 
          backgroundColor: '#333', 
          overflow: 'hidden'
        }}
      >
        <div 
          className="absolute" 
          style={{ 
            width: GAME_WIDTH, 
            height: GAME_HEIGHT, 
            transform: `translate(${-viewportPosition.x}px, ${-viewportPosition.y}px)`
          }}
        >
          <GameMap width={GAME_WIDTH} height={GAME_HEIGHT} />
          
          {/* Rendu des entités */}
          {gameState.cars.filter(isEntityVisible).map(car => (
            <CarEntity key={car.id} car={car} />
          ))}
          
          {gameState.pedestrians.filter(isEntityVisible).map(pedestrian => (
            <PedestrianEntity key={pedestrian.id} pedestrian={pedestrian} />
          ))}
          
          {gameState.police.filter(isEntityVisible).map(policeman => (
            <PoliceEntity key={policeman.id} police={policeman} />
          ))}
          
          {gameState.bullets.filter(isEntityVisible).map(bullet => (
            <BulletEntity key={bullet.id} bullet={bullet} />
          ))}
          
          {/* Afficher le joueur uniquement s'il n'est pas dans une voiture */}
          {!gameState.player.inCar && (
            <PlayerEntity player={gameState.player} />
          )}
        </div>
        
        {/* Chat UI */}
        {showChat && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-2 z-50">
            <div className="flex">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-grow bg-gray-800 text-white p-2 rounded-l"
                placeholder="Scrivi un messaggio..."
                autoFocus
              />
              <button 
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                Invia
              </button>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        <GameChat messages={gameState.messages} />
        
        {/* Affichage de fin de jeu */}
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
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
      
      <div className="mt-4 text-gray-200 bg-gray-800 p-4 rounded-lg">
        <p className="text-lg font-semibold">Contrôles:</p>
        <p>WASD o frecce: Movimento</p>
        <p>E: Entra/Esci da un'auto</p>
        <p>Spazio: Spara</p>
        <p>T: Apri chat</p>
      </div>
    </div>
  );
};

export default Game;
