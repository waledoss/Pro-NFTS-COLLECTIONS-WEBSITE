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
exports.SimpleTokenCache = void 0;
const path_1 = require("path");
const azure_1 = require("../../models/contracts/azure");
const fileEncryptionHelper_1 = require("../fileEncryptionHelper");
const storageService_1 = require("./storageService");
// allow-any-unicode-next-line
const separator = '§';
function getFileKeytar(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileKeytar = {
            getPassword(service, account) {
                return __awaiter(this, void 0, void 0, function* () {
                    return db.get(`${service}${separator}${account}`);
                });
            },
            setPassword(service, account, password) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield db.set(`${service}${separator}${account}`, password);
                });
            },
            deletePassword(service, account) {
                return __awaiter(this, void 0, void 0, function* () {
                    return yield db.remove(`${service}${separator}${account}`);
                });
            },
            getPasswords(service) {
                return __awaiter(this, void 0, void 0, function* () {
                    const result = db.getPrefix(`${service}`);
                    if (!result) {
                        return [];
                    }
                    return result.map(({ key, value }) => {
                        return {
                            account: key.split(separator)[1],
                            password: value
                        };
                    });
                });
            }
        };
        return fileKeytar;
    });
}
class SimpleTokenCache {
    constructor(_serviceName, _credentialStore, _vscodeWrapper, _logger, _userStoragePath) {
        this._serviceName = _serviceName;
        this._credentialStore = _credentialStore;
        this._vscodeWrapper = _vscodeWrapper;
        this._logger = _logger;
        this._userStoragePath = _userStoragePath;
    }
    // tslint:disable:no-empty
    clear() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this._serviceName = this._serviceName.replace(/-/g, '_');
            let filePath = path_1.join(this._userStoragePath, this._serviceName);
            let fileEncryptionHelper = new fileEncryptionHelper_1.FileEncryptionHelper(azure_1.AuthLibrary.ADAL, this._credentialStore, this._vscodeWrapper, this._logger, this._serviceName);
            this.db = new storageService_1.StorageService(filePath, this._logger, fileEncryptionHelper.fileOpener, fileEncryptionHelper.fileSaver);
            yield this.db.initialize();
            this.keytar = yield getFileKeytar(this.db);
        });
    }
    set(id, key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id.includes(separator)) {
                throw new Error('Separator included in ID');
            }
            try {
                const keytar = this.getKeytar();
                return yield keytar.setPassword(this._serviceName, id, key);
            }
            catch (ex) {
                console.warn(`Adding key failed: ${ex}`);
            }
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keytar = this.getKeytar();
                const result = yield keytar.getPassword(this._serviceName, id);
                if (result === null) {
                    return undefined;
                }
                return result;
            }
            catch (ex) {
                console.warn(`Getting key failed: ${ex}`);
                return undefined;
            }
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keytar = this.getKeytar();
                return yield keytar.deletePassword(this._serviceName, id);
            }
            catch (ex) {
                console.warn(`Clearing key failed: ${ex}`);
                return false;
            }
        });
    }
    findCredentials(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keytar = this.getKeytar();
                return yield keytar.getPasswords(`${this._serviceName}${separator}${prefix}`);
            }
            catch (ex) {
                console.warn(`Finding credentials failed: ${ex}`);
                return [];
            }
        });
    }
    getKeytar() {
        if (!this.keytar) {
            throw new Error('Keytar not initialized');
        }
        return this.keytar;
    }
}
exports.SimpleTokenCache = SimpleTokenCache;

//# sourceMappingURL=adalCacheService.js.map
