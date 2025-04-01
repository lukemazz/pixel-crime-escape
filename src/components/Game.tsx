
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Player, Car, Police, Pedestrian, Direction, Bullet, WaterBike } from '../types/game';
import { detectCollision, moveEntity, playerShoot, stealCar, exitVehicle, updateWantedLevel, policeChasePlayer, 
  movePolice, generateId, getRandomPosition, getDistance, isInWater, stealWaterBike, moveCar, policeShoot } from '../utils/gameUtils';
import GameMap from './GameMap';
import PlayerEntity from './entities/PlayerEntity';
import PedestrianEntity from './entities/PedestrianEntity';
import PoliceEntity from './entities/PoliceEntity';
import CarEntity from './entities/CarEntity';
import BulletEntity from './entities/BulletEntity';
import WaterBikeEntity from './entities/WaterBikeEntity';
import GameHUD from './GameHUD';
import GameChat from './multiplayer/GameChat';

const GAME_WIDTH = 1600;
const GAME_HEIGHT = 1200;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const FPS = 60;

const Game: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    // Initialize player
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
    
    // Initialize pedestrians with random movement
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
    
    // Initialize police
    const police: Police[] = Array.from({ length: 10 }).map((_, i) => {
      const isInPoliceCar = i < 5; // First 5 police officers are in cars
      return {
        id: `police-${i}`,
        type: 'police',
        position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
        speed: isInPoliceCar ? 1 : 2, // Slower base speed when in car (car has its own speed)
        width: 20,
        height: 20,
        isAlive: true,
        chasing: false,
        detectionRadius: 150,
        patrolPath: Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map(() => 
          getRandomPosition(GAME_WIDTH, GAME_HEIGHT)
        ),
        currentPatrolIndex: 0,
        hasGun: true,
        inCar: isInPoliceCar
      };
    });
    
    // Initialize cars
    const cars: Car[] = Array.from({ length: 15 }).map((_, i) => {
      const car = {
        id: `car-${i}`,
        type: 'car' as const,
        position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
        speed: 0,
        width: 30,
        height: 15,
        isAlive: true,
        color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#FFA500'][Math.floor(Math.random() * 8)],
        driver: null,
        maxSpeed: 5,
        driftFactor: 0.95,
        velocity: { x: 0, y: 0 }
      };
      
      // Assign police officers to police cars
      if (i < 5) {
        car.driver = police[i];
        car.color = '#3333FF'; // Police car color
      }
      
      return car;
    });
    
    // Initialize water bikes near water areas
    const waterLocations = [
      { x: GAME_WIDTH * 0.45, y: GAME_HEIGHT * 0.45 },
      { x: GAME_WIDTH * 0.1, y: GAME_HEIGHT * 0.75 },
      { x: GAME_WIDTH * 0.75, y: GAME_HEIGHT * 0.15 }
    ];
    
    const waterBikes: WaterBike[] = waterLocations.map((loc, i) => ({
      id: `water-bike-${i}`,
      type: 'waterBike',
      position: { x: loc.x, y: loc.y },
      direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
      speed: 0,
      width: 25,
      height: 12,
      isAlive: true,
      color: ['#00AAFF', '#33FFFF', '#66CCFF'][Math.floor(Math.random() * 3)],
      driver: null,
      maxSpeed: 6,
      isInWater: true
    }));
    
    return {
      player,
      pedestrians,
      police,
      cars,
      waterBikes,
      bullets: [],
      score: 0,
      gameOver: false,
      messages: [],  // Chat messages
      camera: {
        x: player.position.x - VIEWPORT_WIDTH / 2,
        y: player.position.y - VIEWPORT_HEIGHT / 2
      },
      showChat: false,
      lastChatTime: 0
    };
  });
  
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  // Update viewport to follow player
  useEffect(() => {
    // Calculate the central position of the viewport based on player position
    let centerX = gameState.player.position.x - VIEWPORT_WIDTH / 2;
    let centerY = gameState.player.position.y - VIEWPORT_HEIGHT / 2;
    
    // Limit viewport within map boundaries
    centerX = Math.max(0, Math.min(centerX, GAME_WIDTH - VIEWPORT_WIDTH));
    centerY = Math.max(0, Math.min(centerY, GAME_HEIGHT - VIEWPORT_HEIGHT));
    
    setViewportPosition({ x: centerX, y: centerY });
  }, [gameState.player.position]);
  
  // Key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open chat with T key
      if (e.key.toLowerCase() === 't' && !showChat) {
        setShowChat(true);
        return;
      }
      
      // If chat is open, don't process other inputs
      if (showChat) {
        // Close chat with ESC
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
  
  // Chat input handling
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setGameState(prevState => ({
        ...prevState,
        messages: [
          ...prevState.messages,
          { sender: prevState.player.name, text: chatMessage, timestamp: new Date().toISOString() }
        ],
        lastChatTime: Date.now(),
        showChat: true
      }));
      setChatMessage("");
      setShowChat(false);
    }
  };
  
  // User input handling
  const handleUserInput = useCallback((state: GameState): GameState => {
    let { player, bullets, cars, waterBikes } = state;
    let direction: Direction | null = null;
    
    // Movement
    if (keysPressed.has('w') || keysPressed.has('arrowup')) direction = 'up';
    else if (keysPressed.has('s') || keysPressed.has('arrowdown')) direction = 'down';
    else if (keysPressed.has('a') || keysPressed.has('arrowleft')) direction = 'left';
    else if (keysPressed.has('d') || keysPressed.has('arrowright')) direction = 'right';
    
    // If a direction is chosen, update player or vehicle position
    if (direction) {
      player = { ...player, direction };
      
      if (player.inCar && player.currentCar) {
        const currentVehicle = player.currentCar;
        
        if (currentVehicle.type === 'car') {
          // Move car with physics
          const car = currentVehicle as Car;
          const { position, velocity } = moveCar(car, direction, state);
          const updatedCar = { ...car, position, velocity, direction };
          player = { ...player, currentCar: updatedCar };
          
          // Update car in the list
          cars = cars.map(c => c.id === updatedCar.id ? updatedCar : c);
        } else if (currentVehicle.type === 'waterBike') {
          // Move water bike
          const waterBike = currentVehicle as WaterBike;
          
          // Only move if in water
          if (isInWater(waterBike.position, state)) {
            const newPosition = moveEntity({ ...waterBike, speed: waterBike.maxSpeed }, direction, state);
            const updatedWaterBike = { ...waterBike, position: newPosition, direction, speed: waterBike.maxSpeed };
            player = { ...player, currentCar: updatedWaterBike };
            
            // Update water bike in the list
            waterBikes = waterBikes.map(wb => wb.id === updatedWaterBike.id ? updatedWaterBike : wb);
          }
        }
      } else {
        const newPosition = moveEntity(player, direction, state);
        player = { ...player, position: newPosition };
      }
    } else if (player.inCar && player.currentCar) {
      // Slow down vehicle if no direction key is pressed
      const currentVehicle = player.currentCar;
      
      if (currentVehicle.type === 'car') {
        // Apply car deceleration
        const car = currentVehicle as Car;
        const { position, velocity } = moveCar(car, null, state);
        const updatedCar = { ...car, position, velocity };
        player = { ...player, currentCar: updatedCar };
        cars = cars.map(c => c.id === updatedCar.id ? updatedCar : c);
      } else if (currentVehicle.type === 'waterBike') {
        // Slow down water bike
        const waterBike = currentVehicle as WaterBike;
        const updatedWaterBike = { ...waterBike, speed: Math.max(0, waterBike.speed - 0.2) };
        player = { ...player, currentCar: updatedWaterBike };
        waterBikes = waterBikes.map(wb => wb.id === updatedWaterBike.id ? updatedWaterBike : wb);
      }
    }
    
    // Shooting
    if (keysPressed.has(' ') && player.hasGun && !player.inCar) {
      // Limit firing rate
      const now = Date.now();
      const lastBulletTime = state.bullets[state.bullets.length - 1]?.timestamp || 0;
      
      if (now - lastBulletTime > 200) { // 200ms between shots
        const newBullet = playerShoot(player, player.direction);
        bullets = [...bullets, { ...newBullet, timestamp: now }];
      }
    }
    
    // Enter/exit vehicle
    if (keysPressed.has('e')) {
      // Add check to avoid processing multiple presses of E key
      const now = Date.now();
      const lastActionTime = state.lastActionTime || 0;
      
      if (now - lastActionTime > 500) { // 500ms between actions
        if (player.inCar) {
          // Exit vehicle
          const { updatedPlayer, updatedVehicle } = exitVehicle(player);
          player = updatedPlayer;
          
          if (updatedVehicle) {
            if (updatedVehicle.type === 'car') {
              cars = cars.map(car => car.id === updatedVehicle.id ? updatedVehicle as Car : car);
            } else if (updatedVehicle.type === 'waterBike') {
              waterBikes = waterBikes.map(wb => wb.id === updatedVehicle.id ? updatedVehicle as WaterBike : wb);
            }
          }
        } else {
          // Look for nearby vehicle
          // First check for cars
          const nearbyCar = cars.find(car => !car.driver && detectCollision({
            ...player,
            width: player.width + 20, // Increase detection zone
            height: player.height + 20
          }, car));
          
          if (nearbyCar) {
            // Steal car
            const { updatedPlayer, updatedCar } = stealCar(player, nearbyCar);
            player = updatedPlayer;
            
            // Update wanted level
            player = updateWantedLevel(player, 'carTheft');
            
            cars = cars.map(car => car.id === updatedCar.id ? updatedCar : car);
          } else {
            // Check for water bikes
            const nearbyWaterBike = waterBikes.find(wb => !wb.driver && detectCollision({
              ...player,
              width: player.width + 20,
              height: player.height + 20
            }, wb));
            
            if (nearbyWaterBike) {
              // Can only use water bike if player is in water
              if (isInWater(player.position, state)) {
                const { updatedPlayer, updatedWaterBike } = stealWaterBike(player, nearbyWaterBike);
                player = updatedPlayer;
                waterBikes = waterBikes.map(wb => wb.id === updatedWaterBike.id ? updatedWaterBike : wb);
              } else {
                // Add message that water bikes can only be used in water
                state.messages.push({
                  sender: 'System',
                  text: 'Water bikes can only be used in water!',
                  timestamp: new Date().toISOString(),
                  type: 'system'
                });
                state.lastChatTime = Date.now();
                state.showChat = true;
              }
            }
          }
        }
        
        // Update last action time
        return { ...state, player, bullets, cars, waterBikes, lastActionTime: now };
      }
    }
    
    return { ...state, player, bullets, cars, waterBikes };
  }, [keysPressed]);
  
  // Update pedestrian AI
  const updatePedestrians = useCallback((pedestrians: Pedestrian[], gameState: GameState): Pedestrian[] => {
    return pedestrians.map(pedestrian => {
      if (!pedestrian.isAlive) return pedestrian;
      
      // Change direction occasionally
      const now = Date.now();
      const changeDirectionInterval = 2000 + Math.random() * 3000; // 2-5 seconds
      
      let direction = pedestrian.direction;
      let newPosition = { ...pedestrian.position };
      
      // If pedestrian has waypoints, follow them
      if (pedestrian.waypoints && pedestrian.waypoints.length > 0) {
        const currentWaypoint = pedestrian.waypoints[pedestrian.currentWaypoint];
        const distToWaypoint = getDistance(pedestrian.position, currentWaypoint);
        
        // If close enough to waypoint, go to next
        if (distToWaypoint < 20) {
          pedestrian.currentWaypoint = (pedestrian.currentWaypoint + 1) % pedestrian.waypoints.length;
        } else {
          // Calculate direction to waypoint
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
      
      // Move pedestrian
      newPosition = moveEntity({ ...pedestrian, direction }, direction, gameState);
      
      return {
        ...pedestrian,
        position: newPosition,
        direction,
        lastDirectionChange: pedestrian.lastDirectionChange
      };
    });
  }, []);
  
  // Game update
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        // Exit if game is over
        if (prevState.gameOver) {
          return prevState;
        }
        
        // Handle chat timeout (hide chat after 3 seconds)
        let showChat = prevState.showChat;
        if (showChat && prevState.lastChatTime && Date.now() - prevState.lastChatTime > 3000) {
          showChat = false;
        }
        
        // Process user input
        let updatedState = { ...handleUserInput(prevState), showChat };
        
        // Update pedestrians
        const updatedPedestrians = updatePedestrians(updatedState.pedestrians, updatedState);
        
        // Update bullets
        let updatedBullets = updatedState.bullets
          .map(bullet => {
            // Move bullet
            const newPosition = moveEntity(bullet, bullet.direction, updatedState);
            const distanceTraveled = bullet.distanceTraveled + bullet.speed;
            
            // Check if bullet has exceeded range
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
        
        // Detect bullet collisions with entities
        // First, pedestrians
        updatedPedestrians.forEach(pedestrian => {
          if (!pedestrian.isAlive) return;
          
          updatedBullets.forEach(bullet => {
            if (detectCollision(bullet, pedestrian)) {
              // Mark bullet as dead
              bullet.isAlive = false;
              
              // Mark pedestrian as dead
              pedestrian.isAlive = false;
              
              // Increase player's wanted level
              if (bullet.shooter.type === 'player') {
                updatedState.player = updateWantedLevel(updatedState.player, 'killing');
                
                // Add system message
                updatedState.messages.push({
                  sender: 'System',
                  text: `${updatedState.player.name} killed a pedestrian! Wanted level increased.`,
                  timestamp: new Date().toISOString(),
                  type: 'system'
                });
                updatedState.lastChatTime = Date.now();
                updatedState.showChat = true;
              }
            }
          });
          
          // Check for collisions with cars (pedestrians run over by cars)
          updatedState.cars.forEach(car => {
            if (car.driver && car.velocity && (Math.abs(car.velocity.x) > 1 || Math.abs(car.velocity.y) > 1)) {
              if (detectCollision(car, pedestrian)) {
                // Mark pedestrian as dead
                pedestrian.isAlive = false;
                
                // Increase player's wanted level if player is driving
                if (car.driver.type === 'player') {
                  updatedState.player = updateWantedLevel(updatedState.player, 'killing');
                  
                  // Add system message
                  updatedState.messages.push({
                    sender: 'System',
                    text: `${updatedState.player.name} ran over a pedestrian! Wanted level increased.`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                  });
                  updatedState.lastChatTime = Date.now();
                  updatedState.showChat = true;
                }
              }
            }
          });
        });
        
        // Check bullet collisions with police
        updatedState.police.forEach(policeman => {
          if (!policeman.isAlive) return;
          
          updatedBullets.forEach(bullet => {
            if (bullet.shooter.type === 'player' && detectCollision(bullet, policeman)) {
              // Mark bullet as dead
              bullet.isAlive = false;
              
              // Mark police as dead
              policeman.isAlive = false;
              
              // Significantly increase player's wanted level
              updatedState.player = updateWantedLevel(updatedState.player, 'policeShooting');
              
              // Add system message
              updatedState.messages.push({
                sender: 'System',
                text: `${updatedState.player.name} shot a police officer! Wanted level greatly increased!`,
                timestamp: new Date().toISOString(),
                type: 'system'
              });
              updatedState.lastChatTime = Date.now();
              updatedState.showChat = true;
            }
          });
        });
        
        // Check bullet collisions with player
        if (updatedState.player.isAlive) {
          updatedBullets.forEach(bullet => {
            if (bullet.shooter.type !== 'player' && detectCollision(bullet, updatedState.player)) {
              // Mark bullet as dead
              bullet.isAlive = false;
              
              // Player takes damage, game over if shot by police
              if (bullet.shooter.type === 'police') {
                updatedState.gameOver = true;
                
                // Add system message
                updatedState.messages.push({
                  sender: 'System',
                  text: `${updatedState.player.name} was shot by the police! GAME OVER!`,
                  timestamp: new Date().toISOString(),
                  type: 'system'
                });
                updatedState.lastChatTime = Date.now();
                updatedState.showChat = true;
              }
            }
          });
        }
        
        // Filter out dead pedestrians
        const alivePedestrians = updatedPedestrians.filter(ped => ped.isAlive);
        
        // Spawn new pedestrians if there are few
        let finalPedestrians = [...alivePedestrians];
        if (alivePedestrians.length < 15) {
          // Add new pedestrians
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
        
        // Update police
        const updatedPolice = updatedState.police
          .filter(policeman => policeman.isAlive)
          .map(policeman => policeChasePlayer(policeman, updatedState.player))
          .map(policeman => {
            const updatedPoliceman = movePolice(policeman, updatedState);
            
            // Police shooting
            if (
              updatedPoliceman.hasGun && 
              updatedPoliceman.chasing && 
              updatedPoliceman.target &&
              updatedPoliceman.lastShot !== undefined &&
              updatedPoliceman.lastShot !== policeman.lastShot // Check if shooting cooldown was reset in movePolice
            ) {
              const newBullet = policeShoot(updatedPoliceman, updatedPoliceman.target.position);
              updatedBullets.push(newBullet);
            }
            
            return updatedPoliceman;
          });
        
        // Check if player is captured by police
        let gameOver = updatedState.gameOver;
        if (!gameOver) {
          updatedPolice.forEach(policeman => {
            if (detectCollision(policeman, updatedState.player)) {
              gameOver = true;
              
              // Add system message
              updatedState.messages.push({
                sender: 'System',
                text: `${updatedState.player.name} was caught by the police! BUSTED!`,
                timestamp: new Date().toISOString(),
                type: 'system'
              });
              updatedState.lastChatTime = Date.now();
              updatedState.showChat = true;
            }
          });
        }
        
        // Update camera
        const playerX = updatedState.player.position.x;
        const playerY = updatedState.player.position.y;
        
        let cameraX = playerX - VIEWPORT_WIDTH / 2;
        let cameraY = playerY - VIEWPORT_HEIGHT / 2;
        
        // Mantieni la camera all'interno dei limiti della mappa
        cameraX = Math.max(0, Math.min(cameraX, GAME_WIDTH - VIEWPORT_WIDTH));
        cameraY = Math.max(0, Math.min(cameraY, GAME_HEIGHT - VIEWPORT_HEIGHT));
        
        // Spawn new police if too few
        if (updatedPolice.length < 5) {
          const newPolice = Array.from({ length: 10 - updatedPolice.length }).map(() => {
            const isInPoliceCar = Math.random() > 0.5;
            const police: Police = {
              id: `police-${generateId()}`,
              type: 'police',
              position: getRandomPosition(GAME_WIDTH, GAME_HEIGHT),
              direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as Direction,
              speed: isInPoliceCar ? 1 : 2,
              width: 20,
              height: 20,
              isAlive: true,
              chasing: false,
              detectionRadius: 150,
              patrolPath: Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map(() => 
                getRandomPosition(GAME_WIDTH, GAME_HEIGHT)
              ),
              currentPatrolIndex: 0,
              hasGun: true,
              inCar: isInPoliceCar
            };
            
            // Add police car if needed
            if (isInPoliceCar) {
              const car: Car = {
                id: `police-car-${generateId()}`,
                type: 'car',
                position: { ...police.position },
                direction: police.direction,
                speed: 0,
                width: 30,
                height: 15,
                isAlive: true,
                color: '#3333FF', // Police car color
                driver: police,
                maxSpeed: 6,
                driftFactor: 0.95,
                velocity: { x: 0, y: 0 }
              };
              updatedState.cars.push(car);
            }
            
            return police;
          });
          
          updatedState.police = [...updatedPolice, ...newPolice];
        } else {
          updatedState.police = updatedPolice;
        }
        
        return {
          ...updatedState,
          bullets: updatedBullets,
          pedestrians: finalPedestrians,
          gameOver,
          camera: { x: cameraX, y: cameraY },
          showChat
        };
      });
    }, 1000 / FPS);
    
    return () => clearInterval(gameLoop);
  }, [handleUserInput, updatePedestrians]);
  
  // Calculate relative positions to viewport
  const getRelativePosition = (position: { x: number, y: number }) => {
    return {
      x: position.x - viewportPosition.x,
      y: position.y - viewportPosition.y
    };
  };
  
  // Check if an entity is visible in viewport
  const isEntityVisible = (entity: { position: { x: number, y: number }, width: number, height: number }) => {
    return (
      entity.position.x + entity.width >= viewportPosition.x &&
      entity.position.x <= viewportPosition.x + VIEWPORT_WIDTH &&
      entity.position.y + entity.height >= viewportPosition.y &&
      entity.position.y <= viewportPosition.y + VIEWPORT_HEIGHT
    );
  };
  
  // Game rendering
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
          
          {/* Render water bikes */}
          {gameState.waterBikes.filter(isEntityVisible).map(waterBike => (
            <WaterBikeEntity key={waterBike.id} waterBike={waterBike} />
          ))}
          
          {/* Render cars */}
          {gameState.cars.filter(isEntityVisible).map(car => (
            <CarEntity key={car.id} car={car} />
          ))}
          
          {/* Render pedestrians */}
          {gameState.pedestrians.filter(isEntityVisible).map(pedestrian => (
            <PedestrianEntity key={pedestrian.id} pedestrian={pedestrian} />
          ))}
          
          {/* Render police */}
          {gameState.police.filter(p => !p.inCar && isEntityVisible(p)).map(policeman => (
            <PoliceEntity key={policeman.id} police={policeman} />
          ))}
          
          {/* Render bullets */}
          {gameState.bullets.filter(isEntityVisible).map(bullet => (
            <BulletEntity key={bullet.id} bullet={bullet} />
          ))}
          
          {/* Show player only if not in vehicle */}
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
                placeholder="Write a message..."
                autoFocus
              />
              <button 
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                Send
              </button>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        {gameState.showChat && (
          <GameChat messages={gameState.messages} />
        )}
        
        {/* Game over display */}
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="text-white text-center">
              <h2 className="text-4xl font-bold mb-4">BUSTED!</h2>
              <p className="text-xl mb-4">You were caught by the police!</p>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-gray-200 bg-gray-800 p-4 rounded-lg">
        <p className="text-lg font-semibold">Controls:</p>
        <p>WASD or arrows: Movement</p>
        <p>E: Enter/Exit vehicle</p>
        <p>Space: Shoot</p>
        <p>T: Open chat</p>
      </div>
    </div>
  );
};

export default Game;
