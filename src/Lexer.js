const types = require('./Types');
const { Position } = require('vscode');
const { Token } = require('./Token');

module.exports.Lexer = class {
    constructor(text) {
        this.text = text;
        this.line = 0;
        this.col = 0;
        this.curPos = 0;
        this.curText = undefined;
        this.start = undefined;
    }

    getTokens() {
        const tokens = [];

        while (true) {
            const token = this.nextToken();
            if (token === undefined) {
                break;
            }

            tokens.push(token);
        }

        return tokens;
    }

    nextToken() {
        this.start = new Position(this.line, this.col);
        this.curText = '';

        const char = this.peek();
        if (char === undefined) {
            return undefined;
        }

        if (this.isWS(char)) {
            return this.ws();
        }

        switch (char) {
            case '(':
                return this.char(types.OPEN_PARENS);
            case ')':
                return this.char(types.CLOSE_PARENS);
            case '[':
                return this.char(types.OPEN_SQ_BRACKETS);
            case ']':
                return this.char(types.CLOSE_SQ_BRACKETS);
            case '{':
                return this.char(types.OPEN_CRLY_BRACKETS);
            case '}':
                return this.char(types.CLOSE_CRLY_BRACKETS);
            case '\'':
                return this.char(types.SINGLE_QUOTE);
            case '`':
                return this.char(types.BACK_QUOTE);
            case '"':
                return this.quotedString();
            case '#':
                return this.pound();
            case ';':
                return this.comment();
            default:
                return this.id();
        }
    }

    comment() {
        this.curText += this.peek();
        this.consume();

        while (this.peek() !== undefined && this.peek() !== '\n') {
            this.curText += this.peek();
            this.consume();
        }

        return this.newToken(types.COMMENT);
    }

    pound() {
        this.consume();

        this.curText += '#';
        return this.poundSequence();
    }

    poundSequence() {
        if (this.peek() === '\\') {
            this.curText += this.peek();
            this.consume();

            this.curText += this.peek();
            this.consume();
            return this.newToken(types.POUND_SEQ);
        }

        while (!this.isDelimiter(this.peek())) {
            this.curText += this.peek();
            this.consume();
        }

        return this.newToken(types.POUND_SEQ);
    }

    quotedString() {
        this.curText += this.peek();
        this.consume();

        while (this.peek() !== '\"') {
            if (this.peek() === undefined) {
                return this.newToken(types.MISMATCHED_DBL_QUOTE);
            }

            if (this.peek() === '\\') {
                this.curText += this.peek();
                this.consume();
            }

            this.curText += this.peek();
            this.consume();
        }

        this.curText += this.peek();
        this.consume();

        return this.newToken(types.STRING);
    }

    id() {
        this.curText += this.peek();
        this.consume();

        while (!this.isDelimiter(this.peek())) {
            if (this.curText.length > 1 && this.curText.charAt(0) !== ':' && this.peek() === ':') {
                return this.newToken(types.PACKAGE_NAME, true);
            }

            this.curText += this.peek();
            this.consume();
        }

        if (this.curText.charAt(0) === ':') {
            return this.newToken(types.SYMBOL, true);
        }

        this.curText = this.curText;
        return this.newToken(types.ID, true);
    }

    char(type) {
        this.curText = this.peek();
        this.consume();

        return this.newToken(type);
    }

    ws() {
        this.curText += this.peek();
        this.consume();

        while (this.isWS(this.peek())) {
            this.curText += this.peek();
            this.consume();
        }

        return this.newToken(types.WHITE_SPACE);
    }

    isWS(char) {
        return (char !== undefined) && (char.trim() === '');
    }

    isParens(char) {
        return (char !== undefined) && ((char === '(') || (char === ')'));
    }

    isSqBrackets(char) {
        return (char !== undefined) && ((char === '[') || (char === ']'));
    }

    isCrlyBrackets(char) {
        return (char !== undefined) && ((char === '{') || (char === '}'));
    }

    isDelimiter(char) {
        return char === undefined
            || this.isWS(char)
            || this.isParens(char)
            || this.isSqBrackets(char)
            || this.isCrlyBrackets(char)
            || char === '"';
    }

    newToken(type, upcase = false) {
        const text = upcase ? this.curText : this.curText;
        return new Token(type, this.start, new Position(this.line, this.col), text);
    }

    peek() {
        if (this.curPos >= this.text.length) {
            return undefined;
        }

        return this.text.charAt(this.curPos);
    }

    consume() {
        if (this.curPos >= this.text.length) {
            return;
        }

        if (this.peek() === '\n') {
            this.line += 1;
            this.col = 0;
        } else {
            this.col += 1;
        }

        this.curPos += 1;
    }
};
