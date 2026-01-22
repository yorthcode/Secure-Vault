async function Fetch(endpoint, method = 'GET', body = null, token = null) {
    const URL = 'https://localhost:7144/api/';

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${URL}${endpoint}`, options);
    return response.json();
}

export default Fetch;