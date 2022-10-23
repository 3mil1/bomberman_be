// const offset = 46;
// export const checkCollision2 = (map, position, direction) => {
//     const left_top_corner = { x: position.x , y: position.y };
//     const right__top_corner = { x: position.x + offset, y: position.y };
//     const left_bottom_corner = { x: position.x, y: position.y + offset };
//     const right__bottom_corner = {
//         x: position.x + offset,
//         y: position.y + offset,
//     };

//     switch (direction) {
//         case 'up':
//             return freeToMove(map, left_top_corner, right__top_corner);
//         case 'down':
//             return freeToMove(map, left_bottom_corner, right__bottom_corner);
//         case 'left':
//             return freeToMove(map, left_top_corner, left_bottom_corner);
//         case 'right':
//             return freeToMove(map, right__top_corner, right__bottom_corner);
//     }
// }

// export const freeToMove = (map, corner1, corner2) => {
//     console.log("CAN MOVE > " , getBoxValue(map, corner1) && getBoxValue(map, corner2) );
//     return getBoxValue(map, corner1) && getBoxValue(map, corner2);
// };

// export const getBoxValue = (map, coords) => {
//     const row_position = Math.floor(coords.y / 50);
//     const column_position = Math.floor(coords.x / 50);
//     let value = map[row_position][column_position];
//     return value === '.' || value === 'x';
// };

// export const placeOnEdge = (map, player) => {
//     let {x,y} = player.position;
//     console.log(`CURRENT PLAYER POSTIION ${x} ${y}`);
//     let offset2 = offset;
//     let direction = player.direction;
//     const row_position = Math.floor(y / 50);
//     const column_position = Math.floor(x / 50);
//     let value = map[row_position][column_position];
//     if (value !== '.' || value !== 'x') {
//         switch (direction) {
//             case 'up':
//                 player.position = {x, y: ((row_position + 1) * 50) + 1 };
//                 break;
//             case 'down':
//                 player.position = {x, y: row_position * 50 + (50 - offset2)};
//                 break;
//             case 'left':
//                 player.position = { x: ((column_position + 1)  * 50) + 1, y };
//                 break;
//             case 'right':
//                 player.position = { x: (column_position * 50) + (50 - offset2), y };
//                 break;
//         }
//     }
// };