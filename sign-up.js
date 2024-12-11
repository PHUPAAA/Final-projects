document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // ป้องกันการ reload หน้า

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const phoneNumber = document.getElementById('tel').value.trim();
    const dateOfBirth = document.getElementById('dob').value;

    // ตรวจสอบว่าเบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert('Phone number must be exactly 10 digits.');
        return; // หยุดการทำงานถ้าเบอร์ไม่ถูกต้อง
    }

    // ตรวจสอบว่าปีเกิด (YYYY) มี 4 ตัว
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dateOfBirth)) {
        alert('Date of Birth must be in YYYY-MM-DD format.');
        return; // หยุดการทำงานถ้าไม่ผ่าน
    }

    const year = parseInt(dateOfBirth.split('-')[0], 10);
    if (year < 1900 || year > new Date().getFullYear()) {
        alert('Year of birth must be between 1900 and the current year.');
        return; // หยุดการทำงานถ้าปีไม่อยู่ในช่วงที่ยอมรับ
    }
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, phoneNumber, dateOfBirth }),
        });

        const data = await response.json();

        if (response.ok) { // ตรวจสอบว่าคำขอสำเร็จ
            alert(data.message || 'Account created successfully!');
            window.location.href = 'sign-in.html'; // นำไปยังหน้า sign-in
        } else {
            alert(data.error || 'Failed to register');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
