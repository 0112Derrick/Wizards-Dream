
const log = (text) => {
    const chat = document.querySelector('#events');
    let li = document.createElement('li');
    li.innerHTML = text;
    chat.appendChild(li);
    updateScroll(chat);

};
function updateScroll(chat) {
    chat.scrollTop = chat.scrollHeight;
    // setTimeout(() => {
    //     requestAnimationFrame(() => {
    //         updateScroll();
    //     })
    // }, 1000);
}


const onChatSubmitted = (sock) => (e) => {
    e.preventDefault();

    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';
    sock.emit('message', text);
};

function handleInit(msg) {
    console.log(msg);
};

function handleGameState(gameState) {
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        drawGame(gameState);
    })
}

//const sock = io('localhost/8080');

(() => {
    //const canvas = document.querySelector('.game-canvas');
    //const ctx = canvas.getContext('2d');

    const sock = io();
    sock.on('message', (text) => log(text));
    //sock.on('init', (client, state) => handleGameState(state));

    document.querySelector('#chat-form').addEventListener('submit', onChatSubmitted(sock));

})();


