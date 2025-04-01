import { Position, Entity, Direction, GameState, Car, Player, Police, Pedestrian, Bullet, WaterBike } from '../types/game';

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Detect collision between two entities
export const detectCollision = (entity1: Entity, entity2: Entity): boolean => {
  return (
    entity1.position.x < entity2.position.x + entity2.width &&
    entity1.position.x + entity1.width > entity2.position.x &&
    entity1.position.y < entity2.position.y + entity2.height &&
    entity1.position.y + entity1.height > entity2.position.y
  );
};

// Calculate distance between two positions
export const getDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

// Generate a random position within the map
export const getRandomPosition = (mapWidth: number, mapHeight: number): Position => {
  return {
    x: Math.random() * (mapWidth - 40) + 20,
    y: Math.random() * (mapHeight - 40) + 20
  };
};

// Check if a position is in water
export const isInWater = (position: Position, gameState: GameState): boolean => {
  // Define water areas (same as in GameMap component)
  const waters = [
    { x: 1600 * 0.4, y: 1200 * 0.4, width: 1600 * 0.2, height: 1200 * 0.2 },
    { x: 1600 * 0.05, y: 1200 * 0.7, width: 1600 * 0.15, height: 1200 * 0.2 },
    { x: 1600 * 0.7, y: 1200 * 0.1, width: 1600 * 0.2, height: 1200 * 0.15 }
  ];
  
  // Check if the position is in any water area
  return waters.some(water => 
    position.x >= water.x && 
    position.x <= water.x + water.width && 
    position.y >= water.y && 
    position.y <= water.y + water.height
  );
};

// Move an entity in a direction with physics improvements
export const moveEntity = (entity: Entity, direction: Direction, gameState: GameState): Position => {
  const newPosition = { ...entity.position };
  
  // Get the effective speed
  const effectiveSpeed = entity.speed;
  
  // Apply direction-based movement
  switch (direction) {
    case 'up':
      newPosition.y -= effectiveSpeed;
      break;
    case 'down':
      newPosition.y += effectiveSpeed;
      break;
    case 'left':
      newPosition.x -= effectiveSpeed;
      break;
    case 'right':
      newPosition.x += effectiveSpeed;
      break;
  }
  
  // Map boundaries
  const GAME_WIDTH = 1600;
  const GAME_HEIGHT = 1200;
  
  // Keep the entity within map boundaries
  newPosition.x = Math.max(0, Math.min(newPosition.x, GAME_WIDTH - entity.width));
  newPosition.y = Math.max(0, Math.min(newPosition.y, GAME_HEIGHT - entity.height));
  
  // For water bikes, check if they're in water
  if (entity.type === 'waterBike') {
    const waterBike = entity as WaterBike;
    // Only allow water bikes to move in water
    if (!isInWater(newPosition, gameState)) {
      return entity.position; // Stay in place if trying to leave water
    }
  }
  
  // Check for collisions with buildings (simplified)
  const willCollide = false; // To be implemented with real collision logic
  
  if (!willCollide) {
    return newPosition;
  }
  
  return entity.position;
};

// Move a car with drift physics
export const moveCar = (car: Car, direction: Direction, gameState: GameState): { position: Position, velocity: { x: number, y: number } } => {
  // Get current velocity
  let velX = car.velocity.x;
  let velY = car.velocity.y;
  
  // Apply acceleration based on direction
  const acceleration = 0.2;
  const maxSpeed = car.maxSpeed;
  const driftFactor = car.driftFactor || 0.95; // How much the car maintains momentum
  
  // Apply acceleration in the direction of movement
  switch (direction) {
    case 'up':
      velY -= acceleration;
      break;
    case 'down':
      velY += acceleration;
      break;
    case 'left':
      velX -= acceleration;
      break;
    case 'right':
      velX += acceleration;
      break;
  }
  
  // Apply drift (car maintains some of its previous direction)
  // When no key is pressed, this gradually slows the car down
  if (!direction) {
    velX *= 0.9; // Slow down faster when no key is pressed
    velY *= 0.9;
  } else {
    // Apply some drift when turning
    velX *= driftFactor;
    velY *= driftFactor;
  }
  
  // Limit maximum speed
  const currentSpeed = Math.sqrt(velX * velX + velY * velY);
  if (currentSpeed > maxSpeed) {
    velX = (velX / currentSpeed) * maxSpeed;
    velY = (velY / currentSpeed) * maxSpeed;
  }
  
  // Calculate new position
  const newPosition = {
    x: car.position.x + velX,
    y: car.position.y + velY
  };
  
  // Map boundaries
  const GAME_WIDTH = 1600;
  const GAME_HEIGHT = 1200;
  
  // Keep the car within map boundaries
  newPosition.x = Math.max(0, Math.min(newPosition.x, GAME_WIDTH - car.width));
  newPosition.y = Math.max(0, Math.min(newPosition.y, GAME_HEIGHT - car.height));
  
  // Check for collisions with buildings (simplified)
  const willCollide = false; // To be implemented with real collision logic
  
  if (willCollide) {
    // Bounce off walls
    return { position: car.position, velocity: { x: -velX * 0.5, y: -velY * 0.5 } };
  }
  
  return { position: newPosition, velocity: { x: velX, y: velY } };
};

// Player shoots
export const playerShoot = (player: Player, direction: Direction): Bullet => {
  const bulletSpeed = 8;
  const bulletPosition = { ...player.position };
  
  // Adjust bullet starting position based on direction
  switch (direction) {
    case 'up':
      bulletPosition.y -= player.height / 2;
      break;
    case 'down':
      bulletPosition.y += player.height / 2;
      break;
    case 'left':
      bulletPosition.x -= player.width / 2;
      break;
    case 'right':
      bulletPosition.x += player.width / 2;
      break;
  }
  
  return {
    id: generateId(),
    type: 'bullet',
    position: bulletPosition,
    direction,
    speed: bulletSpeed,
    width: 6,
    height: 6,
    isAlive: true,
    shooter: player,
    damage: 1,
    range: 200,
    distanceTraveled: 0
  };
};

// Police shoots at player
export const policeShoot = (police: Police, targetPosition: Position): Bullet => {
  const bulletSpeed = 8;
  const bulletPosition = { ...police.position };
  
  // Calculate direction toward player
  let direction: Direction;
  if (Math.abs(targetPosition.x - police.position.x) > Math.abs(targetPosition.y - police.position.y)) {
    direction = targetPosition.x > police.position.x ? 'right' : 'left';
  } else {
    direction = targetPosition.y > police.position.y ? 'down' : 'up';
  }
  
  // Adjust bullet starting position based on direction
  switch (direction) {
    case 'up':
      bulletPosition.y -= police.height / 2;
      break;
    case 'down':
      bulletPosition.y += police.height / 2;
      break;
    case 'left':
      bulletPosition.x -= police.width / 2;
      break;
    case 'right':
      bulletPosition.x += police.width / 2;
      break;
  }
  
  return {
    id: generateId(),
    type: 'bullet',
    position: bulletPosition,
    direction,
    speed: bulletSpeed,
    width: 6,
    height: 6,
    isAlive: true,
    shooter: police,
    damage: 1,
    range: 150 + police.target.wantedLevel * 20, // Range increases with wanted level
    distanceTraveled: 0
  };
};

// Steal a car
export const stealCar = (player: Player, car: Car): { updatedPlayer: Player, updatedCar: Car } => {
  // Position the player correctly inside the car
  const updatedPlayer = { 
    ...player, 
    inCar: true, 
    currentCar: car,
    position: { ...car.position } // Player positions at the center of the car
  };
  
  const updatedCar = { 
    ...car, 
    driver: player,
    speed: 0, // Car starts from stopped when stolen
    velocity: { x: 0, y: 0 }, // Reset velocity
    driftFactor: 0.95 // Add drift factor
  };
  
  return { updatedPlayer, updatedCar };
};

// Steal a water bike
export const stealWaterBike = (player: Player, waterBike: WaterBike): { updatedPlayer: Player, updatedWaterBike: WaterBike } => {
  // Position the player correctly on the water bike
  const updatedPlayer = { 
    ...player, 
    inCar: true, // Reuse inCar flag for simplicity
    currentCar: waterBike, // Reuse currentCar for simplicity
    position: { ...waterBike.position } // Player positions at the center of the water bike
  };
  
  const updatedWaterBike = { 
    ...waterBike, 
    driver: player,
    speed: 0 // Water bike starts from stopped when stolen
  };
  
  return { updatedPlayer, updatedWaterBike };
};

// Exit a vehicle (car or water bike)
export const exitVehicle = (player: Player): { updatedPlayer: Player, updatedVehicle: Car | WaterBike | null } => {
  if (!player.currentCar) {
    return { updatedPlayer: player, updatedVehicle: null };
  }
  
  const vehicle = player.currentCar;
  let updatedVehicle = null;
  
  // Position the player next to the vehicle based on direction
  let exitPosition = { ...vehicle.position };
  
  switch (vehicle.direction) {
    case 'up':
      exitPosition.x += vehicle.width + 5;
      break;
    case 'down':
      exitPosition.x -= player.width + 5;
      break;
    case 'left':
      exitPosition.y += vehicle.height + 5;
      break;
    case 'right':
      exitPosition.y -= player.height + 5;
      break;
  }
  
  const updatedPlayer = { 
    ...player, 
    inCar: false, 
    currentCar: null,
    position: exitPosition
  };
  
  if (vehicle.type === 'car') {
    updatedVehicle = { ...vehicle as Car, driver: null, speed: 0, velocity: { x: 0, y: 0 } };
  } else if (vehicle.type === 'waterBike') {
    updatedVehicle = { ...vehicle as WaterBike, driver: null, speed: 0 };
  }
  
  return { updatedPlayer, updatedVehicle };
};

// Update wanted level
export const updateWantedLevel = (player: Player, crime: 'killing' | 'carTheft' | 'policeShooting'): Player => {
  let increment = 0;
  
  switch (crime) {
    case 'killing':
      increment = 2;
      break;
    case 'carTheft':
      increment = 1;
      break;
    case 'policeShooting':
      increment = 3;
      break;
  }
  
  return {
    ...player,
    wantedLevel: Math.min(5, player.wantedLevel + increment)
  };
};

// Police chases player based on wanted level
export const policeChasePlayer = (police: Police, player: Player): Police => {
  // If wanted level is 0, police doesn't chase
  if (player.wantedLevel === 0) {
    return { ...police, chasing: false, target: undefined };
  }
  
  const distanceToPlayer = getDistance(police.position, player.position);
  
  // Police detects player based on wanted level
  // Higher wanted level means larger detection radius
  const detectionMultiplier = 1 + (player.wantedLevel * 0.5);
  
  if (distanceToPlayer <= police.detectionRadius * detectionMultiplier) {
    return { ...police, chasing: true, target: player };
  }
  
  return police;
};

// Move police based on target
export const movePolice = (police: Police, gameState: GameState): Police => {
  if (!police.chasing || !police.target) {
    // Normal patrol (follow waypoints)
    if (police.patrolPath && police.patrolPath.length > 0) {
      const currentPatrolIndex = police.currentPatrolIndex || 0;
      const currentWaypoint = police.patrolPath[currentPatrolIndex];
      const distToWaypoint = getDistance(police.position, currentWaypoint);
      
      // If we've reached the waypoint, go to the next
      if (distToWaypoint < 20) {
        const newIndex = (currentPatrolIndex + 1) % police.patrolPath.length;
        return { ...police, currentPatrolIndex: newIndex };
      }
      
      // Calculate direction to waypoint
      let direction: Direction = police.direction;
      
      if (Math.abs(currentWaypoint.x - police.position.x) > Math.abs(currentWaypoint.y - police.position.y)) {
        direction = currentWaypoint.x > police.position.x ? 'right' : 'left';
      } else {
        direction = currentWaypoint.y > police.position.y ? 'down' : 'up';
      }
      
      // Move toward waypoint
      const newPosition = moveEntity({ ...police, direction }, direction, gameState);
      return { ...police, position: newPosition, direction };
    }
    
    return police;
  }
  
  // Calculate direction toward player
  const targetPosition = police.target.position;
  let direction: Direction = police.direction;
  
  if (Math.abs(targetPosition.x - police.position.x) > Math.abs(targetPosition.y - police.position.y)) {
    direction = targetPosition.x > police.position.x ? 'right' : 'left';
  } else {
    direction = targetPosition.y > police.position.y ? 'down' : 'up';
  }
  
  // Police speed increases with player's wanted level
  const speedMultiplier = 1 + (police.target.wantedLevel * 0.2);
  const adjustedSpeed = police.speed * speedMultiplier;
  
  // Create a new police instance with adjusted speed
  const updatedPolice = { ...police, speed: adjustedSpeed, direction };
  
  // Move police
  const newPosition = moveEntity(updatedPolice, direction, gameState);
  
  // Check if police should shoot
  let shouldShoot = false;
  const now = Date.now();
  const shootingCooldown = 1000 - (police.target.wantedLevel * 100); // Faster shooting with higher wanted level
  
  if (
    police.hasGun && 
    police.target.wantedLevel > 1 && // Only shoot at wanted level > 1
    getDistance(police.position, police.target.position) < 150 + (police.target.wantedLevel * 20) &&
    (!police.lastShot || now - police.lastShot > shootingCooldown)
  ) {
    shouldShoot = true;
  }
  
  return { 
    ...updatedPolice, 
    position: newPosition,
    lastShot: shouldShoot ? now : police.lastShot
  };
};
