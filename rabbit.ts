const username = "guest";
const password = "guest";
const admin_host = "localhost:15672";
const host = "localhost:5672";
const vhost = "demo";
const level = 22;

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${Buffer.from(username + ":" + password).toString("base64")}`
}

console.log("Creating the virtual host");
await fetch(`${admin_host}/api/vhosts/${vhost}`, {
    method: "PUT",
    headers: headers
});

console.log("Creating the delay infra");
// STEP 1: Create the queues
for(let i = level; i >= 0; i--) {
    console.log(`Creating queue at level ${i}`);
    const delay = Math.pow(2, i) * 1000;
    const queue = i < 10 ? `0${i}` : i.toString();
    const _i = i - 1;
    const exchange= _i < 10 ? `0${_i}` : _i.toString();
    const exchangeStr = i != 0 ? `dd-exchange-${exchange}` : `dd-exchange`
    await fetch(`${admin_host}/api/queues/${vhost}/dd-queue-${queue}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({
            "auto_delete": false,
            "durable": true,
            "arguments": {"x-message-ttl": delay, "x-dead-letter-exchange": exchangeStr}
        })
    });
}

// STEP 2: Creating the exchanges
await fetch(`${admin_host}/api/exchanges/${vhost}/dd-exchange`, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify({
        "type": "direct",
        "auto_delete": false,
        "durable": true,
        "internal": false,
        "arguments": {}
    })
});

for(let i = level; i >= 0; i--) {
    console.log(`Creating exchange at level ${i}`);
    const exchange = i < 10 ? `0${i}` : i.toString();
    await fetch(`${admin_host}/api/exchanges/${vhost}/dd-exchange-${exchange}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({
            "type": "topic",
            "auto_delete": false,
            "durable": true,
            "internal": false,
            "arguments": {}
        })
    });
}

// Step 3: Binding the exchanges
let etqKey = "";
let eteKey = "" 
for(let i = level; i >= 0; i--) {
    console.log(`Creating bindings at level ${i}`);
    const queue = i < 10 ? `0${i}` : i.toString();
    const exchange = i < 10 ? `0${i}` : i.toString();
    const _i = i - 1;
    let prevExchange = _i < 10 ? `0${_i}` : _i.toString();
    let keyPrefix = "";
    for(let j = 0; j < level - i; j++) {
        keyPrefix = `*.${keyPrefix}`;
    }
    etqKey = `${keyPrefix}1.#`
    eteKey = `${keyPrefix}0.#`

    await fetch(`${admin_host}/api/bindings/${vhost}/e/dd-exchange-${exchange}/q/dd-queue-${queue}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            "routing_key": etqKey
        })
    });

    await fetch(`${admin_host}/api/bindings/${vhost}/e/dd-exchange-${exchange}/e/dd-exchange-${prevExchange}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            "routing_key": eteKey
        })
    });
}

await fetch(`${admin_host}/api/bindings/${vhost}/e/dd-exchange-00/e/dd-exchange`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
        "routing_key": eteKey
    })
});

// STEP 4: Create the base queue and binding

await fetch(`${admin_host}/api/queues/dd-queue`, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify({
        "auto_delete": false,
        "durable": true
    })
});

await fetch(`${admin_host}/api/bindings/${vhost}/e/dd-exchange/q/dd-queue`, {
    method: "POST",
    headers: headers
});

