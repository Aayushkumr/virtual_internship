-- Clear existing data (optional, but good for repeatable seeding)
-- Be careful with these commands in a production environment!
-- DELETE FROM Mentorship_Requests;
-- DELETE FROM Profiles;
-- DELETE FROM Users;
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE mentorship_requests_id_seq RESTART WITH 1;

-- Sample Users
-- Password for all users is 'password123'
-- Bcrypt hash for 'password123' (example: $2a$10$CwTycUXWue0Thq9StjUM0uU/1uC4qXoRMA1vOfyLp0D3z0bACiS7O - you should generate your own)
-- For simplicity, we'll use a common hash. In a real app, each user would have a unique salt.
INSERT INTO Users (id, email, password_hash) VALUES
(1, 'mentor1@example.com', '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy'), -- password123
(2, 'mentee1@example.com', '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy'), -- password123
(3, 'mentor2@example.com', '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy'), -- password123
(4, 'mentee2@example.com', '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy'), -- password123
(5, 'mentee3@example.com', '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy'); -- password123

-- Sample Profiles
INSERT INTO Profiles (user_id, role, bio, skills, interests) VALUES
(1, 'mentor', 'Experienced software engineer specializing in full-stack web development. Passionate about helping others grow their careers.', '{JavaScript,Node.js,React,PostgreSQL}', '{Web Development,Startups,Mentorship,Open Source}'),
(2, 'mentee', 'Aspiring frontend developer eager to learn React and improve UI/UX skills. Currently working on personal projects.', '{HTML,CSS,JavaScript}', '{Frontend Development,UI/UX Design,Photography}'),
(3, 'mentor', 'Data scientist with a background in machine learning and Python. Enjoys tackling complex problems and sharing knowledge.', '{Python,Django,Machine Learning,Pandas,NumPy}', '{AI,Data Science,Big Data,Teaching}'),
(4, 'mentee', 'Recent computer science graduate interested in backend systems and cloud technologies. Looking for guidance on career paths.', '{Java,Spring Boot,SQL}', '{Backend Development,DevOps,Cloud Computing,Cybersecurity}'),
(5, 'mentee', 'Product manager transitioning into a more technical role. Wants to understand data analysis and SQL better.', '{SQL,Data Analysis,Agile}', '{Databases,Business Intelligence,Product Management}');

-- Sample Mentorship Requests
INSERT INTO Mentorship_Requests (sender_id, receiver_id, status) VALUES
(2, 1, 'pending'),    -- Mentee1 (user_id 2) sends request to Mentor1 (user_id 1)
(4, 1, 'accepted'),   -- Mentee2 (user_id 4) sends request to Mentor1 (user_id 1)
(5, 3, 'declined'),   -- Mentee3 (user_id 5) sends request to Mentor2 (user_id 3)
(2, 3, 'pending');    -- Mentee1 (user_id 2) also sends request to Mentor2 (user_id 3)

-- Note: If your users_id_seq, profiles_id_seq, or mentorship_requests_id_seq are not already at a value higher than the max ID inserted, 
-- you might need to update them. For example, after inserting user with ID 5:
-- SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) + 1 FROM users), 1), false);
-- SELECT setval(pg_get_serial_sequence('profiles', 'id'), COALESCE((SELECT MAX(id) + 1 FROM profiles), 1), false);
-- SELECT setval(pg_get_serial_sequence('mentorship_requests', 'id'), COALESCE((SELECT MAX(id) + 1 FROM mentorship_requests), 1), false);
-- However, since we are explicitly setting IDs and assuming a clean slate, this might not be immediately necessary if you run the commented out DELETE and RESTART commands first.
