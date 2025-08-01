-- Drop tables if they exist to ensure a clean slate on recreation
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS knowledge_base_entries;

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'user', 'creator')),
    avatar VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blacklisted')),
    rating INT NOT NULL DEFAULT 3 CHECK (rating >= 1 AND rating <= 5)
);

-- Insert Mock Users
INSERT INTO users (id, name, email, role, avatar, description, status, rating) VALUES
(1, '李明 (管理员)', 'admin@example.com', 'admin', 'https://placehold.co/100x100.png', '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。', 'active', 5),
(2, '创新科技 (供应商)', 'supplier@example.com', 'supplier', 'https://placehold.co/100x100.png', '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。', 'active', 4),
(3, '张伟 (普通用户)', 'user@example.com', 'user', 'https://placehold.co/100x100.png', '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。', 'active', 3),
(4, '王芳 (创意者)', 'creator@example.com', 'creator', 'https://placehold.co/100x100.png', '可以访问创意工坊，利用AI工具进行内容创作和设计。', 'active', 5),
(5, '问题用户', 'suspended@example.com', 'user', 'https://placehold.co/100x100.png', '这是一个被暂停的用户账户示例。', 'suspended', 1);

-- Create Knowledge Base Table
CREATE TABLE knowledge_base_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    tags TEXT[],
    description TEXT NOT NULL,
    price VARCHAR(100),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Mock Knowledge Base Entries
INSERT INTO knowledge_base_entries (id, name, category, tags, description, price, last_updated) VALUES
(1, '智能家庭中心 Pro', '消费电子产品', '{"智能家居", "语音助手", "Zigbee"}', '一款集成了语音助手、智能家居控制和家庭娱乐功能的中心设备。支持 Zigbee、Wi-Fi 和蓝牙连接。', '¥1299', '2024-07-28'),
(2, '静音大师洗衣机', '家用电器', '{"节能", "直驱变频", "10公斤"}', '采用直驱变频电机，实现超静音洗涤。拥有10公斤大容量和多种智能洗涤程序。', '¥3499', '2024-07-27'),
(3, '云端数据备份服务', '软件服务', '{"SaaS", "数据安全", "多设备同步"}', '提供安全可靠的云端数据备份方案，支持多设备同步和文件版本历史记录。', '¥99/年', '2024-07-26'),
(4, '个性化营养咨询', '健康服务', '{"在线咨询", "营养师", "定制方案"}', '由专业营养师提供在线一对一咨询，根据您的身体状况和饮食习惯定制个性化营养方案。', '¥499/次', '2024-07-25'),
(5, '便携式咖啡机', '厨房小电', '{"户外", "旅行", "手动"}', '小巧便携，适合户外旅行使用，手动操作，无需电源。', '¥299', '2024-07-24');

-- Sequence adjustments to match mock data IDs
-- This is necessary because we are manually inserting IDs
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('knowledge_base_entries_id_seq', (SELECT MAX(id) FROM knowledge_base_entries));
