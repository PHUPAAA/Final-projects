document.addEventListener("DOMContentLoaded", () => {
    const menuTableBody = document.querySelector("#menu-table tbody");
    const API_URL = "http://localhost:5000/api/menu";
    const modal = document.querySelector("#product-modal");
    const modalTitle = document.querySelector("#modal-title");
    const closeModal = document.querySelector("#close-modal");
    const addProductBtn = document.querySelector("#add-product-btn");
    const productForm = document.querySelector("#product-form");
    const productIdInput = document.querySelector("#productId");
    const productNameInput = document.querySelector("#productName");
    const productPriceInput = document.querySelector("#productPrice");
    const productCategoryInput = document.querySelector("#productCategory");
    const productTypeInput = document.querySelector("#productType"); // เพิ่มสำหรับ type

    // เปิด/ปิด Modal
    const openModal = () => (modal.style.display = "block");
    const closeModalHandler = () => {
        modal.style.display = "none";
        productForm.reset();
        productIdInput.value = "";
    };

    closeModal.addEventListener("click", closeModalHandler);
    addProductBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Product";
        openModal();
    });

    // โหลดเมนูทั้งหมด
    const loadMenus = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch menus");

            const menus = await response.json();
            menuTableBody.innerHTML = "";

            menus.forEach((menu) => {
                const row = `
                    <tr>
                        <td>${menu.name}</td>
                        <td>${menu.price} ฿</td>
                        <td>${menu.category}</td>
                        <td>
                            <button class="edit-btn" data-id="${menu._id}">Edit</button>
                            <button class="delete-btn" data-id="${menu._id}">Delete</button>
                        </td>
                    </tr>`;
                menuTableBody.insertAdjacentHTML("beforeend", row);
            });

            attachEventListeners();
        } catch (error) {
            console.error("Error loading menus:", error);
        }
    };

    // เพิ่ม/แก้ไขเมนู
    productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = productIdInput.value; // เช็คว่าเป็นการเพิ่มหรือแก้ไข
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const category = productCategoryInput.value.trim();
    const type = productTypeInput.value.trim(); // ฟิลด์ type

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!name || isNaN(price) || !category || !type) {
        alert("All fields are required!");
        return;
    }

    try {
        const method = id ? "PUT" : "POST";
        const endpoint = id ? `${API_URL}/${id}` : API_URL;

        // Log ข้อมูลที่กำลังส่ง
        console.log("Sending data:", { name, price, category, type });

        const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price, category, type }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error details:", errorData);
            throw new Error(errorData.error || "Failed to save product");
        }

        alert("Menu saved successfully!");
        closeModalHandler();
        loadMenus();
    } catch (error) {
        console.error("Error saving menu:", error);
        alert("Failed to save menu. Please try again.");
    }
});

    // ลบเมนู
    const deleteMenu = async (id) => {
        if (confirm("Are you sure you want to delete this menu?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                if (!response.ok) throw new Error("Failed to delete menu");

                loadMenus();
            } catch (error) {
                console.error("Error deleting menu:", error);
            }
        }
    };

    // เพิ่ม Event Listeners สำหรับปุ่ม Edit/Delete
    const attachEventListeners = () => {
        // เพิ่ม Event Listener ให้ปุ่ม Edit
        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.dataset.id;

                try {
                    const response = await fetch(`${API_URL}/${id}`);
                    if (!response.ok) throw new Error("Failed to fetch menu");

                    const menu = await response.json();

                    // เติมข้อมูลในฟอร์ม
                    productIdInput.value = menu._id;
                    productNameInput.value = menu.name;
                    productPriceInput.value = menu.price;
                    productCategoryInput.value = menu.category;
                    productTypeInput.value = menu.type || "N/A"; // แสดงค่า type หรือ N/A

                    // เปลี่ยนหัวข้อ Modal เป็น "Edit Product"
                    modalTitle.textContent = "Edit Product";

                    // เปิด Modal
                    openModal();
                } catch (error) {
                    console.error("Error fetching menu for edit:", error);
                    alert("Failed to fetch menu details. Please try again.");
                }
            });
        });

        // เพิ่ม Event Listener ให้ปุ่ม Delete
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const id = e.target.dataset.id;
                deleteMenu(id);
            });
        });
    };

    // โหลดเมนูเมื่อเริ่มต้น
    loadMenus();
});
