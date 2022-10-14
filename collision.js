const fieldTypes = {
  wall: '▉',
  destroyableWall: 1,
  emptyCell: 'x',
  blank: '.',

  speedUp: 2,
  bombRadius: 3,
  bombsNumber: 4,

  speedUpOpened: 's',
  bombsNumberOpened: 'n',
  bombRadiusOpened: 'r',

  bomb: 'b',
  detonatedBomb: 'd',
};

const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

export function checkCollision(map, direction, position) {
  const offset = 48;
  const left_top_corner = { x: position.x, y: position.y };
  const right__top_corner = { x: position.x + offset, y: position.y };
  const left_bottom_corner = { x: position.x, y: position.y + offset };
  const right__bottom_corner = {
    x: position.x + offset,
    y: position.y + offset,
  };

  switch (direction) {
    case DIRECTION.UP:
      return freeToMove(map, left_top_corner, right__top_corner);
    case DIRECTION.DOWN:
      return freeToMove(map, left_bottom_corner, right__bottom_corner);
    case DIRECTION.LEFT:
      return freeToMove(map, left_top_corner, left_bottom_corner);
    case DIRECTION.RIGHT:
      return freeToMove(map, right__top_corner, right__bottom_corner);
  }
}

const freeToMove = (map, corner1, corner2) => {
  return getBoxValue(map, corner1) && getBoxValue(map, corner2);
};

const getBoxValue = (map, coords) => {
    let maps = map
  const row_position = Math.floor(coords.y / 50);
  const column_position = Math.floor(coords.x / 50);
  let value = maps[row_position][column_position];
  return value === fieldTypes.blank || value === fieldTypes.emptyCell;
};
