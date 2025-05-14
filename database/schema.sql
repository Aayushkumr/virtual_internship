DROP TABLE IF EXISTS "MentorshipRequests" CASCADE;
DROP TABLE IF EXISTS "Profiles" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

-- Users Table: Stores basic authentication information.
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'mentee' CHECK (role IN ('mentee', 'mentor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table: Stores detailed user information.
CREATE TABLE "Profiles" (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    headline VARCHAR(255),
    role VARCHAR(50),
    bio TEXT,
    skills TEXT,
    interests TEXT,
    is_mentor BOOLEAN DEFAULT FALSE,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    profile_picture_url VARCHAR(255),
    availability VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- MentorshipRequests Table: Tracks requests from mentees to mentors.
CREATE TABLE "MentorshipRequests" (
    id SERIAL PRIMARY KEY,
    mentee_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    mentor_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
    CONSTRAINT no_self_request CHECK (mentee_id <> mentor_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON "Profiles"(user_id);
CREATE INDEX idx_mentorshiprequests_mentee_id ON "MentorshipRequests"(mentee_id);
CREATE INDEX idx_mentorshiprequests_mentor_id ON "MentorshipRequests"(mentor_id);

-- Trigger function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for Users table
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON "Users"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Triggers for Profiles table
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON "Profiles"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Triggers for MentorshipRequests table
CREATE TRIGGER set_timestamp_mentorship_requests
BEFORE UPDATE ON "MentorshipRequests"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();