
const log = (text) => {
    const chat = document.querySelector('#events');
    let li = document.createElement('li');
    li.innerHTML = text;
    chat.appendChild(li);

    chat.scrollTop = parent.scrollHeight;
};

const onChatSubmitted = (sock) => (e) => {
    e.preventDefault();

    const input = document.querySelector('#chat');
    const text = input.value;
    input.value = '';
    sock.emit('message', text);
};

(() => {

    const sock = io();
    sock.on('message', (text) => log(text));


    document.querySelector('#chat-form').addEventListener('submit', onChatSubmitted(sock));

})();