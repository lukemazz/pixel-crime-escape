
export type Position = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type EntityType = 'player' | 'pedestrian' | 'police' | 'car' | 'bullet';

export interface Entity {
  id: string;
  type: EntityType;
  position: Position;
  direction: Direction;
  speed: number;
  width: number;
  height: number;
  isAlive: boolean;
}

export interface Player extends Entity {
  type: 'player';
  inCar: boolean;
  currentCar: Car | null;
  wantedLevel: number;
  hasGun: boolean;
  name: string;
}

export interface Pedestrian extends Entity {
  type: 'pedestrian';
  isHostile: boolean;
  waypoints?: Position[];
  currentWaypoint?: number;
  lastDirectionChange: number;
}

export interface Police extends Entity {
  type: 'police';
  patrolPath?: Position[];
  chasing: boolean;
  target?: Player;
  detectionRadius: number;
  currentPatrolIndex?: number;
}

export interface Car extends Entity {
  type: 'car';
  color: string;
  driver: Player | Pedestrian | Police | null;
  maxSpeed: number;
}

export interface Bullet extends Entity {
  type: 'bullet';
  shooter: Player | Pedestrian | Police;
  damage: number;
  range: number;
  distanceTraveled: number;
  timestamp?: number;
}

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
  type?: 'normal' | 'system';
}

export type GameState = {
  player: Player;
  pedestrians: Pedestrian[];
  police: Police[];
  cars: Car[];
  bullets: Bullet[];
  score: number;
  gameOver: boolean;
  messages: ChatMessage[];
  camera: {
    x: number;
    y: number;
  };
  lastActionTime?: number;
};
