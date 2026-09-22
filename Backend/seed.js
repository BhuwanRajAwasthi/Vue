require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB for seeding');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Created admin user:', adminEmail);
    } else {
      console.log('Admin user already exists:', adminEmail);
    }

    const jsonPath = path.join(__dirname, '..', 'Frontend', 'ecommerce_products_30.json');

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const productsData = JSON.parse(raw);

    const formattedProducts = productsData.map((item, index) => {
      const baseSeed = item.image || `https://picsum.photos/seed/ecommerce-${index + 1}/800/800`;
      const cleanSeed = baseSeed.replace(/\/800\/800$/, '');
      const images = [
        baseSeed,
        `${cleanSeed}-angle1/800/800`,
        `${cleanSeed}-angle2/800/800`,
        `${cleanSeed}-detail/800/800`
      ];

      return {
        title: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        stock: item.stock,
        brand: item.brand || '',
        image: baseSeed,
        images,
        sizes: item.sizes || (item.category === 'Footwear' ? ['39', '40', '41', '42'] : ['S', 'M', 'L', 'XL']),
        colors: item.colors || ['Black', 'White', 'Navy']
      };
    });

    const count = await Product.countDocuments();

    if (count === 0) {
      await Product.insertMany(formattedProducts);
      console.log(`Inserted ${formattedProducts.length} products into MongoDB`);
    } else {
      for (const product of formattedProducts) {
        await Product.updateOne(
          { title: product.title },
          { $set: { sizes: product.sizes, colors: product.colors, images: product.images, image: product.image } }
        );
      }
      console.log('Products already exist, backfilled multi-images, size, and color options');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });