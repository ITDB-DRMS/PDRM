import ProfileMapping from '../models/ProfileMapping.js';

// @desc    Get all mappings
// @route   GET /api/profile-mappings
export const getProfileMappings = async (req, res) => {
    try {
        const mappings = await ProfileMapping.find({ isActive: true })
            .populate('createdBy', 'fullname');
        res.json(mappings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get mapping by source
// @route   GET /api/profile-mappings/source/:sourceId
export const getMappingBySource = async (req, res) => {
    try {
        const mapping = await ProfileMapping.findOne({ 
            sourceId: req.params.sourceId, 
            isActive: true 
        }).sort({ version: -1 });
        
        if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
        res.json(mapping);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new mapping
// @route   POST /api/profile-mappings
export const createProfileMapping = async (req, res) => {
    try {
        const mapping = new ProfileMapping({
            ...req.body,
            createdBy: req.user?._id
        });
        const saved = await mapping.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update mapping
// @route   PUT /api/profile-mappings/:id
export const updateProfileMapping = async (req, res) => {
    try {
        const mapping = await ProfileMapping.findById(req.params.id);
        if (!mapping) return res.status(404).json({ message: 'Mapping not found' });

        Object.assign(mapping, req.body);
        const updated = await mapping.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete mapping (soft delete)
// @route   DELETE /api/profile-mappings/:id
export const deleteProfileMapping = async (req, res) => {
    try {
        const mapping = await ProfileMapping.findById(req.params.id);
        if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
        
        mapping.isActive = false;
        await mapping.save();
        res.json({ message: 'Mapping deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
