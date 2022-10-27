export class Timer {
    constructor(waiting, countdown, start, gameOver, end) {
        this.countdown = countdown;
        this.waiting = waiting;
        this.gameOver = gameOver;
        this.waitingID = null;
        this.countdownID = null;
        this.gameOverID = null;
        this.start = start;
        this.end = end;
        this.#startWaitingTimer();
    }

    #startWaitingTimer() {
        this.waitingID = setInterval(() => {
            console.log("waiting", this.waiting)
            this.waiting--;
            if (this.waiting <= 0) {
                this.startCountdownTimer();
            }
        }, 1000);
    }

    startCountdownTimer() {
        this.deleteWaiting();
        this.countdownID = setInterval(() => {
            console.log("countdown", this.countdown)
            this.countdown--;
            if (this.countdown <= 0) {
                this.deleteCountdown();
                this.start();
            }
        }, 1000);
    }

    startGameOver() {
        this.gameOverID = setTimeout(() => {
            this.gameOver--;
            if (this.gameOver <=0) {
                this.deleteGameOver();
                this.end;
            }
        }, 1000)
    }

    deleteWaiting() {
        if (this.waitingID) {
            clearInterval(this.waitingID);
            this.waitingID = null;
        }
    }

    deleteCountdown() {
        if (this.countdownID) {
            clearInterval(this.countdownID);
            this.waitingID = null;
        }
    }

    deleteGameOver() {
        if (this.gameOverID) {
            clearInterval(this.gameOver);
            this.gameOverID = null;
        }
    }

    getGameOverTimer() {
        if (this.gameOverID) return this.gameOver;
        return null;
    }

    getTimer() {
        if (this.waitingID) {
            return {
                firstTimer: this.waiting,
            };
        }
        if (this.countdownID) {
            return {
                secondTimer: this.countdown,
            };
        }
        return null;
    }
    getCountdown() {
        return !!this.countdownID;
    }

}