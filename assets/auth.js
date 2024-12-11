document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // ตรวจสอบสถานะล็อกอิน

    if (isLoggedIn) {
        // แสดง UI สำหรับผู้ที่ล็อกอินแล้ว
        authSection.innerHTML = `
            <div id="user-icon" class="auth-icon">
                <img src="assets/user.png" alt="User Icon" style="width:50px; height:50px;" />
            </div>
            <div id="cart-icon" class="auth-icon">
                <img src="assets/cart.png" alt="Cart Icon" style="width:50px; height:50px;" />
            </div>
            <button id="logout-btn" style="margin-left:10px;">Logout</button>
        `;

        // นำทางไปหน้า userinfo.html
        document.getElementById('user-icon').addEventListener('click', () => {
            window.location.href = 'userinfo.html';
        });

        // นำทางไปหน้า cart.html
        document.getElementById('cart-icon').addEventListener('click', () => {
            window.location.href = 'cart.html';
        });

        // ฟังก์ชัน Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.clear(); // ล้างข้อมูลทั้งหมดใน Local Storage
            window.location.href = 'sign-in.html'; // นำผู้ใช้กลับไปยังหน้าล็อกอิน
        });
    } else {
        // แสดง UI สำหรับผู้ที่ยังไม่ได้ล็อกอิน
        authSection.innerHTML = `
            <a href="sign-in.html">
                <button id="sign-in-btn">Sign in</button>
            </a>
        `;
    }
});
