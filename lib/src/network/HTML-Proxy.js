import $NetworkProxy from './NetworkProxy.js';
export default class HTMLProxy extends $NetworkProxy {
    getFORM(route) {
        throw new Error('Method not implemented.');
    }
    deleteJSON(route) {
        throw new Error('Method not implemented.');
    }
    constructor() {
        super();
    }
    async postJSON(route, data) {
        console.log('Data to send', JSON.stringify(data ?? {}));
        let response = await fetch(route, {
            method: 'POST',
            body: JSON.stringify(data ?? {}),
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
        });
        return response.json();
    }
    async postFORM(route, data) {
        let response = await fetch(route, {
            method: 'POST',
            body: data,
        });
        return response;
    }
    async getJSON(route) {
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
//# sourceMappingURL=HTML-Proxy.js.map