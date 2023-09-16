const socket = io()

//Elements
const formElement = document.querySelector("#msgForm");
const formInputElement = document.querySelector("#msgField");
const formBtnElement = document.querySelector("#msgBtn");
const sendLocationBtn = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

formBtnElement.disabled = true;

//Templates
const messageTemplate = document.querySelector('#msg-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { userName, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
   //get new message element
   const newMsg = messages.lastElementChild
   console.log(newMsg, '...')

   //height of new message
   const newMsgStyle = getComputedStyle(newMsg)
   const newMsgMargin = parseInt(newMsgStyle.marginBottom)
   const newMsgHeight = newMsg.offsetHeight + newMsgMargin
   console.log(newMsgHeight)

   //visible height
   const visibleHeight = messages.offsetHeight
   console.log(visibleHeight, "lll")

   //height of msg container
   const containerHeight = messages.scrollHeight
   console.log(containerHeight, "containerHeight")

   //how far have i scrolled?
   const scrollOffset = messages.scrollTop + visibleHeight
   console.log(scrollOffset, "scrollOffset")

   if (containerHeight - newMsgHeight <= scrollOffset) {
      messages.scrollTop = messages.scrollHeight
   }
}

socket.on('message', (message) => {
   console.log(message);
   const html = Mustache.render(messageTemplate, {
      userName: message.userName,
      message: message.text,
      createdAt: moment(message.createdAt).format('h:mm a')
   })
   messages.insertAdjacentHTML('beforeend', html)
   autoScroll();
});

socket.on('locationMessage', (message) => {
   console.log(message);
   const html = Mustache.render(locationTemplate, {
      userName: message.userName,
      url: message.url,
      createdAt: moment(message.createdAt).format('h:mm a')
   })
   messages.insertAdjacentHTML('beforeend', html)
   autoScroll();
});

socket.on('roomData', ({ room, users }) => {
   const html = Mustache.render(sidebarTemplate, {
      room,
      users,
   })
   document.querySelector("#sidebar").innerHTML = html
});

// Add an event listener to the input field
formInputElement.addEventListener("input", function () {
   // Check if the input field has a value
   if (formInputElement.value.trim() !== "") {
      // Enable the button if there is text in the input field
      formBtnElement.disabled = false;
   } else {
      // Disable the button if the input field is empty
      formBtnElement.disabled = true;
   }
});

//On Sending the form
formElement.addEventListener("submit", (e) => {
   e.preventDefault();
   //Get thwe value of input field
   const message = e.target.elements.msgField.value

   socket.emit('sendMessage', message, (error) => {
      formInputElement.value = ''
      formInputElement.focus()
      if (error) {
         return console.log(error)
      }
      console.log('Message delivered!')
      formBtnElement.disabled = true;
   })
});

//On Sending the location 
sendLocationBtn.addEventListener('click', () => {
   if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser!')
   }
   // sendLocationBtn.disabled = true
   navigator.geolocation.getCurrentPosition((position) => {
      socket.emit('sendLocation', {
         latitude: position.coords.latitude,
         longitude: position.coords.longitude
      }, () => {
         // sendLocationBtn.disabled = false
         console.log('Location shared!')
      })
   })
})

socket.emit('join', { userName, room }, (error) => {
   if (error) {
      alert(error)
      location.href = "/"
   }
})