const db = require('../config/db');

const Profile = {};

// Helper to convert array to comma-separated string for DB
const arrayToDbString = (arr) => (arr && arr.length > 0 ? arr.join(',') : null);
// Helper to convert comma-separated string from DB to array
const dbStringToArray = (str) => (str ? str.split(',') : []);

Profile.create = async (userId, profileData) => {
  const {
    role, // 'mentor' or 'mentee'
    firstName,
    lastName,
    headline,
    bio,
    skills, // array
    interests, // array
    linkedinUrl,
    githubUrl,
    profilePictureUrl,
    availability,
  } = profileData;

  const skillsDb = arrayToDbString(skills);
  const interestsDb = arrayToDbString(interests);

  try {
    const { rows } = await db.query(
      `INSERT INTO "Profiles" (user_id, role, first_name, last_name, headline, bio, skills, interests, linkedin_url, github_url, profile_picture_url, availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        role,
        firstName,
        lastName,
        headline,
        bio,
        skillsDb,
        interestsDb,
        linkedinUrl,
        githubUrl,
        profilePictureUrl,
        availability,
      ]
    );
    const profile = rows[0];
    if (profile) {
      profile.skills = dbStringToArray(profile.skills);
      profile.interests = dbStringToArray(profile.interests);
    }
    return profile;
  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
        const fkError = new Error('User not found for creating profile.');
        fkError.statusCode = 404;
        throw fkError;
    }
    if (error.code === '23505') { // Unique constraint violation (e.g. user_id)
        const uniqueError = new Error('Profile already exists for this user.');
        uniqueError.statusCode = 409;
        throw uniqueError;
    }
    throw error;
  }
};

Profile.findByUserId = async (userId) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.email, u.role AS user_role
       FROM "Profiles" p
       JOIN "Users" u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );
    const profile = rows[0];
    if (profile) {
      profile.skills = dbStringToArray(profile.skills);
      profile.interests = dbStringToArray(profile.interests);
      if (!profile.role && profile.user_role) { // If Profiles table doesn't have role, or it's null, use user_role
        profile.role = profile.user_role;
     }
    }
    return profile;
  } catch (error) {
    throw error;
  }
};

Profile.updateByUserId = async (userId, profileData) => {
  const {
    role,
    firstName,
    lastName,
    headline,
    bio,
    skills, // array
    interests, // array
    linkedinUrl,
    githubUrl,
    profilePictureUrl,
    availability,
  } = profileData;

  const skillsDb = arrayToDbString(skills);
  const interestsDb = arrayToDbString(interests);

  // Dynamically build the update query based on provided fields
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (role !== undefined) { fields.push(`role = $${paramCount++}`); values.push(role); }
  if (firstName !== undefined) { fields.push(`first_name = $${paramCount++}`); values.push(firstName); }
  if (lastName !== undefined) { fields.push(`last_name = $${paramCount++}`); values.push(lastName); }
  if (headline !== undefined) { fields.push(`headline = $${paramCount++}`); values.push(headline); }
  if (bio !== undefined) { fields.push(`bio = $${paramCount++}`); values.push(bio); }
  if (skills !== undefined) { fields.push(`skills = $${paramCount++}`); values.push(skillsDb); }
  if (interests !== undefined) { fields.push(`interests = $${paramCount++}`); values.push(interestsDb); }
  if (linkedinUrl !== undefined) { fields.push(`linkedin_url = $${paramCount++}`); values.push(linkedinUrl); }
  if (githubUrl !== undefined) { fields.push(`github_url = $${paramCount++}`); values.push(githubUrl); }
  if (profilePictureUrl !== undefined) { fields.push(`profile_picture_url = $${paramCount++}`); values.push(profilePictureUrl); }
  if (availability !== undefined) { fields.push(`availability = $${paramCount++}`); values.push(availability); }

  if (fields.length === 0) {
    // Nothing to update, return existing profile or handle as an error/noop
    return Profile.findByUserId(userId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`); // Ensure updated_at is set by the trigger or manually

  const queryText = `UPDATE "Profiles" SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;
  values.push(userId);

  try {
    const { rows } = await db.query(queryText, values);
    const profile = rows[0];
    if (profile) {
      profile.skills = dbStringToArray(profile.skills);
      profile.interests = dbStringToArray(profile.interests);
    }
    return profile;
  } catch (error) {
    throw error;
  }
};

Profile.deleteByUserId = async (userId) => {
  try {
    const { rowCount } = await db.query('DELETE FROM "Profiles" WHERE user_id = $1', [userId]);
    return rowCount > 0; // Returns true if a row was deleted, false otherwise
  } catch (error) {
    throw error;
  }
};

Profile.findAll = async (filters = {}) => {
  const { role, skills, interests, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.id, p.user_id, p.role, p.first_name, p.last_name, p.headline, p.bio, p.skills, p.interests, 
           p.linkedin_url, p.github_url, p.profile_picture_url, p.availability,
           u.email
    FROM "Profiles" p
    JOIN "Users" u ON p.user_id = u.id
  `;
  const whereClauses = [];
  const queryParams = [];

  if (role) {
    queryParams.push(role);
    whereClauses.push(`p.role = $${queryParams.length}`);
  }

  if (skills && skills.length > 0) {
    skills.forEach(skill => {
      queryParams.push(`%${skill}%`); // Using LIKE for simplicity
      whereClauses.push(`p.skills ILIKE $${queryParams.length}`);
    });
    // Note: Using LIKE for skills/interests has limitations (e.g., 'react' in 'proreact').
    // For more robust filtering, consider PostgreSQL arrays or full-text search.
  }

  if (interests && interests.length > 0) {
    interests.forEach(interest => {
      queryParams.push(`%${interest}%`);
      whereClauses.push(`p.interests ILIKE $${queryParams.length}`);
    });
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  query += ` ORDER BY p.updated_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);

  // Count total query for pagination
  let countQuery = `SELECT COUNT(*) FROM "Profiles" p`;
  if (whereClauses.length > 0) {
    // Need to adjust param numbers for count query if reusing whereClauses
    // For simplicity, re-create params for count or use a subquery if complex
    let countWhereClauses = [];
    let countQueryParams = [];
    if (role) { countQueryParams.push(role); countWhereClauses.push(`p.role = $${countQueryParams.length}`);}
    if (skills && skills.length > 0) { skills.forEach(skill => { countQueryParams.push(`%${skill}%`); countWhereClauses.push(`p.skills ILIKE $${countQueryParams.length}`); });}
    if (interests && interests.length > 0) { interests.forEach(interest => { countQueryParams.push(`%${interest}%`); countWhereClauses.push(`p.interests ILIKE $${countQueryParams.length}`); });}
    if (countWhereClauses.length > 0) countQuery += ` WHERE ${countWhereClauses.join(' AND ')}`;
    
    const totalResult = await db.query(countQuery, countQueryParams);
    const totalProfiles = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalProfiles / limit);

    const { rows } = await db.query(query, queryParams);
    const profiles = rows.map(profile => ({
      ...profile,
      skills: dbStringToArray(profile.skills),
      interests: dbStringToArray(profile.interests),
    }));

    return {
      profiles,
      currentPage: page,
      totalPages,
      totalProfiles,
    };

  } else { // No filters, simpler count
    const totalResult = await db.query(countQuery); // No params needed for count
    const totalProfiles = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalProfiles / limit);

    const { rows } = await db.query(query, queryParams);
    const profiles = rows.map(profile => ({
      ...profile,
      skills: dbStringToArray(profile.skills),
      interests: dbStringToArray(profile.interests),
    }));
    
    return {
      profiles,
      currentPage: page,
      totalPages,
      totalProfiles,
    };
  }
};

module.exports = Profile;
