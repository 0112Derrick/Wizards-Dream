import { response } from 'express';
import $NetworkProxy from './NetworkProxy.js';
import { StatusConstants as $StatusConstants } from '../constants/StatusConstants.js';

export default class HTMLProxy extends $NetworkProxy {


    getFORM(route: string): void {
        throw new Error('Method not implemented.');
    }

    deleteJSON(route: string): void {
        throw new Error('Method not implemented.');
    }

    constructor() {
        super();
    }

    async postJSON(route: string, data?: any) {

        console.log('Data to send', JSON.stringify(data ?? {}));
        let response = await fetch(route, {
            method: 'POST',
            body: JSON.stringify(data ?? {}),
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
        });
        return response;
    }

    async postFORM(route: string, data: any) {
        let response = await fetch(route, {
            method: 'POST',
            body: data,
        });

        return response;
    }

    async getJSON(route: string) {
        try {
            let response = await fetch(route, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
            });
            return Promise.resolve(response);
        }
        catch {
            return Promise.reject(null);
        }
    }

}