"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountType = exports.AzureAuthType = exports.AuthLibrary = void 0;
var AuthLibrary;
(function (AuthLibrary) {
    AuthLibrary["ADAL"] = "ADAL";
    AuthLibrary["MSAL"] = "MSAL";
})(AuthLibrary = exports.AuthLibrary || (exports.AuthLibrary = {}));
var AzureAuthType;
(function (AzureAuthType) {
    AzureAuthType[AzureAuthType["AuthCodeGrant"] = 0] = "AuthCodeGrant";
    AzureAuthType[AzureAuthType["DeviceCode"] = 1] = "DeviceCode";
})(AzureAuthType = exports.AzureAuthType || (exports.AzureAuthType = {}));
var AccountType;
(function (AccountType) {
    AccountType["Microsoft"] = "microsoft";
    AccountType["WorkSchool"] = "work_school";
})(AccountType = exports.AccountType || (exports.AccountType = {}));

//# sourceMappingURL=azure.js.map
