async function fetchMembershipLevel() {
    const userId = localStorage.getItem("userId");
    if (!userId) return "Bronze";

    try {
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("membershipLevel", data.membershipLevel); // Update Local Storage
            return data.membershipLevel || "Bronze";
        }
    } catch (error) {
        console.error("Error fetching membership level:", error);
    }
    return "Bronze";
}

async function updateUserInfo() {
    const userId = localStorage.getItem("userId");
    try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        if (response.ok) {
            console.log('Updated user data:', data); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้จาก API
            document.getElementById("user-balance").textContent = data.balance;
            document.getElementById("user-total-spent").textContent = data.totalSpent;
            localStorage.setItem("membershipLevel", data.membershipLevel);
        } else {
            console.error("Failed to fetch updated user data:", data.error);
        }
    } catch (error) {
        console.error("Error fetching updated user data:", error);
    }
}


// Fetch Product ID by Name
async function fetchProductIdByName(productName) {
    try {
        const res = await fetch("/api/menu");
        const products = await res.json();
        const product = products.find((p) => p.name === productName);
        return product ? product._id : null;
    } catch (error) {
        console.error("Error fetching product ID:", error);
        return null;
    }
}

// Update Cart with Product IDs
async function updateCartWithProductIds() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let updated = false;

    for (let item of cart) {
        if (!item.productId) {
            const productId = await fetchProductIdByName(item.name);
            if (productId) {
                item.productId = productId;
                updated = true;
            } else {
                console.error(`Product ID not found for: ${item.name}`);
            }
        }
    }

    if (updated) {
        localStorage.setItem("cart", JSON.stringify(cart));
        console.log("Cart updated with product IDs.");
    }
}



async function renderCart() {
    const cartTableBody = document.querySelector("#cart-table tbody");
    const grandTotalElement = document.getElementById("grand-total");
    const discountAmountElement = document.getElementById("discount-amount");
    const netTotalElement = document.getElementById("net-total");

    cartTableBody.innerHTML = "";
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!Array.isArray(cart) || cart.length === 0) {
        cartTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Your cart is empty.</td></tr>`;
        grandTotalElement.textContent = "0";
        discountAmountElement.textContent = "0";
        netTotalElement.textContent = "0";
        return;
    }

    await updateCartWithProductIds();

    let grandTotal = 0;

    cart.forEach((product, index) => {
        const totalPrice = product.price * product.quantity;
        grandTotal += totalPrice;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td>
                <button class="quantity-btn minus" onclick="updateQuantity(${index}, -1)">-</button>
                ${product.quantity}
                <button class="quantity-btn plus" onclick="updateQuantity(${index}, 1)">+</button>
            </td>
            <td>${totalPrice}</td>
            <td>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });

    grandTotalElement.textContent = grandTotal;

    const userMembership = await fetchMembershipLevel();
    let discountPercentage = 0;
    switch (userMembership) {
        case "Silver":
            discountPercentage = 10;
            break;
        case "Gold":
            discountPercentage = 15;
            break;
        case "Platinum":
            discountPercentage = 20;
            break;
        default:
            discountPercentage = 5;
    }

    const discountAmount = (grandTotal * discountPercentage) / 100;
    const netTotal = grandTotal - discountAmount;

    discountAmountElement.textContent = discountAmount.toFixed(2);
    netTotalElement.textContent = netTotal.toFixed(2);
}

function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart[index].quantity + change > 0) {
        cart[index].quantity += change;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
    } else {
        alert("Quantity cannot be less than 1.");
    }
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

document.getElementById("confirm-order").addEventListener("click", async () => {
    const netTotal = parseFloat(document.getElementById("net-total").textContent);
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const userId = localStorage.getItem("userId");

    console.log("Checkout data:", { userId, cartItems, netTotal });

    if (!userId) {
        alert('Error: User not logged in. Please log in again.');
        return;
    }

    if (cartItems.length === 0) {
        alert('Cart is empty.');
        return;
    }

    try {
        const items = cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
        }));

        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, items }),
        });

        const data = await res.json();
        console.log("Checkout response:", data);

        if (res.ok) {
            await updateUserInfo();
            alert(`Order confirmed!`);
            localStorage.removeItem("cart");
            window.location.href = "menu.html";
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Error during checkout. Please try again.');
    }
});

function updateUserInfo() {
    // Fetch the latest user data from the server and update the UI accordingly
}



document.getElementById("cancel-order").addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel the order?")) {
        localStorage.removeItem("cart");
        window.location.href = "menu.html";
    }
});

updateUserInfo();
renderCart();
