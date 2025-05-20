const DestinationCategory = require('../models/destinationCategory');

exports.createCategory = async (req, res) => {
    try {
        const { from, to, averageTime, description } = req.body;

        // Check if category already exists for this agency
        const existingCategory = await DestinationCategory.findOne({
            from,
            to,
            agencyId: req.user.id
        });

        if (existingCategory) {
            return res.status(400).json({
                error: 'Destination category already exists'
            });
        }

        const category = new DestinationCategory({
            from,
            to,
            averageTime,
            description,
            agencyId: req.user.id
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await DestinationCategory.find({
            agencyId: req.user.id,
            isActive: true
        }).sort({ from: 1, to: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { from, to, averageTime, description } = req.body;

        const category = await DestinationCategory.findOneAndUpdate(
            { _id: id, agencyId: req.user.id },
            { from, to, averageTime, description },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting isActive to false
        const category = await DestinationCategory.findOneAndUpdate(
            { _id: id, agencyId: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};