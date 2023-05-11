"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDatabaseReferencesRequest = exports.DeleteDatabaseReferenceRequest = exports.AddSystemDatabaseReferenceRequest = exports.AddSqlProjectReferenceRequest = exports.AddDacpacReferenceRequest = exports.GetSqlCmdVariablesRequest = exports.UpdateSqlCmdVariableRequest = exports.DeleteSqlCmdVariableRequest = exports.AddSqlCmdVariableRequest = exports.MoveNoneItemRequest = exports.GetNoneItemsRequest = exports.ExcludeNoneItemRequest = exports.DeleteNoneItemRequest = exports.AddNoneItemRequest = exports.GetPreDeploymentScriptsRequest = exports.GetPostDeploymentScriptsRequest = exports.MovePreDeploymentScriptRequest = exports.MovePostDeploymentScriptRequest = exports.ExcludePreDeploymentScriptRequest = exports.ExcludePostDeploymentScriptRequest = exports.DeletePreDeploymentScriptRequest = exports.DeletePostDeploymentScriptRequest = exports.AddPreDeploymentScriptRequest = exports.AddPostDeploymentScriptRequest = exports.GetFoldersRequest = exports.DeleteFolderRequest = exports.AddFolderRequest = exports.GetSqlObjectScriptsRequest = exports.MoveSqlObjectScriptRequest = exports.ExcludeSqlObjectScriptRequest = exports.DeleteSqlObjectScriptRequest = exports.AddSqlObjectScriptRequest = exports.SetDatabaseSchemaProviderRequest = exports.SetDatabaseSourceRequest = exports.GetProjectPropertiesRequest = exports.UpdateProjectForCrossPlatformRequest = exports.GetCrossPlatformCompatibilityRequest = exports.CloseSqlProjectRequest = exports.OpenSqlProjectRequest = exports.CreateSqlProjectRequest = void 0;
const vscode_languageclient_1 = require("vscode-languageclient");
//#region Project-level functions
var CreateSqlProjectRequest;
(function (CreateSqlProjectRequest) {
    CreateSqlProjectRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/createProject');
})(CreateSqlProjectRequest = exports.CreateSqlProjectRequest || (exports.CreateSqlProjectRequest = {}));
var OpenSqlProjectRequest;
(function (OpenSqlProjectRequest) {
    OpenSqlProjectRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/openProject');
})(OpenSqlProjectRequest = exports.OpenSqlProjectRequest || (exports.OpenSqlProjectRequest = {}));
var CloseSqlProjectRequest;
(function (CloseSqlProjectRequest) {
    CloseSqlProjectRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/closeProject');
})(CloseSqlProjectRequest = exports.CloseSqlProjectRequest || (exports.CloseSqlProjectRequest = {}));
var GetCrossPlatformCompatibilityRequest;
(function (GetCrossPlatformCompatibilityRequest) {
    GetCrossPlatformCompatibilityRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getCrossPlatformCompatibility');
})(GetCrossPlatformCompatibilityRequest = exports.GetCrossPlatformCompatibilityRequest || (exports.GetCrossPlatformCompatibilityRequest = {}));
var UpdateProjectForCrossPlatformRequest;
(function (UpdateProjectForCrossPlatformRequest) {
    UpdateProjectForCrossPlatformRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/updateProjectForCrossPlatform');
})(UpdateProjectForCrossPlatformRequest = exports.UpdateProjectForCrossPlatformRequest || (exports.UpdateProjectForCrossPlatformRequest = {}));
var GetProjectPropertiesRequest;
(function (GetProjectPropertiesRequest) {
    GetProjectPropertiesRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getProjectProperties');
})(GetProjectPropertiesRequest = exports.GetProjectPropertiesRequest || (exports.GetProjectPropertiesRequest = {}));
var SetDatabaseSourceRequest;
(function (SetDatabaseSourceRequest) {
    SetDatabaseSourceRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/setDatabaseSource');
})(SetDatabaseSourceRequest = exports.SetDatabaseSourceRequest || (exports.SetDatabaseSourceRequest = {}));
var SetDatabaseSchemaProviderRequest;
(function (SetDatabaseSchemaProviderRequest) {
    SetDatabaseSchemaProviderRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/setDatabaseSchemaProvider');
})(SetDatabaseSchemaProviderRequest = exports.SetDatabaseSchemaProviderRequest || (exports.SetDatabaseSchemaProviderRequest = {}));
//#endregion
//#region File/folder functions
//#region SQL object script functions
var AddSqlObjectScriptRequest;
(function (AddSqlObjectScriptRequest) {
    AddSqlObjectScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addSqlObjectScript');
})(AddSqlObjectScriptRequest = exports.AddSqlObjectScriptRequest || (exports.AddSqlObjectScriptRequest = {}));
var DeleteSqlObjectScriptRequest;
(function (DeleteSqlObjectScriptRequest) {
    DeleteSqlObjectScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deleteSqlObjectScript');
})(DeleteSqlObjectScriptRequest = exports.DeleteSqlObjectScriptRequest || (exports.DeleteSqlObjectScriptRequest = {}));
var ExcludeSqlObjectScriptRequest;
(function (ExcludeSqlObjectScriptRequest) {
    ExcludeSqlObjectScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/excludeSqlObjectScript');
})(ExcludeSqlObjectScriptRequest = exports.ExcludeSqlObjectScriptRequest || (exports.ExcludeSqlObjectScriptRequest = {}));
var MoveSqlObjectScriptRequest;
(function (MoveSqlObjectScriptRequest) {
    MoveSqlObjectScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/moveSqlObjectScript');
})(MoveSqlObjectScriptRequest = exports.MoveSqlObjectScriptRequest || (exports.MoveSqlObjectScriptRequest = {}));
var GetSqlObjectScriptsRequest;
(function (GetSqlObjectScriptsRequest) {
    GetSqlObjectScriptsRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getSqlObjectScripts');
})(GetSqlObjectScriptsRequest = exports.GetSqlObjectScriptsRequest || (exports.GetSqlObjectScriptsRequest = {}));
//#endregion
//#region Folder functions
var AddFolderRequest;
(function (AddFolderRequest) {
    AddFolderRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addFolder');
})(AddFolderRequest = exports.AddFolderRequest || (exports.AddFolderRequest = {}));
var DeleteFolderRequest;
(function (DeleteFolderRequest) {
    DeleteFolderRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deleteFolder');
})(DeleteFolderRequest = exports.DeleteFolderRequest || (exports.DeleteFolderRequest = {}));
var GetFoldersRequest;
(function (GetFoldersRequest) {
    GetFoldersRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getFolders');
})(GetFoldersRequest = exports.GetFoldersRequest || (exports.GetFoldersRequest = {}));
//#endregion
//#region Pre/Post-deployment script functions
var AddPostDeploymentScriptRequest;
(function (AddPostDeploymentScriptRequest) {
    AddPostDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addPostDeploymentScript');
})(AddPostDeploymentScriptRequest = exports.AddPostDeploymentScriptRequest || (exports.AddPostDeploymentScriptRequest = {}));
var AddPreDeploymentScriptRequest;
(function (AddPreDeploymentScriptRequest) {
    AddPreDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addPreDeploymentScript');
})(AddPreDeploymentScriptRequest = exports.AddPreDeploymentScriptRequest || (exports.AddPreDeploymentScriptRequest = {}));
var DeletePostDeploymentScriptRequest;
(function (DeletePostDeploymentScriptRequest) {
    DeletePostDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deletePostDeploymentScript');
})(DeletePostDeploymentScriptRequest = exports.DeletePostDeploymentScriptRequest || (exports.DeletePostDeploymentScriptRequest = {}));
var DeletePreDeploymentScriptRequest;
(function (DeletePreDeploymentScriptRequest) {
    DeletePreDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deletePreDeploymentScript');
})(DeletePreDeploymentScriptRequest = exports.DeletePreDeploymentScriptRequest || (exports.DeletePreDeploymentScriptRequest = {}));
var ExcludePostDeploymentScriptRequest;
(function (ExcludePostDeploymentScriptRequest) {
    ExcludePostDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/excludePostDeploymentScript');
})(ExcludePostDeploymentScriptRequest = exports.ExcludePostDeploymentScriptRequest || (exports.ExcludePostDeploymentScriptRequest = {}));
var ExcludePreDeploymentScriptRequest;
(function (ExcludePreDeploymentScriptRequest) {
    ExcludePreDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/excludePreDeploymentScript');
})(ExcludePreDeploymentScriptRequest = exports.ExcludePreDeploymentScriptRequest || (exports.ExcludePreDeploymentScriptRequest = {}));
var MovePostDeploymentScriptRequest;
(function (MovePostDeploymentScriptRequest) {
    MovePostDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/movePostDeploymentScript');
})(MovePostDeploymentScriptRequest = exports.MovePostDeploymentScriptRequest || (exports.MovePostDeploymentScriptRequest = {}));
var MovePreDeploymentScriptRequest;
(function (MovePreDeploymentScriptRequest) {
    MovePreDeploymentScriptRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/movePreDeploymentScript');
})(MovePreDeploymentScriptRequest = exports.MovePreDeploymentScriptRequest || (exports.MovePreDeploymentScriptRequest = {}));
var GetPostDeploymentScriptsRequest;
(function (GetPostDeploymentScriptsRequest) {
    GetPostDeploymentScriptsRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getPostDeploymentScripts');
})(GetPostDeploymentScriptsRequest = exports.GetPostDeploymentScriptsRequest || (exports.GetPostDeploymentScriptsRequest = {}));
var GetPreDeploymentScriptsRequest;
(function (GetPreDeploymentScriptsRequest) {
    GetPreDeploymentScriptsRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getPreDeploymentScripts');
})(GetPreDeploymentScriptsRequest = exports.GetPreDeploymentScriptsRequest || (exports.GetPreDeploymentScriptsRequest = {}));
//#endregion
//#region None functions
var AddNoneItemRequest;
(function (AddNoneItemRequest) {
    AddNoneItemRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addNoneItem');
})(AddNoneItemRequest = exports.AddNoneItemRequest || (exports.AddNoneItemRequest = {}));
var DeleteNoneItemRequest;
(function (DeleteNoneItemRequest) {
    DeleteNoneItemRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deleteNoneItem');
})(DeleteNoneItemRequest = exports.DeleteNoneItemRequest || (exports.DeleteNoneItemRequest = {}));
var ExcludeNoneItemRequest;
(function (ExcludeNoneItemRequest) {
    ExcludeNoneItemRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/excludeNoneItem');
})(ExcludeNoneItemRequest = exports.ExcludeNoneItemRequest || (exports.ExcludeNoneItemRequest = {}));
var GetNoneItemsRequest;
(function (GetNoneItemsRequest) {
    GetNoneItemsRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getNoneItems');
})(GetNoneItemsRequest = exports.GetNoneItemsRequest || (exports.GetNoneItemsRequest = {}));
var MoveNoneItemRequest;
(function (MoveNoneItemRequest) {
    MoveNoneItemRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/moveNoneItem');
})(MoveNoneItemRequest = exports.MoveNoneItemRequest || (exports.MoveNoneItemRequest = {}));
//#endregion
//#endregion
//#region SQLCMD variable functions
var AddSqlCmdVariableRequest;
(function (AddSqlCmdVariableRequest) {
    AddSqlCmdVariableRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/addSqlCmdVariable');
})(AddSqlCmdVariableRequest = exports.AddSqlCmdVariableRequest || (exports.AddSqlCmdVariableRequest = {}));
var DeleteSqlCmdVariableRequest;
(function (DeleteSqlCmdVariableRequest) {
    DeleteSqlCmdVariableRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/deleteSqlCmdVariable');
})(DeleteSqlCmdVariableRequest = exports.DeleteSqlCmdVariableRequest || (exports.DeleteSqlCmdVariableRequest = {}));
var UpdateSqlCmdVariableRequest;
(function (UpdateSqlCmdVariableRequest) {
    UpdateSqlCmdVariableRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/updateSqlCmdVariable');
})(UpdateSqlCmdVariableRequest = exports.UpdateSqlCmdVariableRequest || (exports.UpdateSqlCmdVariableRequest = {}));
var GetSqlCmdVariablesRequest;
(function (GetSqlCmdVariablesRequest) {
    GetSqlCmdVariablesRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getSqlCmdVariables');
})(GetSqlCmdVariablesRequest = exports.GetSqlCmdVariablesRequest || (exports.GetSqlCmdVariablesRequest = {}));
//#endregion
//#region Database reference functions
var AddDacpacReferenceRequest;
(function (AddDacpacReferenceRequest) {
    AddDacpacReferenceRequest.type = new vscode_languageclient_1.RequestType('sqlprojects/addDacpacReference');
})(AddDacpacReferenceRequest = exports.AddDacpacReferenceRequest || (exports.AddDacpacReferenceRequest = {}));
var AddSqlProjectReferenceRequest;
(function (AddSqlProjectReferenceRequest) {
    AddSqlProjectReferenceRequest.type = new vscode_languageclient_1.RequestType('sqlprojects/addSqlProjectReference');
})(AddSqlProjectReferenceRequest = exports.AddSqlProjectReferenceRequest || (exports.AddSqlProjectReferenceRequest = {}));
var AddSystemDatabaseReferenceRequest;
(function (AddSystemDatabaseReferenceRequest) {
    AddSystemDatabaseReferenceRequest.type = new vscode_languageclient_1.RequestType('sqlprojects/addSystemDatabaseReference');
})(AddSystemDatabaseReferenceRequest = exports.AddSystemDatabaseReferenceRequest || (exports.AddSystemDatabaseReferenceRequest = {}));
var DeleteDatabaseReferenceRequest;
(function (DeleteDatabaseReferenceRequest) {
    DeleteDatabaseReferenceRequest.type = new vscode_languageclient_1.RequestType('sqlprojects/deleteDatabaseReference');
})(DeleteDatabaseReferenceRequest = exports.DeleteDatabaseReferenceRequest || (exports.DeleteDatabaseReferenceRequest = {}));
var GetDatabaseReferencesRequest;
(function (GetDatabaseReferencesRequest) {
    GetDatabaseReferencesRequest.type = new vscode_languageclient_1.RequestType('sqlProjects/getDatabaseReferences');
})(GetDatabaseReferencesRequest = exports.GetDatabaseReferencesRequest || (exports.GetDatabaseReferencesRequest = {}));
//#endregion

//# sourceMappingURL=sqlProjectsContracts.js.map
