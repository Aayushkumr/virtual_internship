const MentorshipRequest = require('../models/MentorshipRequest.model');

// For POST /api/requests (sendRequest) - from your routes file
exports.sendRequest = async (req, res, next) => {
    const menteeId = req.user.id; // Logged-in user is the mentee
    const { receiverId, message } = req.body; // receiverId is the mentor_id

    if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID (mentorId) is required." });
    }
    const mentorId = parseInt(receiverId, 10);

    console.log(`[sendRequest CONTROLLER] Attempting to create request. Mentee ID: ${menteeId}, Mentor ID: ${mentorId}, Message: "${message}"`); // <<< ADD THIS

    try {
        const newRequest = await MentorshipRequest.create(menteeId, mentorId, message);
        res.status(201).json({ message: 'Mentorship request sent successfully.', request: newRequest });
    } catch (error) {
        // Model's create method already throws errors with statusCodes (400, 409, 404)
        next(error);
    }
};

// For GET /api/requests
exports.getRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requests = await MentorshipRequest.findByUserId(userId);
        // The model already joins user/profile info, so requests should be detailed enough
        res.status(200).json({ requests }); // Ensure frontend service expects { requests: [...] }
    } catch (error) {
        next(error);
    }
};

// For PATCH /api/requests/:requestId
exports.updateRequestStatus = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // e.g., 'accepted', 'declined', 'cancelled'
        const userIdUpdating = req.user.id;

        if (!status) {
            return res.status(400).json({ message: "Status is required." });
        }

        const updatedRequest = await MentorshipRequest.updateStatus(parseInt(requestId, 10), status, userIdUpdating);
        res.status(200).json({ message: `Request status updated to ${status}.`, request: updatedRequest });
    } catch (error) {
        // Model's updateStatus method throws errors with statusCodes (400, 403, 404)
        next(error);
    }
};