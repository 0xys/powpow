export class Machine {
    constructor(private hashrate: number, private consumptionRate: number) {

    }

    static Default = (): Machine => {
        return new Machine(10, 3)
    }
}

export class Battery {
    constructor(private cap: number) {

    }

    static Default = (): Battery => {
        return new Battery(100)
    }
}