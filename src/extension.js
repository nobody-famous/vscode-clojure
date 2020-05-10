const vscode = require('vscode');
const { Lexer } = require('./Lexer');
const { Formatter } = require('./Formatter');

const LANGUAGE_ID = 'clojure';

module.exports.activate = (ctx) => {
    vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'untitled', language: LANGUAGE_ID }, documentFormatter());
    vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: LANGUAGE_ID }, documentFormatter());
};

function documentFormatter() {
    return {
        provideDocumentFormattingEdits(doc, opts) {
            const lex = new Lexer(doc.getText());
            const tokens = lex.getTokens();
            const formatter = new Formatter(doc, opts, tokens);

            const edits = formatter.format();
            return edits.length > 0 ? edits : undefined;
        }
    };
}
