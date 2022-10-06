let DIRECTION=(
    LEFT,
    RIGHT,
    UP,
    DOWN
)

export class Player{
    constructor(position){
        this.x = position.x,
        this.y = position.y,
        this.direction = DIRECTION.LEFT
        this.speed = 1;
    }


    setPostion(){
        
    }
}