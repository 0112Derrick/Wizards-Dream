const HTML_IDS = {
    GAME_CHAT: 'chat',
    GAME_CHAT_INPUT: 'say',
    GAME_CHAT_FORM: 'chat-form',
    GAME_CHAT_BOARD: 'events',
    CHARACTER_NAME: 'character-name',
    CHARACTER_GENDER_MALE_BTN: 'character-gender-male-btn',
    CHARACTER_GENDER_FEMALE_BTN: 'character-gender-male-btn',
    CHARACTER_CREATE_FORM: 'character-create-form',
    LOGOUT: 'logout',
};
const SIGNUP_HTML_IDS = {
    SIGNUP_FORM_SUBMIT: 'signup-submit-btn',
    SIGNUP_FORM_LOGIN: 'signup-login-btn',
    SIGNUP_PASSWORD_INPUT: 'signup-password',
    SIGNUP_EMAIL_INPUT: 'signup-email',
    SIGNUP_FORM: 'signup-form',
    SIGNUP_TITLE: 'title-signup',
    SIGNUP_USERNAME: 'signup-username',
    LOGIN_FORM_SUBMIT: 'login-submit-btn',
    LOGIN_FORM_SIGNUP: 'login-signup-btn',
    LOGIN_PASSWORD_INPUT: 'login-password',
    LOGIN_EMAIL_INPUT: 'login-email',
    LOGIN_FORM: 'login-form',
    LOGIN_TITLE: 'login-title',
};
for (let prop in SIGNUP_HTML_IDS) {
    Object.defineProperty(SIGNUP_HTML_IDS, prop, { configurable: false, writable: false });
}
for (let prop in HTML_IDS) {
    Object.defineProperty(HTML_IDS, prop, { configurable: false, writable: false });
}
export { HTML_IDS, SIGNUP_HTML_IDS as LANDING_HTML_IDS };
//# sourceMappingURL=HTMLElementIds.js.map