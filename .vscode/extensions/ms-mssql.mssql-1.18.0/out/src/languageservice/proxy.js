"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProxyAgentOptions = exports.getProxyAgent = exports.isBoolean = void 0;
const http_proxy_agent_1 = require("http-proxy-agent");
const https_proxy_agent_1 = require("https-proxy-agent");
const url_1 = require("url");
function getSystemProxyURL(requestURL) {
    if (requestURL.protocol === 'http:') {
        return process.env.HTTP_PROXY || process.env.http_proxy || undefined;
    }
    else if (requestURL.protocol === 'https:') {
        return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || undefined;
    }
    return undefined;
}
function isBoolean(obj) {
    return obj === true || obj === false;
}
exports.isBoolean = isBoolean;
/*
 * Returns the proxy agent using the proxy url in the parameters or the system proxy. Returns null if no proxy found
 */
function getProxyAgent(requestURL, proxy, strictSSL) {
    const proxyURL = proxy || getSystemProxyURL(requestURL);
    if (!proxyURL) {
        return undefined;
    }
    const proxyEndpoint = url_1.parse(proxyURL);
    const opts = this.getProxyAgentOptions(requestURL, proxy, strictSSL);
    return proxyEndpoint.protocol === 'https:' ? new https_proxy_agent_1.HttpsProxyAgent(opts) : new http_proxy_agent_1.HttpProxyAgent(opts);
}
exports.getProxyAgent = getProxyAgent;
/*
 * Returns the proxy agent using the proxy url in the parameters or the system proxy. Returns null if no proxy found
 */
function getProxyAgentOptions(requestURL, proxy, strictSSL) {
    const proxyURL = proxy || getSystemProxyURL(requestURL);
    if (!proxyURL) {
        return undefined;
    }
    const proxyEndpoint = url_1.parse(proxyURL);
    if (!/^https?:$/.test(proxyEndpoint.protocol)) {
        return undefined;
    }
    const opts = {
        host: proxyEndpoint.hostname,
        port: Number(proxyEndpoint.port),
        auth: proxyEndpoint.auth,
        rejectUnauthorized: isBoolean(strictSSL) ? strictSSL : true
    };
    return opts;
}
exports.getProxyAgentOptions = getProxyAgentOptions;

//# sourceMappingURL=proxy.js.map
