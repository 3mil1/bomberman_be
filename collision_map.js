export const checkCollision2 = (map, position, direction) => {
  let offset = 40;
  const left_top_corner = { x: position.x, y: position.y };
  const right__top_corner = { x: position.x + offset, y: position.y };
  const left_bottom_corner = { x: position.x, y: position.y + offset };
  const right__bottom_corner = {
    x: position.x + offset,
    y: position.y + offset,
  };

  switch (direction) {
    case 'up':
      return freeToMove(map, left_top_corner, right__top_corner);
    case 'down':
      return freeToMove(map, left_bottom_corner, right__bottom_corner);
    case 'left':
      return freeToMove(map, left_top_corner, left_bottom_corner);
    case 'right':
      return freeToMove(map, right__top_corner, right__bottom_corner);
  }
}

export const freeToMove = (map, corner1, corner2) => {
  return getBoxValue(map, corner1) && getBoxValue(map, corner2);
};

export const getBoxValue = (map, coords) => {
  const row_position = Math.floor(coords.y / 50);
  const column_position = Math.floor(coords.x / 50);
  let value = map[row_position][column_position];
  console.log(`VALUE :`, value);
  return value === '.' || value === 'x';
};

// export class CollisionMap {
//   constructor(map) {
//     this.map = map;
//     this.offset = 48;
//   }

//   checkCollision(position, direction) {
//     console.log(`POSITION X ${position.x} , DIRECTION : ${direction}`);
//     console.log(`POSITION  Y ${position.y} , DIRECTION : ${direction}`);
//     const left_top_corner = { x: position.x, y: position.y };
//     const right__top_corner = { x: position.x + this.offset, y: position.y };
//     const left_bottom_corner = { x: position.x, y: position.y + this.offset };
//     const right__bottom_corner = {
//       x: position.x + this.offset,
//       y: position.y + this.offset,
//     };

//     switch (direction) {
//       case 'up':
//         return this.freeToMove(left_top_corner, right__top_corner);
//       case 'down':
//         return this.freeToMove(left_bottom_corner, right__bottom_corner);
//       case 'left':
//         return this.freeToMove(left_top_corner, left_bottom_corner);
//       case 'right':
//         return this.freeToMove(right__top_corner, right__bottom_corner);
//     }
//     return 'OKEI';
//   }

//   freeToMove = (corner1, corner2) => {
//     return this.getBoxValue(corner1) && this.getBoxValue(corner2);
//   };

//   getBoxValue = coords => {
//     const row_position = Math.floor(coords.y / 50);
//     const column_position = Math.floor(coords.x / 50);
//     let value = this.map[row_position][column_position];
//     return value === '.' || value === 'x';
//   };
// }
