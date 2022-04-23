export class Machine {
    constructor(private hashrate: number, private consumptionRate: number) {

    }

    getHashrate = (): number => {
        return this.hashrate
    }

    getConsumptionRate = (): number => {
        return this.consumptionRate
    }

    static Default = (): Machine => {
        return new Machine(10, 3)
    }
}

export class Battery {
    constructor(private cap: number) {

    }

    getCapacity = (): number => {
        return this.cap
    }

    static Default = (): Battery => {
        return new Battery(100)
    }
}