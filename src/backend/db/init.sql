-- Drop existing tables to start fresh
DROP TABLE IF EXISTS demand_responses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS demands;
DROP TABLE IF EXISTS knowledge_base_entries;
DROP TABLE IF EXISTS users;

-- Users Table
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

-- Knowledge Base Entries Table
CREATE TABLE knowledge_base_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    tags TEXT[],
    description TEXT,
    price VARCHAR(100),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    -- Basic Info
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    logo_url VARCHAR(255),
    introduction TEXT,
    region VARCHAR(255),
    address VARCHAR(255),
    establishment_date DATE,
    registered_capital VARCHAR(100),
    credit_code VARCHAR(100),
    business_license_url VARCHAR(255),
    -- Contact Info
    contact_person VARCHAR(100),
    contact_title VARCHAR(100),
    contact_mobile VARCHAR(50),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_wecom VARCHAR(100),
    -- Custom fields stored as JSON
    custom_fields JSONB
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    sku VARCHAR(100),
    description TEXT,
    price VARCHAR(100),
    purchase_url VARCHAR(255),
    -- Media files
    media_panoramic VARCHAR(255),
    media_top VARCHAR(255),
    media_bottom VARCHAR(255),
    media_left VARCHAR(255),
    media_right VARCHAR(255),
    media_front VARCHAR(255),
    media_back VARCHAR(255),
    -- Custom fields
    custom_fields JSONB
);

-- Demands Table
CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100),
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT '开放中' CHECK (status IN ('开放中', '洽谈中', '已完成', '已关闭')),
    posted_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demand Responses Table
CREATE TABLE demand_responses (
    id SERIAL PRIMARY KEY,
    demand_id INTEGER REFERENCES demands(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    -- could also be creator_id (user_id with creator role) in a more complex setup
    response_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    UNIQUE (demand_id, supplier_id) -- A supplier can only respond once to a demand
);


-- --- SEED DATA ---

-- Seed Users
INSERT INTO users (id, name, email, role, avatar, description, status, rating) VALUES
(1, '李明 (管理员)', 'admin@example.com', 'admin', 'https://placehold.co/100x100.png', '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。', 'active', 5),
(2, '创新科技 (供应商)', 'supplier@example.com', 'supplier', 'https://placehold.co/100x100.png', '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。', 'active', 4),
(3, '张伟 (普通用户)', 'user@example.com', 'user', 'https://placehold.co/100x100.png', '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。', 'active', 3),
(4, '王芳 (创意者)', 'creator@example.com', 'creator', 'https://placehold.co/100x100.png', '可以访问创意工坊，利用AI工具进行内容创作和设计。', 'active', 5),
(5, '问题用户', 'suspended@example.com', 'user', 'https://placehold.co/100x100.png', '这是一个被暂停的用户账户示例。', 'suspended', 1);

-- Seed Knowledge Base
INSERT INTO knowledge_base_entries (name, category, tags, description, price) VALUES
('智能家庭中心 Pro', '消费电子产品', '{"智能家居", "语音助手", "Zigbee"}', '一款集成了语音助手、智能家居控制和家庭娱乐功能的中心设备。支持 Zigbee、Wi-Fi 和蓝牙连接。', '¥1299'),
('静音大师洗衣机', '家用电器', '{"节能", "直驱变频", "10公斤"}', '采用直驱变频电机，实现超静音洗涤。拥有10公斤大容量和多种智能洗涤程序。', '¥3499'),
('云端数据备份服务', '软件服务', '{"SaaS", "数据安全", "多设备同步"}', '提供安全可靠的云端数据备份方案，支持多设备同步和文件版本历史记录。', '¥99/年');

-- Seed Suppliers and Products
INSERT INTO suppliers (id, full_name, short_name, contact_person, custom_fields) VALUES
(1, '创新科技（深圳）有限公司', '创新科技', '王经理', '{"website": "https://example-tech.com"}');

INSERT INTO products (supplier_id, name, category, price, purchase_url, media_panoramic) VALUES
(1, 'CyberVision AR眼镜', '消费电子产品', '¥4999', 'https://example.com/product/cyber-vision', 'https://placehold.co/600x400.png');

-- Seed Demands
INSERT INTO demands (user_id, title, description, budget, category, tags, status) VALUES
(3, '寻找一款适合送给女友的生日礼物', '希望找到一款有设计感、不那么大众化的生日礼物送给女友，她喜欢艺术和手工艺品。预算在500到1000元之间。', '¥500 - ¥1000', '礼品定制', '{"生日礼物", "设计感", "女性"}', '开放中'),
(1, '需要为新公司的LOGO设计一个3D动画', '我们是一家科技初创公司，logo已经有了，需要一位创意者为其制作一个5-10秒的赛博朋克风格3D开场动画。', '¥3000 - ¥5000', '3D设计', '{"Logo动画", "赛博朋克", "创意者"}', '开放中'),
(2, '批量采购一批智能办公插座', '公司装修，需要采购约200个智能插座，要求支持远程控制和电量统计，希望有实力的供应商报价。', '¥10000+', '智能硬件', '{"智能家居", "企业采购", "供应商"}', '洽谈中');
