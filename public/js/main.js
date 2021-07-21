
const socket = io()

const addToCart = document.querySelectorAll('.add-to-cart');
const cartCounter = document.getElementById('cartCounter');

addToCart.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // PIZZA OBJECT
        const pizza = JSON.parse(btn.dataset.pizza)
        updateCart(pizza);
    })
})


function updateCart(pizza) {
    axios.post('/update-cart', pizza)
        .then(res => {
            cartCounter.innerHTML = res.data.totalQty

            new Noty({
                text: 'Item Added Succesfully',
                type: 'success',
                timeout: 400
            }).show()

        })
        .catch(err => {
            console.log(err)
            new Noty({
                text: 'Something Went Wrong',
                type: 'error',
                timeout: 400
            }).show()
        })
}


// REMOVE ORDER PLACED SUCCEFULLY ELEMENT FROM DOM
const orderPlacedSuccessFully = document.getElementById('success-alert');
setTimeout(() => {
    orderPlacedSuccessFully.remove();
}, 2000)


// ######## ADMIN PORTION #############


const orderTableBody = document.querySelector('#orderTableBody')
let orders = []
let markup

axios.get('/admin/orders', {
    headers: {
        "X-Requested-With": "XMLHttpRequest"
    }
}).then(res => {
    orders = res.data
    markup = generateMarkup(orders)
    orderTableBody.innerHTML = markup
}).catch(err => {
    console.log(err)
})

function renderItems(items) {
    let parsedItems = Object.values(items)
    return parsedItems.map((menuItem) => {
        return `
            <p>${menuItem.item.name} - ${menuItem.qty} pcs </p>
        `
    }).join('')
}

function generateMarkup(orders) {
    return orders.map(order => {
        return `
            <tr>
            <td class="border px-4 py-2 text-green-900">
                <p>${order._id}</p>
                <div>${renderItems(order.items)}</div>
            </td>
            <td class="border px-4 py-2">${order.customerId.name}</td>
            <td class="border px-4 py-2">${order.address}</td>
            <td class="border px-4 py-2">
                <div class="inline-block relative w-64">
                    <form action="/admin/order/status" method="POST">
                        <input type="hidden" name="orderId" value="${order._id}">
                        <select name="status" onchange="this.form.submit()"
                            class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
                            <option value="order_placed"
                                ${order.status === 'order_placed' ? 'selected' : ''}>
                                Placed</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>
                                Confirmed</option>
                            <option value="prepared" ${order.status === 'prepared' ? 'selected' : ''}>
                                Prepared</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>
                                Delivered
                            </option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>
                                Completed
                            </option>
                        </select>
                    </form>
                    <div
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
            </td>
            <td class="border px-4 py-2">
                ${moment(order.createdAt).format('hh:mm A')}
            </td>
        </tr>
    `
    }).join('')
}
socket.on('orderPlaced', order => {
    new Noty({
        type: 'success',
        text: 'Order Placed',
        timeout: 1000,
    }).show()

    // ORDERS OBJECT =>  RECIVES FROM AXIOS GET REQ =>  req.data 
    orders.unshift(order)

    orderTableBody.innerHTML = ""
    orderTableBody.innerHTML = generateMarkup(orders)
})



// ######## CHANGE ORDER STATUS ##############

const hiddenInput = document.querySelector('#hiddenInput');
const statuses = document.querySelectorAll('.status_line');
let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);

let time = document.createElement('small');


// CALLING A FUNC
updateStatus(order)


function updateStatus(order) {
    statuses.forEach(status => {
        status.classList.remove('step-completed');
        status.classList.remove('current');
    })

    let stepCompleted = true;
    statuses.forEach(status => {
        let dataProps = status.dataset.status;
        // console.log(dataProps)
        if (stepCompleted) {
            status.classList.add('step-completed');
        }
        if (dataProps === order.status) {
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('hh:mm: a')
            status.appendChild(time)
            if (status.nextElementSibling) {
                status.nextElementSibling.classList.add('current')
            }
        }
    })
}

// SOCKET RELATED WORK

if (order) {
    socket.emit('join', `order_${order._id}`)
}

// ADMIN RECIEVES ORDER IN REAL TIME
let adminPath = window.location.pathname;
if (adminPath.includes('admin')) {
    socket.emit('join', 'adminRoom')
}







// lISTING FOR ORDER UPDATED
socket.on('orderUpdated', data => {
    const updatedOrder = { ...order };
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status;

    updateStatus(updatedOrder);
    new Noty({
        type: 'success',
        text: 'Order Updated',
        timeout: 1000
    }).show();
})
