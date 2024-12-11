const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
const moment = require('moment');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


app.use('/images', express.static(path.join(__dirname, 'assets/img')));
app.use(express.static(path.join(__dirname)));

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied' });
    }

    jwt.verify(token, 'YOUR_SECRET_KEY', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid Token' });
        }
        req.user = user; // เก็บข้อมูล user จาก token
        next();
    });
}

app.get('/api/user-info', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            balance: user.balance,
            totalSpent: user.totalSpent,
            membershipLevel: user.membershipLevel
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to Final Projects!');
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function calculateMembershipLevel(totalSpent) {
    if (totalSpent >= 25000) {
        return 'Platinum';
    } else if (totalSpent >= 10000) {
        return 'Gold';
    } else if (totalSpent >= 3000) {
        return 'Silver';
    } else {
        return 'Bronze';
    }
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/coffee-shop', {})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const ContactSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', ContactSchema);

app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newContact = new Contact({ firstName, lastName, email, phone, message });
        await newContact.save();
        res.status(201).json({ message: 'Your message has been sent successfully' });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ error: 'Error saving contact' });
    }
});

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: String, required: true },
    balance: { type: Number, default: 0 }, 
    totalSpent: { type: Number, default: 0 },
    membershipLevel: { type: String, default: 'Bronze' },
    birthdayUsed: { type: Boolean, default: false }, 
});

const User = mongoose.model('User', UserSchema, 'users');

const OTPSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } 
});


const OTP = mongoose.model('OTP', OTPSchema);

app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, dateOfBirth } = req.body;

        // ตรวจสอบว่าทุกฟิลด์ถูกส่งมาครบ
        if (!firstName || !lastName || !phoneNumber || !dateOfBirth) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // ตรวจสอบว่าเบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
        }

        // ตรวจสอบว่า Date of Birth อยู่ในรูปแบบ YYYY-MM-DD
        const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dobRegex.test(dateOfBirth)) {
            return res.status(400).json({ error: 'Date of Birth must be in YYYY-MM-DD format.' });
        }

        // ตรวจสอบว่าปีเกิด (YYYY) อยู่ในช่วงที่ยอมรับ
        const year = parseInt(dateOfBirth.split('-')[0], 10);
        if (year < 1900 || year > new Date().getFullYear()) {
            return res.status(400).json({ error: 'Year of birth must be between 1900 and the current year.' });
        }

        // ตรวจสอบว่าเบอร์โทรถูกใช้แล้วหรือยัง
        const existingPhoneNumber = await User.findOne({ phoneNumber });
        if (existingPhoneNumber) {
            return res.status(400).json({ error: 'This phone number is already registered.' });
        }

        // ตรวจสอบว่านามสกุลซ้ำหรือไม่
        const existingLastName = await User.findOne({ lastName });
        if (existingLastName) {
            return res.status(400).json({ error: 'This last name is already registered. Please use a different one.' });
        }

        // สร้าง User ใหม่ในฐานข้อมูล
        const newUser = new User({
            firstName,
            lastName,
            phoneNumber,
            dateOfBirth,
            balance: 0,
            totalSpent: 0,
            membershipLevel: 'Bronze',
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user. Please try again.' });
    }
});


app.get('/api/user/:id', async (req, res) => {
     try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            balance: user.balance,
            totalSpent: user.totalSpent,
            membershipLevel: user.membershipLevel
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Error fetching user data' });
    }
});
 
app.post('/api/checkout', async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId || !items || !Array.isArray(items)) {
            console.error("Missing or invalid data:", { userId, items });
            return res.status(400).json({ error: 'Missing or invalid userId or items' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found for ID:", userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("Loaded user before update:", user);

        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discountPercentage = 0;
        switch (user.membershipLevel) {
            case 'Silver': discountPercentage = 10; break;
            case 'Gold': discountPercentage = 15; break;
            case 'Platinum': discountPercentage = 20; break;
            default: discountPercentage = 5;
        }

        const discountAmount = (totalAmount * discountPercentage) / 100;
        const netTotal = totalAmount - discountAmount;

        if (user.balance < netTotal) {
            console.error("Insufficient balance:", { balance: user.balance, netTotal });
            return res.status(400).json({ error: 'Insufficient balance. Please top up.' });
        }

        // อัปเดต user
        user.balance -= netTotal;
        user.totalSpent += netTotal;
        user.membershipLevel = calculateMembershipLevel(user.totalSpent);

        console.log("Updated user data before save:", user);

        try {
            await user.save();
            console.log("User saved successfully:", user);
        } catch (saveError) {
            console.error("Error saving user data:", saveError);
            return res.status(500).json({ error: 'Error saving user data.' });
        }

        // บันทึกการขาย
        const sale = new Sale({
            userId,
            items,
            totalAmount,
            purchaseDate: new Date(),
        });

        await sale.save();
        console.log("Sale saved successfully:", sale);

        res.status(200).json({
            message: 'Order confirmed successfully!',
            remainingBalance: user.balance,
            totalSpent: user.totalSpent,
            membershipLevel: user.membershipLevel
        });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Error during checkout. Please try again.' });
    }
});

app.post('/api/request-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const newOTP = new OTP({ phoneNumber, otp });
        await newOTP.save();

        console.log(`🔑 OTP for ${phoneNumber}: ${otp}`);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('❌ Error sending OTP:', error);
        res.status(500).json({ error: 'Error sending OTP' });
    }
});


app.post('/api/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        const validOTP = await OTP.findOne({ phoneNumber, otp });
        if (!validOTP) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        await OTP.deleteOne({ _id: validOTP._id });

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // สร้าง JWT
        const token = jwt.sign({ id: user._id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });

        res.status(200).json({
            message: 'OTP verified successfully',
            token: token, // ส่ง JWT กลับไป
            userId: user._id // ส่ง userId กลับไป
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const SaleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        }
    ],
    totalAmount: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
    purchaseTime: { type: String, default: () => new Date().toLocaleTimeString() } // เพิ่ม purchaseTime ที่จะเก็บเวลา
});


const Sale = mongoose.model('Sale', SaleSchema);

app.post('/api/sales', async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'User ID and items are required' });
        }

        let totalAmount = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await Menu.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
            }

            totalAmount += product.price * item.quantity;
            saleItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
            });
        }

        const newSale = new Sale({
            userId,
            items: saleItems,
            totalAmount,
            purchaseDate: new Date(), // ใช้เวลาปัจจุบัน
            purchaseTime: new Date().toLocaleTimeString() // เก็บเวลาในฟิลด์ purchaseTime
        });

        await newSale.save();
        res.status(201).json({ message: 'Sale recorded successfully', sale: newSale });
    } catch (error) {
        console.error('Error recording sale:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/api/sales', async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('userId', 'firstName lastName') 
            .populate('items.productId', 'name'); 
        res.status(200).json(sales);
    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ error: 'Error fetching sales report' });
    }
});





app.get('/api/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Menu.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Error fetching product details' });
    }
});


app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

app.get('/api/menu', async (req, res) => {
    try {
        const { search } = req.query;

        // สร้าง query ตามคำค้นหา
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        // ดึงข้อมูลและเรียงลำดับตาม category
        const menus = await Menu.find(query).sort({ category: 1 }); // 1 หมายถึงเรียงจากน้อยไปมาก
        res.json(menus);
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.status(500).json({ error: 'Error fetching menus' });
    }
});
app.get('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params; // ดึง ID จาก URL
        const menu = await Menu.findById(id); // ใช้ Mongoose ค้นหาเมนูตาม ID

        if (!menu) {
            return res.status(404).json({ error: "Menu not found" }); // ถ้าไม่มีเมนู
        }

        res.json(menu); // ส่งข้อมูลเมนูกลับไป
    } catch (error) {
        console.error("Error fetching menu details:", error);
        res.status(500).json({ error: "Error fetching menu details" });
    }
});


const MenuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    category: { type: String, required: true },
    type: { type: String, required: true }, 
    image: { type: String, default: 'default.jpg' }, 
});

const Menu = mongoose.model('Menu', MenuSchema);

app.get('/must-try', async (req, res) => {
    try {
        // รายชื่อเมนูที่ต้องการโชว์
        const mustTryNames = [
            "Latte",
            "Cappuccino",
            "Mocha",
            "Hot Chocolate",
            "Orange Sunrise",
            "Matcha Bliss",
            "Iced Thai Tea",
            "Caramel Frappe",
            "Masala Chai"
        ];
        const mustTryMenus = await Menu.find({ name: { $in: mustTryNames } });
        res.json(mustTryMenus);
    } catch (error) {
        console.error('Error fetching must-try menus:', error);
        res.status(500).json({ error: 'Error fetching must-try menus' });
    }
});

app.get('/menu/hot-coffee', async (req, res) => {
    try {
        const hotCoffeeMenus = await Menu.find({ type: "hot", category: "coffee" });
        res.json(hotCoffeeMenus);
    } catch (error) {
        console.error('Error fetching hot coffee menus:', error);
        res.status(500).json({ error: 'Error fetching hot coffee menus' });
    }
});

app.get('/menu/hot-tea', async (req, res) => {
    try {
        const hotTeaMenus = await Menu.find({ type: "hot", category: "tea" });
        res.json(hotTeaMenus);
    } catch (error) {
        console.error('Error fetching hot tea menus:', error);
        res.status(500).json({ error: 'Error fetching hot tea menus' });
    }
});

app.get('/menu/other-hot-beverages', async (req, res) => {
    try {
        const otherHotBeverages = await Menu.find({ category: "other-hot-beverages", type: "hot" });
        res.json(otherHotBeverages);
    } catch (error) {
        console.error('Error fetching Other Hot Beverages:', error);
        res.status(500).json({ error: 'Error fetching Other Hot Beverages' });
    }
});

app.get('/menu/cold-coffee', async (req, res) => {
    try {
        const coldCoffeeMenus = await Menu.find({ category: "coffee", type: "cold" });
        res.json(coldCoffeeMenus);
    } catch (error) {
        console.error('Error fetching Cold Coffee:', error);
        res.status(500).json({ error: 'Error fetching Cold Coffee' });
    }
});

app.get('/menu/ice-tea', async (req, res) => {
    try {
        const iceTeaMenus = await Menu.find({ category: "tea", type: "cold" });
        res.json(iceTeaMenus);
    } catch (error) {
        console.error('Error fetching Ice Tea:', error);
        res.status(500).json({ error: 'Error fetching Ice Tea' });
    }
});

app.get('/menu/other-iced-beverages', async (req, res) => {
    try {
        const otherIcedBeverages = await Menu.find({ category: "other-iced-beverages", type: "cold" });
        res.json(otherIcedBeverages);
    } catch (error) {
        console.error('Error fetching Other Iced Beverages:', error);
        res.status(500).json({ error: 'Error fetching Other Iced Beverages' });
    }
});

app.get('/menu/juice', async (req, res) => {
    try {
        const juices = await Menu.find({ category: "juice" });
        res.json(juices);
    } catch (error) {
        console.error('Error fetching juices:', error);
        res.status(500).json({ error: 'Error fetching juices' });
    }
});

app.get('/menu/food', async (req, res) => {
    try {
        const foodItems = await Menu.find({ category: "food" });
        res.json(foodItems);
    } catch (error) {
        console.error('Error fetching food:', error);
        res.status(500).json({ error: 'Error fetching food' });
    }
});



app.post('/menu', async (req, res) => {
    try {
        const { name, price, description, category, image } = req.body;

        if (!name || !price || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newMenuItem = new Menu({ name, price, description, category, image });
        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (error) {
        console.error('Error saving menu item:', error);
        res.status(500).json({ error: 'Error saving menu item' });
    }
});

app.post('/api/menu', async (req, res) => {
    try {
        const { name, price, category, type } = req.body;

        if (!name || !price || !category || !type) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newMenuItem = new Menu({ name, price, category, type });
        await newMenuItem.save();

        res.status(201).json({ message: 'Menu added successfully', menu: newMenuItem });
    } catch (error) {
        console.error('Error adding menu:', error);
        res.status(500).json({ error: 'Error adding menu' });
    }
});


app.put('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category } = req.body;

        const updatedMenu = await Menu.findByIdAndUpdate(
            id,
            { name, price, category },
            { new: true } // คืนค่าใหม่หลังอัปเดต
        );

        if (!updatedMenu) {
            return res.status(404).json({ error: 'Menu not found' });
        }

        res.status(200).json({ message: 'Menu updated successfully', menu: updatedMenu });
    } catch (error) {
        console.error('Error updating menu:', error);
        res.status(500).json({ error: 'Error updating menu' });
    }
});

app.delete('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedMenu = await Menu.findByIdAndDelete(id);

        if (!deletedMenu) {
            return res.status(404).json({ error: 'Menu not found' });
        }

        res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu:', error);
        res.status(500).json({ error: 'Error deleting menu' });
    }
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
