async function Fetch(endpoint, method = 'GET', body = null) {
    const URL = 'https://localhost:7144/api/';

    const options = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${URL}${endpoint}`, options);
    return response;
}

export default Fetch;