"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
exports.AdalAzureController = void 0;
const Constants = require("../../constants/constants");
const LocalizedConstants = require("../../constants/localizedConstants");
const azureUtils = require("../utils");
const ads_adal_library_1 = require("@microsoft/ads-adal-library");
const providerSettings_1 = require("../../azure/providerSettings");
const azure_1 = require("../../models/contracts/azure");
const azureController_1 = require("../azureController");
const utils_1 = require("../utils");
const adalCacheService_1 = require("./adalCacheService");
const azureAuthRequest_1 = require("./azureAuthRequest");
const azureErrorLookup_1 = require("./azureErrorLookup");
const azureMessageDisplayer_1 = require("./azureMessageDisplayer");
const azureStringLookup_1 = require("./azureStringLookup");
const azureUserInteraction_1 = require("./azureUserInteraction");
class AdalAzureController extends azureController_1.AzureController {
    constructor() {
        super(...arguments);
        this._authMappings = new Map();
    }
    init() {
        this.azureStringLookup = new azureStringLookup_1.AzureStringLookup();
        this.azureErrorLookup = new azureErrorLookup_1.AzureErrorLookup();
        this.azureMessageDisplayer = new azureMessageDisplayer_1.AzureMessageDisplayer();
    }
    loadTokenCache() {
        return __awaiter(this, void 0, void 0, function* () {
            let authType = utils_1.getAzureActiveDirectoryConfig();
            if (!this._authMappings.has(authType)) {
                yield this.handleAuthMapping();
            }
        });
    }
    login(authType) {
        return __awaiter(this, void 0, void 0, function* () {
            let azureAuth = yield this.getAzureAuthInstance(authType);
            let response = yield azureAuth.startLogin();
            return response ? response : undefined;
        });
    }
    getAccountSecurityToken(account, tenantId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            let token;
            let azureAuth = yield this.getAzureAuthInstance(utils_1.getAzureActiveDirectoryConfig());
            tenantId = tenantId ? tenantId : azureAuth.getHomeTenant(account).id;
            token = yield azureAuth.getAccountSecurityToken(account, tenantId, settings);
            return token;
        });
    }
    refreshAccessToken(account, accountStore, tenantId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let token;
                let azureAuth = yield this.getAzureAuthInstance(utils_1.getAzureActiveDirectoryConfig());
                let newAccount = yield azureAuth.refreshAccess(account);
                if (newAccount.isStale === true) {
                    return undefined;
                }
                yield accountStore.addAccount(newAccount);
                token = yield this.getAccountSecurityToken(account, tenantId, settings);
                return token;
            }
            catch (ex) {
                let errorMsg = this.azureErrorLookup.getSimpleError(ex.errorCode);
                this._vscodeWrapper.showErrorMessage(errorMsg);
            }
        });
    }
    /**
     * Gets the token for given account and updates the connection profile with token information needed for AAD authentication
     */
    populateAccountProperties(profile, accountStore, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            let account = yield this.addAccount(accountStore);
            profile.user = account.displayInfo.displayName;
            profile.email = account.displayInfo.email;
            profile.accountId = account.key.id;
            if (!profile.tenantId) {
                yield this.promptForTenantChoice(account, profile);
            }
            const token = yield this.getAccountSecurityToken(account, profile.tenantId, settings);
            if (!token) {
                let errorMessage = LocalizedConstants.msgGetTokenFail;
                this.logger.error(errorMessage);
                this._vscodeWrapper.showErrorMessage(errorMessage);
            }
            else {
                profile.azureAccountToken = token.token;
                profile.expiresOn = token.expiresOn;
            }
            return profile;
        });
    }
    refreshTokenWrapper(profile, accountStore, accountAnswer, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            let account = accountStore.getAccount(accountAnswer.key.id);
            if (!account) {
                yield this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgAccountNotFound);
                throw new Error(LocalizedConstants.msgAccountNotFound);
            }
            let azureAccountToken = yield this.refreshToken(account, accountStore, settings, profile.tenantId);
            if (!azureAccountToken) {
                let errorMessage = LocalizedConstants.msgAccountRefreshFailed;
                return this._vscodeWrapper.showErrorMessage(errorMessage, LocalizedConstants.refreshTokenLabel).then((result) => __awaiter(this, void 0, void 0, function* () {
                    if (result === LocalizedConstants.refreshTokenLabel) {
                        let refreshedProfile = yield this.populateAccountProperties(profile, accountStore, settings);
                        return refreshedProfile;
                    }
                    else {
                        return undefined;
                    }
                }));
            }
            profile.azureAccountToken = azureAccountToken.token;
            profile.expiresOn = azureAccountToken.expiresOn;
            profile.user = account.displayInfo.displayName;
            profile.email = account.displayInfo.email;
            profile.accountId = account.key.id;
            return profile;
        });
    }
    refreshToken(account, accountStore, settings, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let token;
                let azureAuth = yield this.getAzureAuthInstance(utils_1.getAzureActiveDirectoryConfig());
                let newAccount = yield azureAuth.refreshAccess(account);
                if (newAccount.isStale === true) {
                    return undefined;
                }
                yield accountStore.addAccount(newAccount);
                token = yield this.getAccountSecurityToken(account, tenantId, settings);
                return token;
            }
            catch (ex) {
                let errorMsg = this.azureErrorLookup.getSimpleError(ex.errorCode);
                this._vscodeWrapper.showErrorMessage(errorMsg);
            }
        });
    }
    /**
     * Returns Azure sessions with subscriptions, tenant and token for each given account
     */
    getAccountSessions(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let sessions = [];
            const tenants = account.properties.tenants;
            for (const tenantId of tenants.map(t => t.id)) {
                const token = yield this.getAccountSecurityToken(account, tenantId, providerSettings_1.default.resources.azureManagementResource);
                const subClient = this._subscriptionClientFactory(token);
                const newSubPages = subClient.subscriptions.list();
                const array = yield azureUtils.getAllValues(newSubPages, (nextSub) => {
                    return {
                        subscription: nextSub,
                        tenantId: tenantId,
                        account: account,
                        token: token
                    };
                });
                sessions = sessions.concat(array);
            }
            return sessions.sort((a, b) => (a.subscription.displayName || '').localeCompare(b.subscription.displayName || ''));
        });
    }
    handleAuthMapping() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._credentialStoreInitialized) {
                let storagePath = yield this.findOrMakeStoragePath();
                // ADAL Cache Service
                this.cacheProvider = new adalCacheService_1.SimpleTokenCache(Constants.adalCacheFileName, this._credentialStore, this._vscodeWrapper, this.logger, storagePath);
                yield this.cacheProvider.init();
                this.storageService = this.cacheProvider.db;
                // MSAL Cache Provider
                this._credentialStoreInitialized = true;
                this.logger.verbose(`Credential store initialized.`);
                this.authRequest = new azureAuthRequest_1.AzureAuthRequest(this.context, this.logger);
                yield this.authRequest.startServer();
                this.azureUserInteraction = new azureUserInteraction_1.AzureUserInteraction(this.authRequest.getState());
            }
            this._authMappings.clear();
            const configuration = utils_1.getAzureActiveDirectoryConfig();
            if (configuration === azure_1.AzureAuthType.AuthCodeGrant) {
                this._authMappings.set(azure_1.AzureAuthType.AuthCodeGrant, new ads_adal_library_1.AzureCodeGrant(providerSettings_1.default, this.storageService, this.cacheProvider, this.logger, this.azureMessageDisplayer, this.azureErrorLookup, this.azureUserInteraction, this.azureStringLookup, this.authRequest));
            }
            else if (configuration === azure_1.AzureAuthType.DeviceCode) {
                this._authMappings.set(azure_1.AzureAuthType.DeviceCode, new ads_adal_library_1.AzureDeviceCode(providerSettings_1.default, this.storageService, this.cacheProvider, this.logger, this.azureMessageDisplayer, this.azureErrorLookup, this.azureUserInteraction, this.azureStringLookup, this.authRequest));
            }
        });
    }
    getAzureAuthInstance(authType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._authMappings.has(authType)) {
                yield this.handleAuthMapping();
            }
            return this._authMappings.get(authType);
        });
    }
    removeAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let azureAuth = yield this.getAzureAuthInstance(utils_1.getAzureActiveDirectoryConfig());
            yield azureAuth.deleteAccountCache(account.key);
            this.logger.verbose(`Account deleted from cache successfully: ${account.key.id}`);
        });
    }
    /**
     * Returns true if token is invalid or expired
     * @param token Token
     * @param token expiry
     */
    static isTokenInValid(token, expiresOn) {
        return (!token || this.isTokenExpired(expiresOn));
    }
    /**
     * Returns true if token is expired
     * @param token expiry
     */
    static isTokenExpired(expiresOn) {
        if (!expiresOn) {
            return true;
        }
        const currentTime = new Date().getTime() / 1000;
        const maxTolerance = 2 * 60; // two minutes
        return (expiresOn - currentTime < maxTolerance);
    }
}
exports.AdalAzureController = AdalAzureController;

//# sourceMappingURL=adalAzureController.js.map
