import axios from 'axios';

const BASE_URL= 'http://localhost:5000';
const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
    }
});

async function getQuery (url, data) {
    if( data == null) {
        return await instance.get(BASE_URL+url);
    }
    return await instance.get(url, {params: data});
}

async function postQuery (url, data){
    return await instance.post(url, data);
}

async function putQuery (url, data) {
    return await instance.put(url, data);
}

export {getQuery, postQuery, putQuery,instance}