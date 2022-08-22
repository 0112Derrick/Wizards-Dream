export var StatusConstants;
(function (StatusConstants) {
    StatusConstants[StatusConstants["SUCCESS_BASE"] = 200] = "SUCCESS_BASE";
    StatusConstants[StatusConstants["OK"] = 200] = "OK";
    StatusConstants[StatusConstants["REDIRECTION_MESSAGE_BASE"] = 300] = "REDIRECTION_MESSAGE_BASE";
    StatusConstants[StatusConstants["CLIENT_ERROR_BASE"] = 400] = "CLIENT_ERROR_BASE";
    StatusConstants[StatusConstants["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    StatusConstants[StatusConstants["INVALID_PASSWORD"] = 401] = "INVALID_PASSWORD";
    StatusConstants[StatusConstants["INVALID_EMAIL"] = 402] = "INVALID_EMAIL";
    StatusConstants[StatusConstants["USER_NOT_FOUND"] = 403] = "USER_NOT_FOUND";
    StatusConstants[StatusConstants["RESOURCE_NOT_FOUND"] = 404] = "RESOURCE_NOT_FOUND";
    StatusConstants[StatusConstants["SERVER_ERROR_BASE"] = 500] = "SERVER_ERROR_BASE";
    StatusConstants[StatusConstants["UNKNOWN_SERVER_ERROR"] = 500] = "UNKNOWN_SERVER_ERROR";
    StatusConstants[StatusConstants["EMAIL_SEND_FAIL"] = 501] = "EMAIL_SEND_FAIL";
    StatusConstants[StatusConstants["DB_SAVE_ERROR"] = 502] = "DB_SAVE_ERROR";
    StatusConstants[StatusConstants["NETWORK_ERROR"] = 503] = "NETWORK_ERROR";
})(StatusConstants || (StatusConstants = {}));
//# sourceMappingURL=StatusConstants.js.map