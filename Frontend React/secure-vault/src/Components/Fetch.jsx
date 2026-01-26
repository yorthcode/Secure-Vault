let refreshPromise = null;
let refreshing = null;

async function Fetch(endpoint, method = 'GET', body = null) {
    const URL = 'https://localhost:7144/api/';

    const options = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    };

    const request = await fetch(`${URL}${endpoint}`, options);
    
    if (request.status == 401) {
        if (!refreshing) {
            refreshing = true;
            refreshPromise = fetch(`${URL}auth/refresh`, options).finally(refreshing = false)
        }

        const refResponse = await refreshPromise;
        if (refResponse.ok)
            return await fetch(`${URL}${endpoint}`, options);
    }
    
    return request;
}

export default Fetch;