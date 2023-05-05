class Snowflake {
    workerId: number;
    sequence: number;
    lastTimestamp: number;
    constructor(workerId: number) {
        this.workerId = workerId;
        this.sequence = 0;
        this.lastTimestamp = -1;
    }

    _nextTimestamp() {
        return Date.now();
    }

    _waitUntilNextMillis(lastTimestamp) {
        let timestamp = this._nextTimestamp();
        while (timestamp <= lastTimestamp) {
            timestamp = this._nextTimestamp();
        }
        return timestamp;
    }

    generateId() {
        const timestampBits = 41;
        const workerIdBits = 10;
        const sequenceBits = 12;

        const maxWorkerId = -1 ^ (-1 << workerIdBits);
        const maxSequence = -1 ^ (-1 << sequenceBits);

        let timestamp = this._nextTimestamp();

        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards. Refusing to generate id for ' + (this.lastTimestamp - timestamp) + ' milliseconds');
        }

        if (this.lastTimestamp === timestamp) {
            this.sequence = (this.sequence + 1) & maxSequence;
            if (this.sequence === 0) {
                timestamp = this._waitUntilNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        return ((timestamp & ((-1 ^ (-1 << timestampBits)) << workerIdBits + sequenceBits))
            | (this.workerId & maxWorkerId) << sequenceBits
            | (this.sequence & maxSequence));
    }
}