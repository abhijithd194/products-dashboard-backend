const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Get all products with optional search, filter, pagination
router.get('/', async (req, res) => {
    try {
        const { search, category, page = 1, limit = 12 } = req.query;

        const query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'All') {
            query.category = { $regex: `^${category}$`, $options: 'i' };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            products,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/products - Create a new product
router.post('/', async (req, res) => {
    try {
        const { title, description, price, category, image } = req.body;

        const product = new Product({ title, description, price, category, image });
        const savedProduct = await product.save();

        res.status(201).json(savedProduct);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/products/:id - Update existing product
router.put('/:id', async (req, res) => {
    try {
        const { title, description, price, category, image } = req.body;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { title, description, price, category, image },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
