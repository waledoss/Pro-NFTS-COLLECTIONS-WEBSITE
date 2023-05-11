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
const events = require("events");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const azureResourceController_1 = require("../azure/azureResourceController");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const serviceclient_1 = require("../languageservice/serviceclient");
const ConnInfo = require("../models/connectionInfo");
const languageService_1 = require("../models/contracts/languageService");
const scriptingRequest_1 = require("../models/contracts/scripting/scriptingRequest");
const sqlOutputContentProvider_1 = require("../models/sqlOutputContentProvider");
const Utils = require("../models/utils");
const objectExplorerProvider_1 = require("../objectExplorer/objectExplorerProvider");
const objectExplorerUtils_1 = require("../objectExplorer/objectExplorerUtils");
const adapter_1 = require("../prompts/adapter");
const protocol_1 = require("../protocol");
const queryHistoryProvider_1 = require("../queryHistory/queryHistoryProvider");
const scriptingService_1 = require("../scripting/scriptingService");
const azureAccountService_1 = require("../services/azureAccountService");
const azureResourceService_1 = require("../services/azureResourceService");
const dacFxService_1 = require("../services/dacFxService");
const schemaCompareService_1 = require("../services/schemaCompareService");
const sqlTasksService_1 = require("../services/sqlTasksService");
const statusView_1 = require("../views/statusView");
const connectionManager_1 = require("./connectionManager");
const untitledSqlDocumentService_1 = require("./untitledSqlDocumentService");
const vscodeWrapper_1 = require("./vscodeWrapper");
/**
 * The main controller class that initializes the extension
 */
class MainController {
    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context, connectionManager, vscodeWrapper) {
        this._event = new events.EventEmitter();
        this._initialized = false;
        this._queryHistoryRegistered = false;
        this._context = context;
        if (connectionManager) {
            this._connectionMgr = connectionManager;
        }
        this._vscodeWrapper = vscodeWrapper || new vscodeWrapper_1.default();
        this._untitledSqlDocumentService = new untitledSqlDocumentService_1.default(this._vscodeWrapper);
    }
    /**
     * Helper method to setup command registrations
     */
    registerCommand(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => self._event.emit(command)));
    }
    /**
     * Helper method to setup command registrations with arguments
     */
    registerCommandWithArgs(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, (args) => {
            self._event.emit(command, args);
        }));
    }
    /**
     * Disposes the controller
     */
    dispose() {
        this.deactivate();
    }
    /**
     * Deactivates the extension
     */
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            Utils.logDebug('de-activated.');
            yield this.onDisconnect();
            this._statusview.dispose();
        });
    }
    /**
     * Initializes the extension
     */
    activate() {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize the language client then register the commands
            const didInitialize = yield this.initialize();
            if (didInitialize) {
                // register VS Code commands
                this.registerCommand(Constants.cmdConnect);
                this._event.on(Constants.cmdConnect, () => { this.runAndLogErrors(this.onNewConnection()); });
                this.registerCommand(Constants.cmdDisconnect);
                this._event.on(Constants.cmdDisconnect, () => { this.runAndLogErrors(this.onDisconnect()); });
                this.registerCommand(Constants.cmdRunQuery);
                this._event.on(Constants.cmdRunQuery, () => { this.onRunQuery(); });
                this.registerCommand(Constants.cmdManageConnectionProfiles);
                this._event.on(Constants.cmdRunCurrentStatement, () => { this.onRunCurrentStatement(); });
                this.registerCommand(Constants.cmdRunCurrentStatement);
                this._event.on(Constants.cmdManageConnectionProfiles, () => __awaiter(this, void 0, void 0, function* () { yield this.onManageProfiles(); }));
                this.registerCommand(Constants.cmdChooseDatabase);
                this._event.on(Constants.cmdChooseDatabase, () => { this.runAndLogErrors(this.onChooseDatabase()); });
                this.registerCommand(Constants.cmdChooseLanguageFlavor);
                this._event.on(Constants.cmdChooseLanguageFlavor, () => { this.runAndLogErrors(this.onChooseLanguageFlavor()); });
                this.registerCommand(Constants.cmdCancelQuery);
                this._event.on(Constants.cmdCancelQuery, () => { this.onCancelQuery(); });
                this.registerCommand(Constants.cmdShowGettingStarted);
                this._event.on(Constants.cmdShowGettingStarted, () => __awaiter(this, void 0, void 0, function* () { yield this.launchGettingStartedPage(); }));
                this.registerCommand(Constants.cmdNewQuery);
                this._event.on(Constants.cmdNewQuery, () => this.runAndLogErrors(this.onNewQuery()));
                this.registerCommand(Constants.cmdRebuildIntelliSenseCache);
                this._event.on(Constants.cmdRebuildIntelliSenseCache, () => { this.onRebuildIntelliSense(); });
                this.registerCommandWithArgs(Constants.cmdLoadCompletionExtension);
                this._event.on(Constants.cmdLoadCompletionExtension, (params) => { this.onLoadCompletionExtension(params); });
                this.registerCommand(Constants.cmdToggleSqlCmd);
                this._event.on(Constants.cmdToggleSqlCmd, () => __awaiter(this, void 0, void 0, function* () { yield this.onToggleSqlCmd(); }));
                this.registerCommand(Constants.cmdAadRemoveAccount);
                this._event.on(Constants.cmdAadRemoveAccount, () => this.removeAadAccount(this._prompter));
                this.registerCommand(Constants.cmdAadAddAccount);
                this._event.on(Constants.cmdAadAddAccount, () => this.addAddAccount());
                this.initializeObjectExplorer();
                this.registerCommandWithArgs(Constants.cmdConnectObjectExplorerProfile);
                this._event.on(Constants.cmdConnectObjectExplorerProfile, (profile) => {
                    this._connectionMgr.connectionUI.saveProfile(profile)
                        .then(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.createObjectExplorerSession(profile);
                    }))
                        .catch(err => {
                        this._vscodeWrapper.showErrorMessage(err);
                    });
                });
                this.registerCommand(Constants.cmdObjectExplorerEnableGroupBySchemaCommand);
                this._event.on(Constants.cmdObjectExplorerEnableGroupBySchemaCommand, () => {
                    vscode.workspace.getConfiguration().update(Constants.cmdObjectExplorerGroupBySchemaFlagName, true, true);
                });
                this.registerCommand(Constants.cmdObjectExplorerDisableGroupBySchemaCommand);
                this._event.on(Constants.cmdObjectExplorerDisableGroupBySchemaCommand, () => {
                    vscode.workspace.getConfiguration().update(Constants.cmdObjectExplorerGroupBySchemaFlagName, false, true);
                });
                this.initializeQueryHistory();
                this.sqlTasksService = new sqlTasksService_1.SqlTasksService(serviceclient_1.default.instance, this._untitledSqlDocumentService);
                this.dacFxService = new dacFxService_1.DacFxService(serviceclient_1.default.instance);
                this.schemaCompareService = new schemaCompareService_1.SchemaCompareService(serviceclient_1.default.instance);
                const azureResourceController = new azureResourceController_1.AzureResourceController();
                this.azureAccountService = new azureAccountService_1.AzureAccountService(this._connectionMgr.azureController, this._connectionMgr.accountStore);
                this.azureResourceService = new azureResourceService_1.AzureResourceService(this._connectionMgr.azureController, azureResourceController, this._connectionMgr.accountStore);
                // Add handlers for VS Code generated commands
                this._vscodeWrapper.onDidCloseTextDocument((params) => __awaiter(this, void 0, void 0, function* () { return yield this.onDidCloseTextDocument(params); }));
                this._vscodeWrapper.onDidOpenTextDocument(params => this.onDidOpenTextDocument(params));
                this._vscodeWrapper.onDidSaveTextDocument(params => this.onDidSaveTextDocument(params));
                this._vscodeWrapper.onDidChangeConfiguration(params => this.onDidChangeConfiguration(params));
                return true;
            }
        });
    }
    /**
     * Helper to script a node based on the script operation
     */
    scriptNode(node, operation, executeScript = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
            let connectionCreds = Object.assign({}, node.connectionInfo);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
            // if not connected or different database
            if (!this.connectionManager.isConnected(nodeUri) ||
                connectionCreds.database !== databaseName) {
                // make a new connection
                connectionCreds.database = databaseName;
                if (!this.connectionManager.isConnecting(nodeUri)) {
                    const promise = new protocol_1.Deferred();
                    yield this.connectionManager.connect(nodeUri, connectionCreds, promise);
                    yield promise;
                }
            }
            const selectStatement = yield this._scriptingService.script(node, nodeUri, operation);
            const editor = yield this._untitledSqlDocumentService.newQuery(selectStatement);
            let uri = editor.document.uri.toString(true);
            let scriptingObject = this._scriptingService.getObjectFromNode(node);
            let title = `${scriptingObject.schema}.${scriptingObject.name}`;
            const queryUriPromise = new protocol_1.Deferred();
            yield this.connectionManager.connect(uri, connectionCreds, queryUriPromise);
            yield queryUriPromise;
            this._statusview.languageFlavorChanged(uri, Constants.mssqlProviderName);
            this._statusview.sqlCmdModeChanged(uri, false);
            if (executeScript) {
                const queryPromise = new protocol_1.Deferred();
                yield this._outputContentProvider.runQuery(this._statusview, uri, undefined, title, queryPromise);
                yield queryPromise;
                yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
            }
        });
    }
    /**
     * Returns a flag indicating if the extension is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Initializes the extension
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize language service client
            yield serviceclient_1.default.instance.initialize(this._context);
            // Init status bar
            this._statusview = new statusView_1.default(this._vscodeWrapper);
            // Init CodeAdapter for use when user response to questions is needed
            this._prompter = new adapter_1.default(this._vscodeWrapper);
            // Init content provider for results pane
            this._outputContentProvider = new sqlOutputContentProvider_1.SqlOutputContentProvider(this._context, this._statusview, this._vscodeWrapper);
            // Init connection manager and connection MRU
            this._connectionMgr = new connectionManager_1.default(this._context, this._statusview, this._prompter);
            // Shows first time notifications on extension installation or update
            // This call is intentionally not awaited to avoid blocking extension activation
            this.showFirstLaunchPrompts();
            // Handle case where SQL file is the 1st opened document
            const activeTextEditor = this._vscodeWrapper.activeTextEditor;
            if (activeTextEditor && this._vscodeWrapper.isEditingSqlFile) {
                this.onDidOpenTextDocument(activeTextEditor.document);
            }
            yield this.sanitizeConnectionProfiles();
            yield this.loadTokenCache();
            Utils.logDebug('activated.');
            this._initialized = true;
            return true;
        });
    }
    loadTokenCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._connectionMgr.azureController.loadTokenCache();
        });
    }
    /**
     * Sanitize the connection profiles in the settings.
     */
    sanitizeConnectionProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const sanitize = (connectionProfiles, target) => __awaiter(this, void 0, void 0, function* () {
                let profileChanged = false;
                for (const conn of connectionProfiles) {
                    // remove azure account token
                    if (conn && conn.authenticationType !== 'AzureMFA' && conn.azureAccountToken !== undefined) {
                        conn.azureAccountToken = undefined;
                        profileChanged = true;
                    }
                    // remove password
                    if (!Utils.isEmpty(conn.password)) {
                        // save the password in the credential store if save password is true
                        yield this.connectionManager.connectionStore.saveProfilePasswordIfNeeded(conn);
                        conn.password = '';
                        profileChanged = true;
                    }
                    // Fixup 'Encrypt' property if needed
                    let result = ConnInfo.updateEncrypt(conn);
                    if (result.updateStatus) {
                        yield this.connectionManager.connectionStore.saveProfile(result.connection);
                    }
                }
                if (profileChanged) {
                    yield this._vscodeWrapper.setConfiguration(Constants.extensionName, Constants.connectionsArrayName, connectionProfiles, target);
                }
            });
            const profileMapping = new Map();
            const configuration = this._vscodeWrapper.getConfiguration(Constants.extensionName, this._vscodeWrapper.activeTextEditorUri);
            const configValue = configuration.inspect(Constants.connectionsArrayName);
            profileMapping.set(vscode.ConfigurationTarget.Global, configValue.globalValue || []);
            profileMapping.set(vscode.ConfigurationTarget.Workspace, configValue.workspaceValue || []);
            profileMapping.set(vscode.ConfigurationTarget.WorkspaceFolder, configValue.workspaceFolderValue || []);
            for (const target of profileMapping.keys()) {
                // sanitize the connections and save them back to their original target.
                yield sanitize(profileMapping.get(target), target);
            }
        });
    }
    /**
     * Creates a new Object Explorer session
     * @param connectionCredentials Connection credentials to use for the session
     * @returns True if the session was created successfully, false otherwise
     */
    createObjectExplorerSession(connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            let createSessionPromise = new protocol_1.Deferred();
            const sessionId = yield this._objectExplorerProvider.createSession(createSessionPromise, connectionCredentials, this._context);
            if (sessionId) {
                const newNode = yield createSessionPromise;
                if (newNode) {
                    this._objectExplorerProvider.refresh(undefined);
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Initializes the Object Explorer commands
     */
    initializeObjectExplorer() {
        const self = this;
        // Register the object explorer tree provider
        this._objectExplorerProvider = new objectExplorerProvider_1.ObjectExplorerProvider(this._connectionMgr);
        const treeView = vscode.window.createTreeView('objectExplorer', {
            treeDataProvider: this._objectExplorerProvider,
            canSelectMany: false
        });
        this._context.subscriptions.push(treeView);
        // Sets the correct current node on any node selection
        this._context.subscriptions.push(treeView.onDidChangeSelection((e) => {
            var _a;
            if (((_a = e.selection) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                self._objectExplorerProvider.currentNode = e.selection[0];
            }
        }));
        // Add Object Explorer Node
        this.registerCommand(Constants.cmdAddObjectExplorer);
        this._event.on(Constants.cmdAddObjectExplorer, () => __awaiter(this, void 0, void 0, function* () {
            if (!self._objectExplorerProvider.objectExplorerExists) {
                self._objectExplorerProvider.objectExplorerExists = true;
            }
            yield self.createObjectExplorerSession();
        }));
        // Object Explorer New Query
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNewQuery, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            const connectionCredentials = Object.assign({}, treeNodeInfo.connectionInfo);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(treeNodeInfo);
            if (databaseName !== connectionCredentials.database &&
                databaseName !== LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = databaseName;
            }
            else if (databaseName === LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = '';
            }
            treeNodeInfo.connectionInfo = connectionCredentials;
            yield self.onNewQuery(treeNodeInfo);
        })));
        // Remove Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRemoveObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeObjectExplorerNode(treeNodeInfo);
            let profile = treeNodeInfo.connectionInfo;
            yield this._connectionMgr.connectionStore.removeProfile(profile, false);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        // Refresh Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.refreshNode(treeNodeInfo);
        })));
        // Sign In into Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNodeSignIn, (node) => __awaiter(this, void 0, void 0, function* () {
            let profile = node.parentNode.connectionInfo;
            profile = yield self.connectionManager.connectionUI.promptForRetryCreateProfile(profile);
            if (profile) {
                node.parentNode.connectionInfo = profile;
                self._objectExplorerProvider.updateNode(node.parentNode);
                self._objectExplorerProvider.signInNodeServer(node.parentNode);
                return self._objectExplorerProvider.refresh(undefined);
            }
        })));
        // Connect to Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdConnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            yield self.createObjectExplorerSession(node.parentNode.connectionInfo);
        })));
        // Disconnect Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDisconnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeObjectExplorerNode(node, true);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        // Initiate the scripting service
        this._scriptingService = new scriptingService_1.ScriptingService(this._connectionMgr);
        // Script as Select
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptSelect, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Select, true);
        })));
        // Script as Create
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptCreate, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Create); })));
        // Script as Drop
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptDelete, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Delete); })));
        // Script as Execute
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptExecute, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Execute); })));
        // Script as Alter
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptAlter, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Alter); })));
        // Copy object name command
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCopyObjectName, () => __awaiter(this, void 0, void 0, function* () {
            let node = this._objectExplorerProvider.currentNode;
            // Folder node
            if (node.contextValue === Constants.folderLabel) {
                return;
            }
            else if (node.contextValue === Constants.serverLabel ||
                node.contextValue === Constants.disconnectedServerLabel) {
                const label = typeof node.label === 'string' ? node.label : node.label.label;
                yield this._vscodeWrapper.clipboardWriteText(label);
            }
            else {
                let scriptingObject = this._scriptingService.getObjectFromNode(node);
                const escapedName = Utils.escapeClosingBrackets(scriptingObject.name);
                if (scriptingObject.schema) {
                    let database = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
                    const databaseName = Utils.escapeClosingBrackets(database);
                    const escapedSchema = Utils.escapeClosingBrackets(scriptingObject.schema);
                    yield this._vscodeWrapper.clipboardWriteText(`[${databaseName}].${escapedSchema}.[${escapedName}]`);
                }
                else {
                    yield this._vscodeWrapper.clipboardWriteText(`[${escapedName}]`);
                }
            }
        })));
    }
    /**
     * Initializes the Query History commands
     */
    initializeQueryHistory() {
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let queryHistoryFeature = config.get(Constants.configEnableQueryHistoryFeature);
        // If the query history feature is enabled
        if (queryHistoryFeature && !this._queryHistoryRegistered) {
            // Register the query history tree provider
            this._queryHistoryProvider = new queryHistoryProvider_1.QueryHistoryProvider(this._connectionMgr, this._outputContentProvider, this._vscodeWrapper, this._untitledSqlDocumentService, this._statusview, this._prompter);
            this._context.subscriptions.push(vscode.window.registerTreeDataProvider('queryHistory', this._queryHistoryProvider));
            // Command to refresh Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshQueryHistory, (ownerUri, hasError) => {
                config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
                let queryHistoryFeatureEnabled = config.get(Constants.configEnableQueryHistoryFeature);
                let queryHistoryCaptureEnabled = config.get(Constants.configEnableQueryHistoryCapture);
                if (queryHistoryFeatureEnabled && queryHistoryCaptureEnabled) {
                    const timeStamp = new Date();
                    this._queryHistoryProvider.refresh(ownerUri, timeStamp, hasError);
                }
            }));
            // Command to enable clear all entries in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdClearAllQueryHistory, () => {
                this._queryHistoryProvider.clearAll();
            }));
            // Command to enable delete an entry in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDeleteQueryHistory, (node) => {
                this._queryHistoryProvider.deleteQueryHistoryEntry(node);
            }));
            // Command to enable open a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdOpenQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node);
            })));
            // Command to enable run a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRunQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node, true);
            })));
            // Command to start the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdStartQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.startQueryHistoryCapture();
            })));
            // Command to pause the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdPauseQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.pauseQueryHistoryCapture();
            })));
            // Command to open the query history experience in the command palette
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCommandPaletteQueryHistory, () => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.showQueryHistoryCommandPalette();
            })));
            this._queryHistoryRegistered = true;
        }
    }
    /**
     * Handles the command to toggle SQLCMD mode
     */
    onToggleSqlCmd() {
        return __awaiter(this, void 0, void 0, function* () {
            let isSqlCmd;
            const uri = this._vscodeWrapper.activeTextEditorUri;
            const queryRunner = this._outputContentProvider.getQueryRunner(uri);
            // if a query runner exists, use it
            if (queryRunner) {
                isSqlCmd = queryRunner.isSqlCmd;
            }
            else {
                // otherwise create a new query runner
                isSqlCmd = false;
                const editor = this._vscodeWrapper.activeTextEditor;
                const title = path.basename(editor.document.fileName);
                this._outputContentProvider.createQueryRunner(this._statusview, uri, title);
            }
            yield this._outputContentProvider.toggleSqlCmd(this._vscodeWrapper.activeTextEditorUri);
            yield this._connectionMgr.onChooseLanguageFlavor(true, !isSqlCmd);
            this._statusview.sqlCmdModeChanged(this._vscodeWrapper.activeTextEditorUri, !isSqlCmd);
        });
    }
    /**
     * Handles the command to cancel queries
     */
    onCancelQuery() {
        if (!this.canRunCommand() || !this.validateTextDocumentHasFocus()) {
            return;
        }
        try {
            let uri = this._vscodeWrapper.activeTextEditorUri;
            this._outputContentProvider.cancelQuery(uri);
        }
        catch (err) {
            console.warn(`Unexpected error cancelling query : ${err}`);
        }
    }
    /**
     * Choose a new database from the current server
     */
    onChooseDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                const success = yield this._connectionMgr.onChooseDatabase();
                return success;
            }
            return false;
        });
    }
    /**
     * Choose a language flavor for the SQL document. Should be either "MSSQL" or "Other"
     * to indicate that intellisense and other services should not be provided
     */
    onChooseLanguageFlavor() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                const fileUri = this._vscodeWrapper.activeTextEditorUri;
                if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                    this._connectionMgr.onChooseLanguageFlavor();
                }
                else {
                    this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
                }
            }
            return false;
        });
    }
    /**
     * Close active connection, if any
     */
    onDisconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                let fileUri = this._vscodeWrapper.activeTextEditorUri;
                let queryRunner = this._outputContentProvider.getQueryRunner(fileUri);
                if (queryRunner && queryRunner.isExecutingQuery) {
                    this._outputContentProvider.cancelQuery(fileUri);
                }
                const success = yield this._connectionMgr.onDisconnect();
                return success;
            }
            return false;
        });
    }
    /**
     * Manage connection profiles (create, edit, remove).
     * Public for testing purposes
     */
    onManageProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                yield this._connectionMgr.onManageProfiles();
                return;
            }
        });
    }
    /**
     * Let users pick from a list of connections
     */
    onNewConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                let credentials = yield this._connectionMgr.onNewConnection();
                if (credentials) {
                    yield this.createObjectExplorerSession(credentials);
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Makes a connection and save if saveConnection is set to true
     * @param uri The URI of the connection to list the databases for.
     * @param connectionInfo The connection info
     * @param connectionPromise connection promise object
     * @param saveConnection saves the connection profile if sets to true
     * @returns if saveConnection is set to true, returns true for successful connection and saving the profile
     * otherwise returns true for successful connection
     *
     */
    connect(uri, connectionInfo, connectionPromise, saveConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && uri && connectionInfo) {
                const connectedSuccessfully = yield this._connectionMgr.connect(uri, connectionInfo, connectionPromise);
                if (connectedSuccessfully) {
                    if (saveConnection) {
                        yield this.createObjectExplorerSession(connectionInfo);
                    }
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Clear and rebuild the IntelliSense cache
     */
    onRebuildIntelliSense() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._statusview.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
                serviceclient_1.default.instance.sendNotification(languageService_1.RebuildIntelliSenseNotification.type, {
                    ownerUri: fileUri
                });
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
    }
    /**
     * Send completion extension load request to language service
     */
    onLoadCompletionExtension(params) {
        serviceclient_1.default.instance.sendRequest(languageService_1.CompletionExtLoadRequest.type, params);
    }
    /**
     * execute the SQL statement for the current cursor position
     */
    onRunCurrentStatement(callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand()) {
                    return;
                }
                if (!self.canRunV2Command()) {
                    // Notify the user that this is not supported on this version
                    yield this._vscodeWrapper.showErrorMessage(LocalizedConstants.macSierraRequiredErrorMessage);
                    return;
                }
                if (!self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (yield self.isRetryRequiredBeforeQuery(self.onRunCurrentStatement)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                let title = path.basename(editor.document.fileName);
                // return early if the document does contain any text
                if (editor.document.getText(undefined).trim().length === 0) {
                    return;
                }
                // only the start line and column are used to determine the current statement
                let querySelection = {
                    startLine: editor.selection.start.line,
                    startColumn: editor.selection.start.character,
                    endLine: 0,
                    endColumn: 0
                };
                yield self._outputContentProvider.runCurrentStatement(self._statusview, uri, querySelection, title);
            }
            catch (err) {
                console.warn(`Unexpected error running current statement : ${err}`);
            }
        });
    }
    /**
     * get the T-SQL query from the editor, run it and show output
     */
    onRunQuery(callbackThis) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand() || !self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (yield self.isRetryRequiredBeforeQuery(self.onRunQuery)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                // Do not execute when there are multiple selections in the editor until it can be properly handled.
                // Otherwise only the first selection will be executed and cause unexpected issues.
                if (((_a = editor.selections) === null || _a === void 0 ? void 0 : _a.length) > 1) {
                    self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgMultipleSelectionModeNotSupported);
                    return;
                }
                // create new connection
                if (!self.connectionManager.isConnected(uri)) {
                    yield self.onNewConnection();
                }
                // check if current connection is still valid / active - if not, refresh azure account token
                yield self._connectionMgr.refreshAzureAccountToken(uri);
                let title = path.basename(editor.document.fileName);
                let querySelection;
                // Calculate the selection if we have a selection, otherwise we'll treat null as
                // the entire document's selection
                if (!editor.selection.isEmpty) {
                    let selection = editor.selection;
                    querySelection = {
                        startLine: selection.start.line,
                        startColumn: selection.start.character,
                        endLine: selection.end.line,
                        endColumn: selection.end.character
                    };
                }
                // Trim down the selection. If it is empty after selecting, then we don't execute
                let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
                if (editor.document.getText(selectionToTrim).trim().length === 0) {
                    return;
                }
                yield self._outputContentProvider.runQuery(self._statusview, uri, querySelection, title);
            }
            catch (err) {
                console.warn(`Unexpected error running query : ${err}`);
            }
        });
    }
    /**
     * Check if the state is ready to execute a query and retry
     * the query execution method if needed
     */
    isRetryRequiredBeforeQuery(retryMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            let result = undefined;
            try {
                if (!self._vscodeWrapper.isEditingSqlFile) {
                    // Prompt the user to change the language mode to SQL before running a query
                    result = yield self._connectionMgr.connectionUI.promptToChangeLanguageMode();
                }
                else if (!self._connectionMgr.isConnected(self._vscodeWrapper.activeTextEditorUri)) {
                    result = yield self.onNewConnection();
                }
                if (result) {
                    yield retryMethod(self);
                    return true;
                }
                else {
                    // we don't need to do anything to configure environment before running query
                    return false;
                }
            }
            catch (err) {
                yield self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            }
        });
    }
    /**
     * Executes a callback and logs any errors raised
     */
    runAndLogErrors(promise) {
        let self = this;
        return promise.catch(err => {
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            return undefined;
        });
    }
    /**
     * Access the connection manager for testing
     */
    get connectionManager() {
        return this._connectionMgr;
    }
    set connectionManager(connectionManager) {
        this._connectionMgr = connectionManager;
    }
    set untitledSqlDocumentService(untitledSqlDocumentService) {
        this._untitledSqlDocumentService = untitledSqlDocumentService;
    }
    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    canRunCommand() {
        if (this._connectionMgr === undefined) {
            Utils.showErrorMsg(LocalizedConstants.extensionNotInitializedError);
            return false;
        }
        return true;
    }
    /**
     * Return whether or not some text document currently has focus, and display an error message if not
     */
    validateTextDocumentHasFocus() {
        if (this._vscodeWrapper.activeTextEditorUri === undefined) {
            Utils.showErrorMsg(LocalizedConstants.noActiveEditorMsg);
            return false;
        }
        return true;
    }
    /**
     * Verifies the tools service version is high enough to support certain commands
     */
    canRunV2Command() {
        let version = serviceclient_1.default.instance.getServiceVersion();
        return version > 1;
    }
    /**
     * Prompts the user to view release notes and blog post for changes made to the encryption connection property, if this is a new extension install
     */
    showFirstLaunchPrompts() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            if (!this.doesExtensionLaunchedFileExist()) {
                // ask the user to view release notes document
                let confirmText = LocalizedConstants.viewMore;
                let promiseReleaseNotes = this._vscodeWrapper.showInformationMessage(LocalizedConstants.releaseNotesPromptDescription, confirmText)
                    .then((result) => __awaiter(this, void 0, void 0, function* () {
                    if (result === confirmText) {
                        yield self.launchReleaseNotesPage();
                    }
                }));
                // ask the user to view encryption changes document
                let confirmTextEncrypt = LocalizedConstants.moreInformation;
                let promiseEncryption = this._vscodeWrapper.showInformationMessage(LocalizedConstants.encryptionChangePromptDescription, confirmTextEncrypt)
                    .then((result) => __awaiter(this, void 0, void 0, function* () {
                    if (result === confirmTextEncrypt) {
                        yield self.launchEncryptionBlogPage();
                    }
                }));
                yield Promise.all([promiseReleaseNotes, promiseEncryption]);
            }
        });
    }
    /**
     * Shows the release notes page in the preview browser
     */
    launchReleaseNotesPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.env.openExternal(vscode.Uri.parse(Constants.changelogLink));
        });
    }
    /**
     * Shows the release notes page in the preview browser
     */
    launchEncryptionBlogPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.env.openExternal(vscode.Uri.parse(Constants.encryptionBlogLink));
        });
    }
    /**
     * Shows the Getting Started page in the preview browser
     */
    launchGettingStartedPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.env.openExternal(vscode.Uri.parse(Constants.gettingStartedGuideLink));
        });
    }
    /**
     * Opens a new query and creates new connection
     */
    onNewQuery(node, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                // from the object explorer context menu
                const editor = yield this._untitledSqlDocumentService.newQuery(content);
                const uri = editor.document.uri.toString(true);
                if (node) {
                    // connect to the node if the command came from the context
                    const connectionCreds = node.connectionInfo;
                    // if the node isn't connected
                    if (!node.sessionId) {
                        // connect it first
                        yield this.createObjectExplorerSession(node.connectionInfo);
                    }
                    this._statusview.languageFlavorChanged(uri, Constants.mssqlProviderName);
                    // connection string based credential
                    if (connectionCreds.connectionString) {
                        if (connectionCreds.savePassword) {
                            // look up connection string
                            let connectionString = yield this._connectionMgr.connectionStore.lookupPassword(connectionCreds, true);
                            connectionCreds.connectionString = connectionString;
                        }
                    }
                    yield this.connectionManager.connect(uri, connectionCreds);
                    this._statusview.sqlCmdModeChanged(uri, false);
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
                    return true;
                }
                else {
                    // new query command
                    const credentials = yield this._connectionMgr.onNewConnection();
                    // initiate a new OE with same connection
                    if (credentials) {
                        yield this.createObjectExplorerSession(credentials);
                    }
                    this._statusview.sqlCmdModeChanged(uri, false);
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Check if the extension launched file exists.
     * This is to detect when we are running in a clean install scenario.
     */
    doesExtensionLaunchedFileExist() {
        // check if file already exists on disk
        let filePath = this._context.asAbsolutePath('extensionlaunched.dat');
        try {
            // this will throw if the file does not exist
            fs.statSync(filePath);
            return true;
        }
        catch (err) {
            try {
                // write out the "first launch" file if it doesn't exist
                fs.writeFile(filePath, 'launched', (err) => {
                    return;
                });
            }
            catch (err) {
                // ignore errors writing first launch file since there isn't really
                // anything we can do to recover in this situation.
            }
            return false;
        }
    }
    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    onDidCloseTextDocument(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connectionMgr === undefined) {
                // Avoid processing events before initialization is complete
                return;
            }
            let closedDocumentUri = doc.uri.toString(true);
            let closedDocumentUriScheme = doc.uri.scheme;
            // Stop timers if they have been started
            if (this._lastSavedTimer) {
                this._lastSavedTimer.end();
            }
            if (this._lastOpenedTimer) {
                this._lastOpenedTimer.end();
            }
            // Determine which event caused this close event
            // If there was a saveTextDoc event just before this closeTextDoc event and it
            // was untitled then we know it was an untitled save
            if (this._lastSavedUri &&
                closedDocumentUriScheme === LocalizedConstants.untitledScheme &&
                this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
                // Untitled file was saved and connection will be transfered
                yield this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastSavedUri);
                // If there was an openTextDoc event just before this closeTextDoc event then we know it was a rename
            }
            else if (this._lastOpenedUri &&
                this._lastOpenedTimer.getDuration() < Constants.renamedOpenTimeThreshold) {
                // File was renamed and connection will be transfered
                yield this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastOpenedUri);
            }
            else {
                // Pass along the close event to the other handlers for a normal closed file
                yield this._connectionMgr.onDidCloseTextDocument(doc);
                this._outputContentProvider.onDidCloseTextDocument(doc);
            }
            // Reset special case timers and events
            this._lastSavedUri = undefined;
            this._lastSavedTimer = undefined;
            this._lastOpenedTimer = undefined;
            this._lastOpenedUri = undefined;
            // Remove diagnostics for the related file
            let diagnostics = serviceclient_1.default.instance.diagnosticCollection;
            if (diagnostics.has(doc.uri)) {
                diagnostics.delete(doc.uri);
            }
        });
    }
    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    onDidOpenTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        this._connectionMgr.onDidOpenTextDocument(doc);
        if (doc && doc.languageId === Constants.languageId) {
            // set encoding to false
            this._statusview.languageFlavorChanged(doc.uri.toString(true), Constants.mssqlProviderName);
        }
        // Setup properties incase of rename
        this._lastOpenedTimer = new Utils.Timer();
        this._lastOpenedTimer.start();
        if (doc && doc.uri) {
            this._lastOpenedUri = doc.uri.toString(true);
        }
    }
    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    onDidSaveTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        // Set encoding to false by giving true as argument
        let savedDocumentUri = doc.uri.toString(true);
        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new Utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
    onChangeQueryHistoryConfig() {
        let queryHistoryFeatureEnabled = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName)
            .get(Constants.configEnableQueryHistoryFeature);
        if (queryHistoryFeatureEnabled) {
            this.initializeQueryHistory();
        }
    }
    /**
     * Called by VS Code when user settings are changed
     * @param ConfigurationChangeEvent event that is fired when config is changed
     */
    onDidChangeConfiguration(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e.affectsConfiguration(Constants.extensionName)) {
                // Query History settings change
                this.onChangeQueryHistoryConfig();
                // Connections change
                let needsRefresh = false;
                // user connections is a super set of object explorer connections
                // read the connections from glocal settings and workspace settings.
                let userConnections = this.connectionManager.connectionStore.connectionConfig.getConnections(true);
                let objectExplorerConnections = this._objectExplorerProvider.rootNodeConnections;
                // if a connection(s) was/were manually removed
                let staleConnections = objectExplorerConnections.filter((oeConn) => {
                    return !userConnections.some((userConn) => Utils.isSameConnection(oeConn, userConn));
                });
                // disconnect that/those connection(s) and then
                // remove its/their credentials from the credential store
                // and MRU
                for (let conn of staleConnections) {
                    let profile = conn;
                    if (this.connectionManager.isActiveConnection(conn)) {
                        const uri = this.connectionManager.getUriForConnection(conn);
                        yield this.connectionManager.disconnect(uri);
                    }
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(profile);
                    if (profile.authenticationType === Constants.sqlAuthentication &&
                        profile.savePassword) {
                        yield this.connectionManager.deleteCredential(profile);
                    }
                }
                // remove them from object explorer
                yield this._objectExplorerProvider.removeConnectionNodes(staleConnections);
                needsRefresh = staleConnections.length > 0;
                // if a connection(s) was/were manually added
                let newConnections = userConnections.filter((userConn) => {
                    return !objectExplorerConnections.some((oeConn) => Utils.isSameConnection(userConn, oeConn));
                });
                for (let conn of newConnections) {
                    // if a connection is not connected
                    // that means it was added manually
                    const newConnectionProfile = conn;
                    const uri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUriFromProfile(newConnectionProfile);
                    if (!this.connectionManager.isActiveConnection(conn) &&
                        !this.connectionManager.isConnecting(uri)) {
                        // add a disconnected node for the connection
                        this._objectExplorerProvider.addDisconnectedNode(conn);
                        needsRefresh = true;
                    }
                }
                yield this.sanitizeConnectionProfiles();
                if (e.affectsConfiguration(Constants.cmdObjectExplorerGroupBySchemaFlagName)) {
                    let errorFoundWhileRefreshing = false;
                    (yield this._objectExplorerProvider.getChildren()).forEach((n) => {
                        try {
                            this._objectExplorerProvider.refreshNode(n);
                        }
                        catch (e) {
                            errorFoundWhileRefreshing = true;
                            this._connectionMgr.client.logger.error(e);
                        }
                    });
                    if (errorFoundWhileRefreshing) {
                        Utils.showErrorMsg(LocalizedConstants.objectExplorerNodeRefreshError);
                    }
                }
                if (needsRefresh) {
                    this._objectExplorerProvider.refresh(undefined);
                }
                if (e.affectsConfiguration(Constants.mssqlPiiLogging)) {
                    this.updatePiiLoggingLevel();
                }
                // Prompt to reload VS Code when below settings are updated.
                if (e.affectsConfiguration(Constants.azureAuthLibrary)
                    || e.affectsConfiguration(Constants.enableSqlAuthenticationProvider)) {
                    yield this.displayReloadMessage();
                }
            }
        });
    }
    /**
     * Updates Pii Logging configuration for Logger.
     */
    updatePiiLoggingLevel() {
        const piiLogging = vscode.workspace.getConfiguration(Constants.extensionName).get(Constants.piiLogging, false);
        serviceclient_1.default.instance.logger.piiLogging = piiLogging;
    }
    /**
     * Display notification with button to reload
     * return true if button clicked
     * return false if button not clicked
     */
    displayReloadMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showInformationMessage(LocalizedConstants.reloadPrompt, LocalizedConstants.reloadChoice);
            if (result === LocalizedConstants.reloadChoice) {
                yield vscode.commands.executeCommand('workbench.action.reloadWindow');
                return true;
            }
            else {
                return false;
            }
        });
    }
    removeAadAccount(prompter) {
        this.connectionManager.removeAccount(prompter);
    }
    addAddAccount() {
        this.connectionManager.addAccount();
    }
}
exports.default = MainController;

//# sourceMappingURL=mainController.js.map
