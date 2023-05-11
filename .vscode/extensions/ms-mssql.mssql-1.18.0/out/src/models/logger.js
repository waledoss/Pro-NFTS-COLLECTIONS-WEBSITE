"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const os = require("os");
const Utils = require("./utils");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Pii"] = 0] = "Pii";
    LogLevel[LogLevel["Off"] = 1] = "Off";
    LogLevel[LogLevel["Critical"] = 2] = "Critical";
    LogLevel[LogLevel["Error"] = 3] = "Error";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Information"] = 5] = "Information";
    LogLevel[LogLevel["Verbose"] = 6] = "Verbose";
    LogLevel[LogLevel["All"] = 7] = "All";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/*
* Logger class handles logging messages using the Util functions.
*/
class Logger {
    constructor(writer, logLevel, piiLogging, prefix) {
        this._piiLogging = false;
        this._indentLevel = 0;
        this._indentSize = 4;
        this._atLineStart = false;
        this._writer = writer;
        this._logLevel = logLevel;
        this._piiLogging = piiLogging;
        this._prefix = prefix;
    }
    /**
     * Logs a message containing PII (when enabled). Provides the ability to sanitize or shorten values to hide information or reduce the amount logged.
     * @param msg The initial message to log
     * @param objsToSanitize Set of objects we want to sanitize
     * @param stringsToShorten Set of strings to shorten
     * @param vals Any other values to add on to the end of the log message
     */
    piiSantized(msg, objsToSanitize, stringsToShorten, ...vals) {
        if (this.piiLogging) {
            msg = [
                msg,
                ...objsToSanitize === null || objsToSanitize === void 0 ? void 0 : objsToSanitize.map(obj => `${obj.name}=${sanitize(obj.objOrArray)}`),
                ...stringsToShorten.map(str => `${str.name}=${shorten(str.value)}`)
            ].join(' ');
            this.write(LogLevel.Pii, msg, vals);
        }
    }
    /**
     * Logs a message containing PII (when enabled).
     * @param msg The initial message to log
     * @param vals Any other values to add on to the end of the log message
     */
    pii(msg, ...vals) {
        if (this.piiLogging) {
            this.write(LogLevel.Pii, msg, vals);
        }
    }
    set piiLogging(val) {
        this._piiLogging = val;
    }
    get piiLogging() {
        return this._piiLogging;
    }
    shouldLog(logLevel) {
        return logLevel <= this._logLevel;
    }
    write(logLevel, msg, ...vals) {
        if (this.shouldLog(logLevel) || logLevel === LogLevel.Pii) {
            const fullMessage = `[${LogLevel[logLevel]}]: ${msg} - ${vals.map(v => JSON.stringify(v)).join(' - ')}`;
            this.appendLine(fullMessage);
        }
    }
    logDebug(message) {
        Utils.logDebug(message);
    }
    log(msg, ...vals) {
        this.write(LogLevel.All, msg, vals);
    }
    error(msg, ...vals) {
        this.write(LogLevel.Error, msg, vals);
    }
    info(msg, ...vals) {
        this.write(LogLevel.Information, msg, vals);
    }
    verbose(msg, ...vals) {
        this.write(LogLevel.Verbose, msg, vals);
    }
    appendCore(message) {
        if (this._atLineStart) {
            if (this._indentLevel > 0) {
                const indent = ' '.repeat(this._indentLevel * this._indentSize);
                this._writer(indent);
            }
            if (this._prefix) {
                this._writer(`[${this._prefix}] `);
            }
            this._atLineStart = false;
        }
        this._writer(message);
    }
    increaseIndent() {
        this._indentLevel += 1;
    }
    decreaseIndent() {
        if (this._indentLevel > 0) {
            this._indentLevel -= 1;
        }
    }
    append(message) {
        message = message || '';
        this.appendCore(message);
    }
    appendLine(message) {
        message = message || '';
        this.appendCore(message + os.EOL);
        this._atLineStart = true;
    }
}
exports.Logger = Logger;
/**
 * Sanitizes a given object for logging to the output window, removing/shortening any PII or unneeded values
 * @param objOrArray The object to sanitize for output logging
 * @returns The stringified version of the sanitized object
 */
function sanitize(objOrArray) {
    if (Array.isArray(objOrArray)) {
        return JSON.stringify(objOrArray.map(o => sanitizeImpl(o)));
    }
    else {
        return sanitizeImpl(objOrArray);
    }
}
function sanitizeImpl(obj) {
    obj = Object.assign({}, obj);
    delete obj.domains; // very long and not really useful
    // shorten all tokens since we don't usually need the exact values and there's security concerns if they leaked
    shortenIfExists(obj, 'token');
    shortenIfExists(obj, 'refresh_token');
    shortenIfExists(obj, 'access_token');
    shortenIfExists(obj, 'code');
    shortenIfExists(obj, 'id_token');
    return JSON.stringify(obj);
}
/**
 * Shortens the given string property on an object if it exists, otherwise does nothing
 * @param obj The object possibly containing the property
 * @param property The name of the property to shorten - if it exists
 */
function shortenIfExists(obj, property) {
    if (obj[property]) {
        obj[property] = shorten(obj[property]);
    }
}
/**
 * Shortens a given string - if it's longer than 6 characters will return the first 3 characters
 * followed by a ... followed by the last 3 characters. Returns the original string if 6 characters
 * or less.
 * @param str The string to shorten
 * @returns Shortened string in the form 'xxx...xxx'
 */
function shorten(str) {
    // Don't shorten if adding the ... wouldn't make the string shorter
    if (!str || str.length < 10) {
        return str;
    }
    return `${str.substr(0, 3)}...${str.slice(-3)}`;
}

//# sourceMappingURL=logger.js.map
