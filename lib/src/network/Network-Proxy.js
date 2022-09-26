class NetworkProxyLegacy {
    static async postJSON(route, data) {
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
    static async postFORM(route, data) {
        let response = await fetch(route, {
            method: 'POST',
            body: data,
        });
        return response;
    }
}
//# sourceMappingURL=Network-Proxy.js.map