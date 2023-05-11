"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEncryptionHelper = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const os = require("os");
const crypto = require("crypto");
const vscode = require("vscode");
const LocalizedConstants = require("../constants/localizedConstants");
const azure_1 = require("../models/contracts/azure");
const constants_1 = require("./constants");
class FileEncryptionHelper {
    constructor(_authLibrary, _credentialStore, _vscodeWrapper, _logger, _fileName) {
        this._authLibrary = _authLibrary;
        this._credentialStore = _credentialStore;
        this._vscodeWrapper = _vscodeWrapper;
        this._logger = _logger;
        this._fileName = _fileName;
        this.fileSaver = (content) => __awaiter(this, void 0, void 0, function* () {
            if (!this._keyBuffer || !this._ivBuffer) {
                yield this.init();
            }
            const cipherIv = crypto.createCipheriv(this._algorithm, this._keyBuffer, this._ivBuffer);
            let cipherText = `${cipherIv.update(content, 'utf8', this._binaryEncoding)}${cipherIv.final(this._binaryEncoding)}`;
            if (this._authLibrary === azure_1.AuthLibrary.ADAL) {
                cipherText += `%${cipherIv.getAuthTag().toString(this._binaryEncoding)}`;
            }
            return cipherText;
        });
        this.fileOpener = (content) => __awaiter(this, void 0, void 0, function* () {
            if (!this._keyBuffer || !this._ivBuffer) {
                yield this.init();
            }
            let encryptedText = content;
            const decipherIv = crypto.createDecipheriv(this._algorithm, this._keyBuffer, this._ivBuffer);
            if (this._authLibrary === azure_1.AuthLibrary.ADAL) {
                const split = content.split('%');
                if (split.length !== 2) {
                    throw new Error('File didn\'t contain the auth tag.');
                }
                decipherIv.setAuthTag(Buffer.from(split[1], this._binaryEncoding));
                encryptedText = split[0];
            }
            return `${decipherIv.update(encryptedText, this._binaryEncoding, 'utf8')}${decipherIv.final('utf8')}`;
        });
        this._algorithm = this._authLibrary === azure_1.AuthLibrary.MSAL ? 'aes-256-cbc' : 'aes-256-gcm';
        this._bufferEncoding = this._authLibrary === azure_1.AuthLibrary.MSAL ? 'utf16le' : 'hex';
        this._binaryEncoding = this._authLibrary === azure_1.AuthLibrary.MSAL ? 'base64' : 'hex';
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const ivCredId = `${this._fileName}-iv`;
            const keyCredId = `${this._fileName}-key`;
            const iv = yield this.readEncryptionKey(ivCredId);
            const key = yield this.readEncryptionKey(keyCredId);
            if (!iv || !key) {
                this._ivBuffer = crypto.randomBytes(16);
                this._keyBuffer = crypto.randomBytes(32);
                if (!(yield this.saveEncryptionKey(ivCredId, this._ivBuffer.toString(this._bufferEncoding)))
                    || !(yield this.saveEncryptionKey(keyCredId, this._keyBuffer.toString(this._bufferEncoding)))) {
                    this._logger.error(`Encryption keys could not be saved in credential store, this will cause access token persistence issues.`);
                    yield this.showCredSaveErrorOnWindows();
                }
            }
            else {
                this._ivBuffer = Buffer.from(iv, this._bufferEncoding);
                this._keyBuffer = Buffer.from(key, this._bufferEncoding);
            }
        });
    }
    /**
     * Creates credential Id similar to ADS to prevent creating multiple credentials
     * and this will also be read by STS in same pattern.
     * @param credentialId Credential Id
     * @returns Prefix credential Id.
     */
    getPrefixedCredentialId(credentialId) {
        return `${constants_1.azureAccountProviderCredentials}|${credentialId}`;
    }
    readEncryptionKey(credentialId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return (_a = (yield this._credentialStore.readCredential(this.getPrefixedCredentialId(credentialId)))) === null || _a === void 0 ? void 0 : _a.password;
        });
    }
    saveEncryptionKey(credentialId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let status = false;
            let prefixedCredentialId = this.getPrefixedCredentialId(credentialId);
            try {
                yield this._credentialStore.saveCredential(prefixedCredentialId, password)
                    .then((result) => {
                    status = result;
                    if (result) {
                        this._logger.info(`FileEncryptionHelper: Successfully saved encryption key ${prefixedCredentialId} for ${this._authLibrary} persistent cache encryption in system credential store.`);
                    }
                }, (e => {
                    throw Error(`FileEncryptionHelper: Could not save encryption key: ${prefixedCredentialId}: ${e}`);
                }));
            }
            catch (ex) {
                if (os.platform() === 'win32') {
                    this._logger.error(`FileEncryptionHelper: Please try cleaning saved credentials from Windows Credential Manager created by Azure Data Studio to allow creating new credentials.`);
                }
                this._logger.error(ex);
                throw ex;
            }
            return status;
        });
    }
    showCredSaveErrorOnWindows() {
        return __awaiter(this, void 0, void 0, function* () {
            if (os.platform() === 'win32') {
                yield this._vscodeWrapper.showWarningMessageAdvanced(LocalizedConstants.msgAzureCredStoreSaveFailedError, undefined, [LocalizedConstants.reloadChoice, LocalizedConstants.cancel])
                    .then((selection) => __awaiter(this, void 0, void 0, function* () {
                    if (selection === LocalizedConstants.reloadChoice) {
                        yield vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                }), error => {
                    this._logger.error(error);
                });
            }
        });
    }
}
exports.FileEncryptionHelper = FileEncryptionHelper;

//# sourceMappingURL=fileEncryptionHelper.js.map
