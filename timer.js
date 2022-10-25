export class Timer {
    constructor(waiting, countdown, start) {
        this.countdown = countdown;
        this.waiting = waiting;
        this.waitingID = null;
        this.countdownID = null;
        this.start = start;
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

    getTimer() {
        if (this.waitingID) return this.waiting;
        if (this.countdownID) return this.countdown;
        return null;
    }
    getCountdown() {
        return !!this.countdownID;
    }
}