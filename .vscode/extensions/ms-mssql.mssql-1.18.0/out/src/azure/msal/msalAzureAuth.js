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
exports.MsalAzureAuth = void 0;
const msal_node_1 = require("@azure/msal-node");
const url = require("url");
const vscode = require("vscode");
const LocalizedConstants = require("../../constants/localizedConstants");
const azure_1 = require("../../models/contracts/azure");
const Utils = require("../../models/utils");
const azureAuthError_1 = require("../azureAuthError");
const Constants = require("../constants");
const azureUtils = require("../utils");
// tslint:disable:no-null-keyword
class MsalAzureAuth {
    constructor(providerSettings, context, clientApplication, authType, vscodeWrapper, logger) {
        var _a;
        this.providerSettings = providerSettings;
        this.context = context;
        this.clientApplication = clientApplication;
        this.authType = authType;
        this.vscodeWrapper = vscodeWrapper;
        this.logger = logger;
        this.loginEndpointUrl = (_a = this.providerSettings.loginEndpoint) !== null && _a !== void 0 ? _a : 'https://login.microsoftonline.com/';
        this.commonTenant = {
            id: 'common',
            displayName: 'common'
        };
        this.organizationTenant = {
            id: 'organizations',
            displayName: 'organizations'
        };
        // Use localhost for MSAL instead of this.providerSettings.redirectUri (kept as-is for ADAL only);
        this.redirectUri = 'http://localhost';
        this.clientId = this.providerSettings.clientId;
        this.scopes = [...this.providerSettings.scopes];
        this.scopesString = this.scopes.join(' ');
        this.httpClient = azureUtils.getProxyEnabledHttpClient();
    }
    startLogin() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let loginComplete = undefined;
            try {
                this.logger.verbose('Starting login');
                if (!this.providerSettings.resources.windowsManagementResource) {
                    throw new Error(Utils.formatString(LocalizedConstants.azureNoMicrosoftResource, this.providerSettings.displayName));
                }
                const result = yield this.login(this.organizationTenant);
                loginComplete = result.authComplete;
                if (!(result === null || result === void 0 ? void 0 : result.response) || !((_a = result.response) === null || _a === void 0 ? void 0 : _a.account)) {
                    this.logger.error(`Authentication failed: ${loginComplete}`);
                    return {
                        canceled: false
                    };
                }
                const token = {
                    token: result.response.accessToken,
                    key: result.response.account.homeAccountId,
                    tokenType: result.response.tokenType
                };
                const tokenClaims = result.response.idTokenClaims;
                const account = yield this.hydrateAccount(token, tokenClaims);
                loginComplete === null || loginComplete === void 0 ? void 0 : loginComplete.resolve();
                return account;
            }
            catch (ex) {
                this.logger.error(`Login failed: ${ex}`);
                if (ex instanceof azureAuthError_1.AzureAuthError) {
                    if (loginComplete) {
                        loginComplete.reject(ex);
                        this.logger.error(ex);
                    }
                    else {
                        void vscode.window.showErrorMessage(ex.message);
                        this.logger.error(ex.originalMessageAndException);
                    }
                }
                else {
                    this.logger.error(ex);
                }
                return {
                    canceled: false
                };
            }
        });
    }
    hydrateAccount(token, tokenClaims) {
        return __awaiter(this, void 0, void 0, function* () {
            const tenants = yield this.getTenants(token.token);
            let account = this.createAccount(tokenClaims, token.key, tenants);
            return account;
        });
    }
    /**
     * Gets the access token for the correct account and scope from the token cache, if the correct token doesn't exist in the token cache
     * (i.e. expired token, wrong scope, etc.), sends a request for a new token using the refresh token
     * @param account
     * @param azureResource
     * @returns The authentication result, including the access token
     */
    getToken(account, tenantId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            let accountInfo = yield this.getAccountFromMsalCache(account.key.id);
            // Resource endpoint must end with '/' to form a valid scope for MSAL token request.
            const endpoint = settings.endpoint.endsWith('/') ? settings.endpoint : settings.endpoint + '/';
            if (!account) {
                this.logger.error('Error: Account not received.');
                return null;
            }
            if (!tenantId) {
                tenantId = account.properties.owningTenant.id;
            }
            let newScope;
            if (settings.id === this.providerSettings.resources.windowsManagementResource.id) {
                newScope = [`${endpoint}user_impersonation`];
            }
            else {
                newScope = [`${endpoint}.default`];
            }
            let authority = this.loginEndpointUrl + tenantId;
            this.logger.info(`Authority URL set to: ${authority}`);
            // construct request
            // forceRefresh needs to be set true here in order to fetch the correct token, due to this issue
            // https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/3687
            const tokenRequest = {
                account: accountInfo,
                authority: authority,
                scopes: newScope,
                forceRefresh: true
            };
            try {
                return yield this.clientApplication.acquireTokenSilent(tokenRequest);
            }
            catch (e) {
                this.logger.error('Failed to acquireTokenSilent', e);
                if (e instanceof msal_node_1.InteractionRequiredAuthError) {
                    // build refresh token request
                    const tenant = {
                        id: tenantId,
                        displayName: ''
                    };
                    return this.handleInteractionRequired(tenant, settings);
                }
                else if (e.name === 'ClientAuthError') {
                    this.logger.error(e.message);
                }
                this.logger.error(`Failed to silently acquire token, not InteractionRequiredAuthError: ${e.message}`);
                throw e;
            }
        });
    }
    refreshAccessToken(account, tenantId, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenResult = yield this.getToken(account, tenantId, settings);
                if (!tokenResult) {
                    account.isStale = true;
                    return account;
                }
                const tokenClaims = this.getTokenClaims(tokenResult.accessToken);
                if (!tokenClaims) {
                    account.isStale = true;
                    return account;
                }
                const token = {
                    key: tokenResult.account.homeAccountId,
                    token: tokenResult.accessToken,
                    tokenType: tokenResult.tokenType,
                    expiresOn: tokenResult.account.idTokenClaims.exp
                };
                return yield this.hydrateAccount(token, tokenClaims);
            }
            catch (ex) {
                account.isStale = true;
                throw ex;
            }
        });
    }
    loadTokenCache() {
        return __awaiter(this, void 0, void 0, function* () {
            let tokenCache = this.clientApplication.getTokenCache();
            tokenCache.getAllAccounts();
        });
    }
    getAccountFromMsalCache(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this.clientApplication.getTokenCache();
            if (!cache) {
                this.logger.error('Error: Could not fetch token cache.');
                return null;
            }
            let account;
            // if the accountId is a home ID, it will include a '.' character
            if (accountId.includes('.')) {
                account = yield cache.getAccountByHomeId(accountId);
            }
            else {
                account = yield cache.getAccountByLocalId(accountId);
            }
            return account;
        });
    }
    getTenants(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const tenantUri = url.resolve(this.providerSettings.resources.azureManagementResource.endpoint, 'tenants?api-version=2019-11-01');
            try {
                this.logger.verbose('Fetching tenants with uri {0}', tenantUri);
                let tenantList = [];
                const tenantResponse = yield this.httpClient.sendGetRequestAsync(tenantUri, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = tenantResponse.body;
                if (data.error) {
                    this.logger.error(`Error fetching tenants :${data.error.code} - ${data.error.message}`);
                    throw new Error(`${data.error.code} - ${data.error.message}`);
                }
                const tenants = data.value.map((tenantInfo) => {
                    if (tenantInfo.displayName) {
                        tenantList.push(tenantInfo.displayName);
                    }
                    else {
                        tenantList.push(tenantInfo.tenantId);
                        this.logger.info('Tenant display name found empty: {0}', tenantInfo.tenantId);
                    }
                    return {
                        id: tenantInfo.tenantId,
                        displayName: tenantInfo.displayName ? tenantInfo.displayName : tenantInfo.tenantId,
                        userId: token,
                        tenantCategory: tenantInfo.tenantCategory
                    };
                });
                this.logger.verbose(`Tenants: ${tenantList}`);
                const homeTenantIndex = tenants.findIndex(tenant => tenant.tenantCategory === Constants.homeCategory);
                // remove home tenant from list of tenants
                if (homeTenantIndex >= 0) {
                    const homeTenant = tenants.splice(homeTenantIndex, 1);
                    tenants.unshift(homeTenant[0]);
                }
                this.logger.verbose(`Filtered Tenants: ${tenantList}`);
                return tenants;
            }
            catch (ex) {
                this.logger.error(`Error fetching tenants :${ex}`);
                throw ex;
            }
        });
    }
    //#region interaction handling
    handleInteractionRequired(tenant, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const shouldOpen = yield this.askUserForInteraction(tenant, settings);
            if (shouldOpen) {
                const result = yield this.login(tenant);
                (_a = result === null || result === void 0 ? void 0 : result.authComplete) === null || _a === void 0 ? void 0 : _a.resolve();
                return result === null || result === void 0 ? void 0 : result.response;
            }
            return null;
        });
    }
    /**
     * Asks the user if they would like to do the interaction based authentication as required by OAuth2
     * @param tenant
     * @param resource
     */
    askUserForInteraction(tenant, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tenant.displayName && !tenant.id) {
                throw new Error('Tenant did not have display name or id');
            }
            const getTenantConfigurationSet = () => {
                var _a;
                const configuration = vscode.workspace.getConfiguration(Constants.azureTenantConfigSection);
                let values = (_a = configuration.get('filter')) !== null && _a !== void 0 ? _a : [];
                return new Set(values);
            };
            // The user wants to ignore this tenant.
            if (getTenantConfigurationSet().has(tenant.id)) {
                this.logger.info(`Tenant ${tenant.id} found in the ignore list, authentication will not be attempted.`);
                return false;
            }
            const updateTenantConfigurationSet = (set) => __awaiter(this, void 0, void 0, function* () {
                const configuration = vscode.workspace.getConfiguration('azure.tenant.config');
                yield configuration.update('filter', Array.from(set), vscode.ConfigurationTarget.Global);
            });
            const openItem = {
                title: LocalizedConstants.azureConsentDialogOpen,
                booleanResult: true
            };
            const closeItem = {
                title: LocalizedConstants.azureConsentDialogCancel,
                isCloseAffordance: true,
                booleanResult: false
            };
            const dontAskAgainItem = {
                title: LocalizedConstants.azureConsentDialogIgnore,
                booleanResult: false,
                action: (tenantId) => __awaiter(this, void 0, void 0, function* () {
                    let set = getTenantConfigurationSet();
                    set.add(tenantId);
                    yield updateTenantConfigurationSet(set);
                })
            };
            const messageBody = Utils.formatString(LocalizedConstants.azureConsentDialogBody, tenant.displayName, tenant.id, settings.id);
            const result = yield vscode.window.showInformationMessage(messageBody, { modal: true }, openItem, closeItem, dontAskAgainItem);
            if (result === null || result === void 0 ? void 0 : result.action) {
                yield result.action(tenant.id);
            }
            return (result === null || result === void 0 ? void 0 : result.booleanResult) || false;
        });
    }
    //#endregion
    //#region data modeling
    createAccount(tokenClaims, key, tenants) {
        var _a, _b, _c, _d, _e, _f;
        this.logger.verbose(`Token Claims acccount: ${tokenClaims.name}, TID: ${tokenClaims.tid}`);
        tenants.forEach((tenant) => {
            this.logger.verbose(`Tenant ID: ${tenant.id}, Tenant Name: ${tenant.displayName}`);
        });
        // Determine if this is a microsoft account
        let accountIssuer = 'unknown';
        if (tokenClaims.iss === 'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/' ||
            tokenClaims.iss === `${this.loginEndpointUrl}72f988bf-86f1-41af-91ab-2d7cd011db47/v2.0`) {
            accountIssuer = Constants.AccountIssuer.Corp;
        }
        if ((tokenClaims === null || tokenClaims === void 0 ? void 0 : tokenClaims.idp) === 'live.com') {
            accountIssuer = Constants.AccountIssuer.Msft;
        }
        const name = (_c = (_b = (_a = tokenClaims.name) !== null && _a !== void 0 ? _a : tokenClaims.email) !== null && _b !== void 0 ? _b : tokenClaims.unique_name) !== null && _c !== void 0 ? _c : tokenClaims.preferred_username;
        const email = (_e = (_d = tokenClaims.email) !== null && _d !== void 0 ? _d : tokenClaims.unique_name) !== null && _e !== void 0 ? _e : tokenClaims.preferred_username;
        let owningTenant = this.commonTenant; // default to common tenant
        // Read more about tid > https://learn.microsoft.com/azure/active-directory/develop/id-tokens
        if (tokenClaims.tid) {
            owningTenant = (_f = tenants.find(t => t.id === tokenClaims.tid)) !== null && _f !== void 0 ? _f : { 'id': tokenClaims.tid, 'displayName': 'Microsoft Account' };
        }
        else {
            this.logger.info('Could not find tenant information from tokenClaims, falling back to common Tenant.');
        }
        let displayName = name;
        if (email) {
            displayName = `${displayName} - ${email}`;
        }
        let contextualDisplayName;
        switch (accountIssuer) {
            case Constants.AccountIssuer.Corp:
                contextualDisplayName = LocalizedConstants.azureMicrosoftCorpAccount;
                break;
            case Constants.AccountIssuer.Msft:
                contextualDisplayName = LocalizedConstants.azureMicrosoftAccount;
                break;
            default:
                contextualDisplayName = displayName;
        }
        let accountType = accountIssuer === Constants.AccountIssuer.Msft
            ? azure_1.AccountType.Microsoft
            : azure_1.AccountType.WorkSchool;
        const account = {
            key: {
                providerId: this.providerSettings.id,
                id: key,
                accountVersion: Constants.accountVersion
            },
            name: displayName,
            displayInfo: {
                accountType: accountType,
                userId: key,
                contextualDisplayName: contextualDisplayName,
                displayName,
                email,
                name
            },
            properties: {
                providerSettings: this.providerSettings,
                isMsAccount: accountIssuer === Constants.AccountIssuer.Msft,
                owningTenant: owningTenant,
                tenants,
                azureAuthType: this.authType
            },
            isStale: false
        };
        return account;
    }
    //#endregion
    //#region inconsequential
    getTokenClaims(accessToken) {
        try {
            const split = accessToken.split('.');
            return JSON.parse(Buffer.from(split[1], 'base64').toString('utf8'));
        }
        catch (ex) {
            throw new Error('Unable to read token claims: ' + JSON.stringify(ex));
        }
    }
    toBase64UrlEncoding(base64string) {
        return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); // Need to use base64url encoding
    }
    deleteAllCache() {
        return __awaiter(this, void 0, void 0, function* () {
            this.clientApplication.clearCache();
        });
    }
    clearCredentials(account) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenCache = this.clientApplication.getTokenCache();
                let accountInfo = yield this.getAccountFromMsalCache(account.key.id);
                yield tokenCache.removeAccount(accountInfo);
            }
            catch (ex) {
                // We need not prompt user for error if token could not be removed from cache.
                this.logger.error('Error when removing token from cache: ', ex);
            }
        });
    }
    // tslint:disable:no-empty
    autoOAuthCancelled() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.MsalAzureAuth = MsalAzureAuth;
//#endregion

//# sourceMappingURL=msalAzureAuth.js.map
