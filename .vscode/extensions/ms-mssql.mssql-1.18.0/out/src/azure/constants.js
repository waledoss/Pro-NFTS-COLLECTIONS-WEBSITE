"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.constants = exports.ProxyStatus = exports.HttpStatus = exports.HttpMethod = exports.AccountIssuer = exports.selectAccount = exports.s256CodeChallengeMethod = exports.bearer = exports.accountVersion = exports.oldMsalCacheFileName = exports.azureTenantConfigSection = exports.accountsAzureCloudSection = exports.accountsAzureAuthSection = exports.accountsClearTokenCacheCommand = exports.mssqlAuthenticationProviderConfig = exports.sqlAuthProviderSection = exports.tenantSection = exports.mssqlSection = exports.configSection = exports.clearTokenCacheCommand = exports.cloudSection = exports.azureAccountProviderCredentials = exports.azureSection = exports.authSection = exports.accountsSection = exports.account = exports.homeCategory = exports.azureAccountDirectory = exports.extensionConfigSectionName = exports.httpConfigSectionName = exports.serviceName = void 0;
exports.serviceName = 'Code';
exports.httpConfigSectionName = 'http';
exports.extensionConfigSectionName = 'mssql';
exports.azureAccountDirectory = 'Azure Accounts';
exports.homeCategory = 'Home';
exports.account = 'account';
exports.accountsSection = 'accounts';
exports.authSection = 'auth';
exports.azureSection = 'azure';
exports.azureAccountProviderCredentials = 'azureAccountProviderCredentials';
exports.cloudSection = 'cloud';
exports.clearTokenCacheCommand = 'clearTokenCache';
exports.configSection = 'config';
exports.mssqlSection = 'mssql';
exports.tenantSection = 'tenant';
exports.sqlAuthProviderSection = 'enableSqlAuthenticationProvider';
exports.mssqlAuthenticationProviderConfig = exports.mssqlSection + '.' + exports.sqlAuthProviderSection;
exports.accountsClearTokenCacheCommand = exports.accountsSection + '.' + exports.clearTokenCacheCommand;
exports.accountsAzureAuthSection = exports.accountsSection + '.' + exports.azureSection + '.' + exports.authSection;
exports.accountsAzureCloudSection = exports.accountsSection + '.' + exports.azureSection + '.' + exports.cloudSection;
exports.azureTenantConfigSection = exports.azureSection + '.' + exports.tenantSection + '.' + exports.configSection;
exports.oldMsalCacheFileName = 'azureTokenCacheMsal-azure_publicCloud';
/** MSAL Account version */
exports.accountVersion = '2.0';
exports.bearer = 'Bearer';
/**
 * Use SHA-256 algorithm
 */
exports.s256CodeChallengeMethod = 'S256';
exports.selectAccount = 'select_account';
/**
 * Account issuer as received from access token
 */
var AccountIssuer;
(function (AccountIssuer) {
    AccountIssuer["Corp"] = "corp";
    AccountIssuer["Msft"] = "msft";
})(AccountIssuer = exports.AccountIssuer || (exports.AccountIssuer = {}));
/**
 * http methods
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "get";
    HttpMethod["POST"] = "post";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["SUCCESS_RANGE_START"] = 200] = "SUCCESS_RANGE_START";
    HttpStatus[HttpStatus["SUCCESS_RANGE_END"] = 299] = "SUCCESS_RANGE_END";
    HttpStatus[HttpStatus["REDIRECT"] = 302] = "REDIRECT";
    HttpStatus[HttpStatus["CLIENT_ERROR_RANGE_START"] = 400] = "CLIENT_ERROR_RANGE_START";
    HttpStatus[HttpStatus["CLIENT_ERROR_RANGE_END"] = 499] = "CLIENT_ERROR_RANGE_END";
    HttpStatus[HttpStatus["SERVER_ERROR_RANGE_START"] = 500] = "SERVER_ERROR_RANGE_START";
    HttpStatus[HttpStatus["SERVER_ERROR_RANGE_END"] = 599] = "SERVER_ERROR_RANGE_END";
})(HttpStatus = exports.HttpStatus || (exports.HttpStatus = {}));
var ProxyStatus;
(function (ProxyStatus) {
    ProxyStatus[ProxyStatus["SUCCESS_RANGE_START"] = 200] = "SUCCESS_RANGE_START";
    ProxyStatus[ProxyStatus["SUCCESS_RANGE_END"] = 299] = "SUCCESS_RANGE_END";
    ProxyStatus[ProxyStatus["SERVER_ERROR"] = 500] = "SERVER_ERROR";
})(ProxyStatus = exports.ProxyStatus || (exports.ProxyStatus = {}));
/**
 * Constants
 */
exports.constants = {
    MSAL_SKU: 'msal.js.node',
    JWT_BEARER_ASSERTION_TYPE: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    AUTHORIZATION_PENDING: 'authorization_pending',
    HTTP_PROTOCOL: 'http://',
    LOCALHOST: 'localhost'
};

//# sourceMappingURL=constants.js.map
