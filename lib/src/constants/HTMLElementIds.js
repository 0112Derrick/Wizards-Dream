const HTML_IDS = {
    GAME_CHAT_INPUT: "game-chat-input",
    GAME_CHAT_SUBMIT: "game-chat-submit",
    GAME_CHAT_FORM: "game-chat-form",
    GAME_CHAT_UL: "game-chat-ul",
    CHARACTER_NAME: "character-name",
    CHARACTER_GENDER_MALE_BTN: "character-gender-male-btn",
    CHARACTER_GENDER_FEMALE_BTN: "character-gender-female-btn",
    CHARACTER_CREATE_FORM: "character-create-form",
    CHARACTER_CREATE_FORM_SUBMIT_BTN: "character-create-form-submit-btn",
    SELECT_SERVER: "select-server",
    SERVER_SELECTION_MODAL: "server-selection-modal",
    CLOSE_SERVER_MODAL: "close-server-modal",
    SERVER_SELECTION_BUTTONS_CONTAINER: "server-selection-buttons-container",
    LOCKSCREEN: "lockscreen",
    LOGOUT: "logout",
    CHARACTER_MODAL_BTN: "character-modal-btn",
    SELECT_CHARACTERS: "select-characters",
    CHARACTER_CREATE_MODAL: "character-create-modal",
    LOADING_SCREEN: "loading-screen",
};
const SIGNUP_HTML_IDS = {
    SIGNUP_FORM_SUBMIT: "signup-submit-btn",
    SIGNUP_FORM_LOGIN: "signup-login-btn",
    SIGNUP_PASSWORD_INPUT: "signup-password",
    SIGNUP_EMAIL_INPUT: "signup-email",
    SIGNUP_FORM: "signup-form",
    SIGNUP_TITLE: "title-signup",
    SIGNUP_USERNAME: "signup-username",
    LOGIN_FORM_SUBMIT: "login-submit-btn",
    LOGIN_FORM_SIGNUP: "login-signup-btn",
    LOGIN_PASSWORD_INPUT: "login-password",
    LOGIN_EMAIL_INPUT: "login-email",
    LOGIN_FORM: "login-form",
    LOGIN_TITLE: "login-title",
};
for (let prop in SIGNUP_HTML_IDS) {
    Object.defineProperty(SIGNUP_HTML_IDS, prop, {
        configurable: false,
        writable: false,
    });
}
for (let prop in HTML_IDS) {
    Object.defineProperty(HTML_IDS, prop, {
        configurable: false,
        writable: false,
    });
}
export { HTML_IDS, SIGNUP_HTML_IDS as LANDING_HTML_IDS };
//# sourceMappingURL=HTMLElementIds.js.map