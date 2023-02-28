export default class Queue<T> {
    private items: Array<T>;
    constructor() {
        this.items = [];
    }
    add(item: T) {
        this.items.push(item);
    }

    dequeue(): T {
        return this.items.shift();
    }

    pop(): T {
        return this.items.pop();
    }

    peek(): T {
        if (this.items = null) {
            return null;
        }
        return this.items.at(0);
    }

    getSize(): number {
        return this.items.length;
    }

    isEmpty(): boolean {
        if (this.getSize() == 0) {
            return true;
        } else {
            return false;
        }
    }

    indexOf(item: T): T | number {
        return this.items.indexOf(item);
    }

    entries(): IterableIterator<[number, T]> {
        return this.items.entries();
    }

    values(): IterableIterator<T> {
        return this.items.values();
    }

    /**
     * 
     * @returns An array of the queue.
     */
    toArray(): Array<T> {
        let clonedArray = this.items.slice();
        return clonedArray;
    }

    emptyQueue(): void {
        for (let i = this.getSize(); i > 0; i--) {
            this.items.pop();
        }
    }

}