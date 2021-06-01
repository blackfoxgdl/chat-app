const socket = io();

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked');
//     socket.emit('increment');
// });

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocation = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const sidebarChatTemplate = document.querySelector('#sidebar-chat-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;
    
    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const contentHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if ((contentHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop= $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('shareLocation', (locationUrl) => {
    const urlHtml = Mustache.render(urlTemplate, {
        username: locationUrl.username,
        myLocation: locationUrl.url,
        createdAt: moment(locationUrl.createdAt).format('h:mm a')
    });

    $messages.insertAdjacentHTML('beforeend', urlHtml);
    autoscroll();
});

socket.on('roomData', ({ rooms, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});

socket.on('roomsListData', (rooms) => {
    const html = Mustache.render(sidebarChatTemplate, {
        rooms
    });

    document.querySelector('#sidebar-rooms').innerHTML = html;
});

$messageForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    // disabled form
    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = evt.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // enabled
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
    });
});

$sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $sendLocation.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position);
        socket.emit('sendLocation', {latitude: position.coords.latitude, longitude: position.coords.longitude}, () => {
            $sendLocation.removeAttribute('disabled');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});