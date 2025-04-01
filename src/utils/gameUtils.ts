
import { Position, Entity, Direction, GameState, Car, Player, Police, Pedestrian, Bullet } from '../types/game';

// Génère un ID unique
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Détecte la collision entre deux entités
export const detectCollision = (entity1: Entity, entity2: Entity): boolean => {
  return (
    entity1.position.x < entity2.position.x + entity2.width &&
    entity1.position.x + entity1.width > entity2.position.x &&
    entity1.position.y < entity2.position.y + entity2.height &&
    entity1.position.y + entity1.height > entity2.position.y
  );
};

// Calcule la distance entre deux positions
export const getDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

// Genere una posizione casuale all'interno della mappa
export const getRandomPosition = (mapWidth: number, mapHeight: number): Position => {
  return {
    x: Math.random() * (mapWidth - 40) + 20,
    y: Math.random() * (mapHeight - 40) + 20
  };
};

// Déplace une entité dans une direction
export const moveEntity = (entity: Entity, direction: Direction, gameState: GameState): Position => {
  const newPosition = { ...entity.position };
  
  // Ottieni la velocità effettiva (può essere modificata se si tratta di una macchina)
  const effectiveSpeed = entity.speed;
  
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
  
  // Limiti della mappa
  const GAME_WIDTH = 1600;
  const GAME_HEIGHT = 1200;
  
  // Mantieni l'entità all'interno dei limiti della mappa
  newPosition.x = Math.max(0, Math.min(newPosition.x, GAME_WIDTH - entity.width));
  newPosition.y = Math.max(0, Math.min(newPosition.y, GAME_HEIGHT - entity.height));
  
  // Vérifier les collisions avec les bâtiments (simplifié)
  const willCollide = false; // À implémenter avec la vraie logique de collision
  
  if (!willCollide) {
    return newPosition;
  }
  
  return entity.position;
};

// Fait tirer le joueur
export const playerShoot = (player: Player, direction: Direction): Bullet => {
  const bulletSpeed = 8;
  const bulletPosition = { ...player.position };
  
  // Ajuster la position de départ de la balle en fonction de la direction
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

// Voler une voiture
export const stealCar = (player: Player, car: Car): { updatedPlayer: Player, updatedCar: Car } => {
  // Posiziona il player correttamente all'interno dell'auto
  const updatedPlayer = { 
    ...player, 
    inCar: true, 
    currentCar: car,
    position: { ...car.position } // Il giocatore si posiziona al centro dell'auto
  };
  
  const updatedCar = { 
    ...car, 
    driver: player,
    speed: 0 // L'auto parte da ferma quando viene rubata
  };
  
  return { updatedPlayer, updatedCar };
};

// Sortir d'une voiture
export const exitCar = (player: Player): { updatedPlayer: Player, updatedCar: Car | null } => {
  if (!player.currentCar) {
    return { updatedPlayer: player, updatedCar: null };
  }
  
  const updatedCar = { ...player.currentCar, driver: null, speed: 0 };
  
  // Posiziona il giocatore a fianco dell'auto in base alla direzione
  let exitPosition = { ...player.currentCar.position };
  
  switch (player.currentCar.direction) {
    case 'up':
      exitPosition.x += player.currentCar.width + 5;
      break;
    case 'down':
      exitPosition.x -= player.width + 5;
      break;
    case 'left':
      exitPosition.y += player.currentCar.height + 5;
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
  
  return { updatedPlayer, updatedCar };
};

// Mettre à jour le niveau de recherche
export const updateWantedLevel = (player: Player, crime: 'killing' | 'carTheft'): Player => {
  let increment = 0;
  
  switch (crime) {
    case 'killing':
      increment = 2;
      break;
    case 'carTheft':
      increment = 1;
      break;
  }
  
  return {
    ...player,
    wantedLevel: Math.min(5, player.wantedLevel + increment)
  };
};

// Police poursuit le joueur en fonction du niveau de recherche
export const policeChasePlayer = (police: Police, player: Player): Police => {
  // Si le niveau de recherche est 0, la police ne poursuit pas
  if (player.wantedLevel === 0) {
    return { ...police, chasing: false, target: undefined };
  }
  
  const distanceToPlayer = getDistance(police.position, player.position);
  
  // La police détecte le joueur en fonction de son niveau de recherche
  // Plus le niveau est élevé, plus la distance de détection est grande
  const detectionMultiplier = 1 + (player.wantedLevel * 0.5);
  
  if (distanceToPlayer <= police.detectionRadius * detectionMultiplier) {
    return { ...police, chasing: true, target: player };
  }
  
  return police;
};

// Déplace la police en fonction de sa cible
export const movePolice = (police: Police, gameState: GameState): Police => {
  if (!police.chasing || !police.target) {
    // Patrouille normale (segui i waypoints)
    if (police.patrolPath && police.patrolPath.length > 0) {
      const currentPatrolIndex = police.currentPatrolIndex || 0;
      const currentWaypoint = police.patrolPath[currentPatrolIndex];
      const distToWaypoint = getDistance(police.position, currentWaypoint);
      
      // Se siamo arrivati al waypoint, vai al prossimo
      if (distToWaypoint < 20) {
        const newIndex = (currentPatrolIndex + 1) % police.patrolPath.length;
        return { ...police, currentPatrolIndex: newIndex };
      }
      
      // Calcola la direzione verso il waypoint
      let direction: Direction = police.direction;
      
      if (Math.abs(currentWaypoint.x - police.position.x) > Math.abs(currentWaypoint.y - police.position.y)) {
        direction = currentWaypoint.x > police.position.x ? 'right' : 'left';
      } else {
        direction = currentWaypoint.y > police.position.y ? 'down' : 'up';
      }
      
      // Muovi verso il waypoint
      const newPosition = moveEntity({ ...police, direction }, direction, gameState);
      return { ...police, position: newPosition, direction };
    }
    
    return police;
  }
  
  // Calcul de la direction vers le joueur
  const targetPosition = police.target.position;
  let direction: Direction = police.direction;
  
  if (Math.abs(targetPosition.x - police.position.x) > Math.abs(targetPosition.y - police.position.y)) {
    direction = targetPosition.x > police.position.x ? 'right' : 'left';
  } else {
    direction = targetPosition.y > police.position.y ? 'down' : 'up';
  }
  
  // Vitesse de la police augmente avec le niveau de recherche du joueur
  const speedMultiplier = 1 + (police.target.wantedLevel * 0.2);
  const adjustedSpeed = police.speed * speedMultiplier;
  
  // Créer une nouvelle instance de police avec la vitesse ajustée
  const updatedPolice = { ...police, speed: adjustedSpeed, direction };
  
  // Déplacer la police
  const newPosition = moveEntity(updatedPolice, direction, gameState);
  
  return { ...updatedPolice, position: newPosition };
};
