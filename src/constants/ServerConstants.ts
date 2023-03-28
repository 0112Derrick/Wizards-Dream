export const ServerSizeConstants = {
    serverSize: 50,
};

export enum SocketConstants {
    SERVER_ROOM_FULL = 'server-room-full',
    REQUEST_CLIENT_ONLINE = 'request-client-online',
    REQUEST_CLIENT_LOGOUT = 'request-client-logout',
    REQUEST_MESSAGE = 'request-message',
    RESPONSE_MESSAGE = 'response-message',
    REQUEST_GUILD_MESSAGE = 'request-guild-message',
    REQUEST_WHISPER_MESSAGE = 'request-whisper-message',
    REQUEST_OVERWORLD_GAME_OBJECTS = 'request-overworld-game-objects',
    REQUEST_ACTIVE_PLAYERS = 'request-active-players',
    REQUEST_ACTIVE_SERVERS = 'request-active-servers',
    REQUEST_JOIN_SERVER_ROOM = 'request-join-server-room',
    REQUEST_ADD_CREATED_CHARACTER = 'request-add-character-created',
    REQUEST_CHARACTER_MOVEMENT = 'request-character-movement',
    RESPONSE_ACTIVE_SERVERS = 'response-active-servers',
    RESPONSE_SERVER_MESSAGE = 'response-server-message',
    RESPONSE_CLIENT_JOINED_SERVER = 'response-player-joined-server',
    RESPONSE_CLIENT_ID = 'response-client-id',
    RESPONSE_SYNC_OVERWORLD = 'response-sync-overworld',
    RESPONSE_SYNC_PLAYERS_MOVEMENTS = 'response-sync-players-movements',
    RESPONSE_UPDATED_GAME_OBJECTS = 'response-updated-game-objects',
    RESPONSE_ONLINE_CLIENT = 'response-online-client',
    RESPONSE_OFFLINE_CLIENT = 'response-offline-client',
    RESPONSE_RECONNECT_CLIENT = 'response-reconnect-client',
}