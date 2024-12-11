document.addEventListener("DOMContentLoaded", () => {
    const userTableBody = document.querySelector("#user-table tbody");

    // API URL ของ Backend
    const API_URL = "http://localhost:5000/api/users";

    // ฟังก์ชันโหลดข้อมูลผู้ใช้
    const loadUsers = async () => {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const users = await response.json();
            userTableBody.innerHTML = ""; // ล้างข้อมูลเก่าก่อนโหลดใหม่

            users.forEach((user) => {
                const row = `
                    <tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.phoneNumber}</td>
                        <td>${user.membershipLevel}</td>
                        <td>${user.totalSpent.toLocaleString()} ฿</td>
                    </tr>`;
                userTableBody.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Error loading users:", error);
            userTableBody.innerHTML = "<tr><td colspan='4'>Failed to load user data. Please try again later.</td></tr>";
        }
    };

    // โหลดข้อมูลทันทีเมื่อหน้าเว็บโหลดเสร็จ
    loadUsers();
});
