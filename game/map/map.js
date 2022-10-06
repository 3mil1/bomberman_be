const grid = 64;
const numRows = 13;
const numCols = 15;
const ELEMENTS = {
  WALL: 'wall',
  DESTROYABLE_WALL: 'destroyable-wall',
  EMPTY_CELL: 'empty-cell',
  FIELD: 'field',
};

const types = {
  wall: '▉',
  destroyableWall: 1,
  emptyCell: 'x',
  blank: '.',
};

// export function GameField({ template }) {
//   return (
//     <div className={'container'}>
//       {template.flatMap(col => {
//         return col.map(cell => {
//           switch (cell) {
//             case types.wall:
//               return <div className={ELEMENTS.WALL} />;
//             case types.destroyableWall:
//               return <div className={ELEMENTS.DESTROYABLE_WALL} />;
//             case types.blank:
//               return <div className={ELEMENTS.FIELD} />;
//             default:
//               return <div className={ELEMENTS.FIELD} />;
//           }
//         });
//       })}
//     </div>
//   );
// }

// export function generateLevel(template) {
//   for (let row = 0; row < numRows; row++) {
//     for (let col = 0; col < numCols; col++) {
//       if (template[row][col] === '.' && Math.random() < 0.9) {
//         template[row][col] = types.destroyableWall;
//       }
//     }
//   }
//   return template;
// }

export const template = [
  ['▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉'],
  ['▉', 'x', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', 'x', '▉'],
  ['▉', 'x', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', 'x', '▉'],
  ['▉', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', '▉'],
  ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
  ['▉', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '▉'],
  ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
  ['▉', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '▉'],
  ['▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉'],
  ['▉', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', '▉'],
  ['▉', 'x', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', '.', '▉', 'x', '▉'],
  ['▉', 'x', 'x', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'x', 'x', '▉'],
  ['▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉', '▉'],
];
