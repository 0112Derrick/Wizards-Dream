import Response from 'express';

export default abstract class NetworkProxy {
    constructor() { }
    abstract postJSON(route: string, data?: any): Promise<Response>

    abstract postFORM(route: string, data?: any): Promise<Response>

    abstract getJSON(route: string): Promise<Response>

    abstract getFORM(route: string)

    abstract deleteJSON(route: string)


}