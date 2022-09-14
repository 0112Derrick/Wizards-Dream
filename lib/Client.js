
<<<<<<< Updated upstream
=======
import { io } from 'socket.io-client';
//import DOMPurify from 'dompurify';
//const sock = io('localhost/8080');


>>>>>>> Stashed changes
const log = (text) => {
    const chat = document.querySelector('#events');
    let li = document.createElement('li');
    li.innerHTML = text;
    chat.appendChild(li);

    chat.scrollTop = parent.scrollHeight;
};
<<<<<<< Updated upstream
=======

function updateScroll(chat) {
    chat.scrollTop = chat.scrollHeight;
    // setTimeout(() => {
    //     requestAnimationFrame(() => {
    //         updateScroll();
    //     })
    // }, 1000);
}

>>>>>>> Stashed changes

const onChatSubmitted = (sock) => (e) => {
    e.preventDefault();

    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';
    sock.emit('message', text);
};

<<<<<<< Updated upstream
=======
function handleInit(msg) {
    console.log(msg);
};

function handleGameState(gameState) {
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        drawGame(gameState);
    })
}


>>>>>>> Stashed changes
(() => {
    const canvas = document.querySelector('.game-canvas');
    const ctx = canvas.getContext('2d');

    const sock = io();
    sock.on('message', (text) => log(text));
<<<<<<< Updated upstream

=======
    
    //sock.on('init', (client, state) => handleGameState(state));
>>>>>>> Stashed changes

    document.querySelector('#chat-form').addEventListener('submit', onChatSubmitted(sock));

})();