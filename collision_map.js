const OFFSET = 46;

const checkCollision = (map, position, direction) => {
  const left_top_corner = { x: position.x , y: position.y };
  const right__top_corner = { x: position.x + OFFSET, y: position.y };
  const left_bottom_corner = { x: position.x, y: position.y + OFFSET };
  const right__bottom_corner = { x: position.x + OFFSET, y: position.y + OFFSET,};

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

const freeToMove = (map, corner1, corner2) => {
  return getBoxValue(map, corner1) && getBoxValue(map, corner2);
};

const getBoxValue = (map, coords) => {
  const row_position = Math.floor(coords.y / 50);
  const column_position = Math.floor(coords.x / 50);
  let value = map[row_position][column_position];
  return !['▉', 1].includes(value);
};

export default checkCollision
