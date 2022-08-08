let HTML_IDS = {
    SIGNUP_FORM_SUBMIT: 'signup-submit-btn',
    SIGNUP_FORM_LOGIN: 'signup-login-btn',
    SIGNUP_PASSWORD_INPUT: 'signup-password',
    SIGNUP_EMAIL_INPUT: 'signup-email',
    SIGNUP_FORM: 'signup-form',
    SIGNUP_TITLE: 'title-signup',
    LOGIN_FORM_SUBMIT: 'login-submit-btn',
    LOGIN_FORM_SIGNUP: 'login-signup-btn',
    LOGIN_PASSWORD_INPUT: 'login-password',
    LOGIN_EMAIL_INPUT: 'login-email',
    LOGIN_FORM: 'login-form',
    LOGIN_TITLE: 'title-login',
    GAME_CHAT: 'chat',
    GAME_CHAT_INPUT: 'say',
    GAME_CHAT_FORM: 'chat-form',
    GAME_CHAT_BOARD: 'events'
};
for (let prop in HTML_IDS) {
    Object.defineProperty(HTML_IDS, prop, { configurable: false, writable: false });
}
export default HTML_IDS;
//# sourceMappingURL=HTMLElementIds.js.map