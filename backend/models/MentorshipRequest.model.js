const db = require('../config/db');

const MentorshipRequest = {};

MentorshipRequest.create = async (menteeId, mentorId, message) => {
  if (menteeId === mentorId) {
    const selfRequestError = new Error('You cannot send a mentorship request to yourself.');
    selfRequestError.statusCode = 400;
    throw selfRequestError;
  }
  try {
    // THIS IS THE CONFLICT CHECK
    const existingRequest = await db.query(
      'SELECT id FROM "MentorshipRequests" WHERE mentee_id = $1 AND mentor_id = $2 AND status IN (\'pending\', \'accepted\')',
      [menteeId, mentorId]
    );
    if (existingRequest.rows.length > 0) {
      const dupError = new Error('A mentorship request to this user is already pending or has been accepted.');
      dupError.statusCode = 409;
      throw dupError; // This is the source of your 409
    }
    const { rows } = await db.query(
      'INSERT INTO "MentorshipRequests" (mentee_id, mentor_id, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [menteeId, mentorId, message, 'pending']
    );
    return rows[0];
  } catch (error) {
    if (error.code === '23503') {
      const fkError = new Error('Invalid mentee or mentor ID. User not found.');
      fkError.statusCode = 404;
      throw fkError;
    }
    throw error;
  }
};

MentorshipRequest.findByUserId = async (userId) => {
  try {
    const { rows } = await db.query(
      `SELECT
        mr.id, mr.status, mr.message, mr.requested_at, mr.responded_at,
        mentee_user.id AS mentee_id,
        mentee_user.email AS mentee_email,
        mentee_profile.first_name AS mentee_first_name,
        mentee_profile.last_name AS mentee_last_name,
        mentor_user.id AS mentor_id,
        mentor_user.email AS mentor_email,
        mentor_profile.first_name AS mentor_first_name,
        mentor_profile.last_name AS mentor_last_name
      FROM "MentorshipRequests" mr
      JOIN "Users" mentee_user ON mr.mentee_id = mentee_user.id
      LEFT JOIN "Profiles" mentee_profile ON mentee_user.id = mentee_profile.user_id
      JOIN "Users" mentor_user ON mr.mentor_id = mentor_user.id
      LEFT JOIN "Profiles" mentor_profile ON mentor_user.id = mentor_profile.user_id
      WHERE mr.mentee_id = $1 OR mr.mentor_id = $1
      ORDER BY mr.requested_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error in MentorshipRequest.findByUserId:', error);
    throw error;
  }
};

MentorshipRequest.findById = async (requestId) => {
  try {
    const { rows } = await db.query(
      `SELECT
        mr.*,
        mentee_user.id AS mentee_user_id,
        mentee_user.email AS mentee_email,
        mentor_user.id AS mentor_user_id,
        mentor_user.email AS mentor_email
      FROM "MentorshipRequests" mr
      JOIN "Users" mentee_user ON mr.mentee_id = mentee_user.id
      JOIN "Users" mentor_user ON mr.mentor_id = mentor_user.id
      WHERE mr.id = $1`,
      [requestId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error in MentorshipRequest.findById:', error);
    throw error;
  }
};

MentorshipRequest.updateStatus = async (requestId, newStatus, userIdUpdating) => {
  try {
    const requestQuery = await db.query('SELECT * FROM "MentorshipRequests" WHERE id = $1', [requestId]);
    if (requestQuery.rows.length === 0) {
      const notFoundError = new Error('Mentorship request not found.');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    const request = requestQuery.rows[0];
    let authorized = false;

    // Authorization logic:
    // Mentee can cancel their own pending request.
    if (newStatus === 'cancelled' && request.mentee_id === userIdUpdating && request.status === 'pending') {
        authorized = true;
    // Mentor can accept or decline a pending request sent to them.
    } else if ((newStatus === 'accepted' || newStatus === 'declined') && request.mentor_id === userIdUpdating && request.status === 'pending') {
        authorized = true;
    }

    if (!authorized) {
         const forbiddenError = new Error('You are not authorized to update this request to the new status or the request is not in a state that allows this update.');
         forbiddenError.statusCode = 403;
         throw forbiddenError;
    }

    const validStatuses = ['accepted', 'declined', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        const invalidStatusError = new Error('Invalid status provided.');
        invalidStatusError.statusCode = 400;
        throw invalidStatusError;
    }

    // Set responded_at only when a mentor accepts or declines.
    // A mentee cancelling their own request doesn't count as a "response" from the mentor.
    const respondedAtUpdateField = (newStatus === 'accepted' || newStatus === 'declined') ? ', responded_at = CURRENT_TIMESTAMP' : '';

    const { rows } = await db.query(
      `UPDATE "MentorshipRequests" 
       SET status = $1 ${respondedAtUpdateField}
       WHERE id = $2 RETURNING *`,
      [newStatus, requestId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error in MentorshipRequest.updateStatus:', error);
    // Preserve custom status codes if already set
    if (!error.statusCode && error.message) {
        const dbError = new Error(`Database error updating request: ${error.message}`);
        dbError.statusCode = 500;
        throw dbError;
    }
    throw error;
  }
};

module.exports = MentorshipRequest;