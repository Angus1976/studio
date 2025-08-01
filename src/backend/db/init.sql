-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS demand_responses;
DROP TABLE IF EXISTS demands;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS knowledge_base_entries;
DROP TABLE IF EXISTS external_links;
DROP TABLE IF EXISTS api_interfaces;


-- Users Table: Stores information about all users, including their roles.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'user', 'creator')),
    avatar VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'blacklisted')),
    rating INT DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table: Stores detailed information about each supplier. Linked to the users table.
CREATE TABLE suppliers (
    id INT PRIMARY KEY, -- This ID should match the user's ID
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    logo_url VARCHAR(255),
    introduction TEXT,
    region VARCHAR(100),
    address VARCHAR(255),
    establishment_date DATE,
    registered_capital VARCHAR(100),
    credit_code VARCHAR(100),
    business_license_url VARCHAR(255),
    contact_person VARCHAR(100),
    contact_title VARCHAR(100),
    contact_mobile VARCHAR(50),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_wecom VARCHAR(100),
    custom_fields JSONB, -- For storing dynamic key-value pairs
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products Table: Stores information about products or services offered by suppliers.
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    price VARCHAR(100),
    purchase_url VARCHAR(255),
    media_panoramic VARCHAR(255),
    media_top VARCHAR(255),
    media_bottom VARCHAR(255),
    media_left VARCHAR(255),
    media_right VARCHAR(255),
    media_front VARCHAR(255),
    media_back VARCHAR(255),
    custom_fields JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Knowledge Base Table: Core data source for AI matching and search.
CREATE TABLE knowledge_base_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    description TEXT NOT NULL,
    price VARCHAR(100),
    panoramic_image VARCHAR(255),
    purchase_url VARCHAR(255),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Demands Table: Centralized pool for user-posted demands.
CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100),
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) NOT NULL CHECK (status IN ('开放中', '洽谈中', '已完成', '已关闭')),
    posted_date TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demand Responses Table: Tracks which supplier/creator has responded to which demand.
CREATE TABLE demand_responses (
    id SERIAL PRIMARY KEY,
    demand_id INT NOT NULL,
    supplier_id INT NOT NULL, -- User ID of the supplier/creator
    response_date TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (demand_id, supplier_id) -- A supplier can only respond once to the same demand
);

-- External Links Table
CREATE TABLE external_links (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- API Interfaces Table
CREATE TABLE api_interfaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    auth_method VARCHAR(50),
    status VARCHAR(50) CHECK (status IN ('active', 'inactive')),
    docs_url VARCHAR(255),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);


-- Insert mock data

-- Users
INSERT INTO users (id, name, email, role, avatar, description, status, rating) VALUES
(1, '李明 (管理员)', 'admin@example.com', 'admin', 'https://placehold.co/100x100.png', '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。', 'active', 5),
(2, '创新科技 (供应商)', 'supplier@example.com', 'supplier', 'https://placehold.co/100x100.png', '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。', 'active', 4),
(3, '张伟 (普通用户)', 'user@example.com', 'user', 'https://placehold.co/100x100.png', '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。', 'active', 3),
(4, '王芳 (创意者)', 'creator@example.com', 'creator', 'https://placehold.co/100x100.png', '可以访问创意工坊，利用AI工具进行内容创作和设计。', 'active', 5),
(5, '问题用户', 'suspended@example.com', 'user', 'https://placehold.co/100x100.png', '这是一个被暂停的用户账户示例。', 'suspended', 1),
(6, 'Alex (设计师)', 'alex@example.com', 'creator', 'https://placehold.co/100x100.png', '专注于未来主义和赛博朋克风格的3D角色设计。', 'active', 5),
(7, 'Emily (设计师)', 'emily@example.com', 'creator', 'https://placehold.co/100x100.png', '擅长有机建模和自然场景的写实渲染。', 'active', 4),
(8, 'David (设计师)', 'david@example.com', 'creator', 'https://placehold.co/100x100.png', '硬表面建模专家，尤其擅长科幻载具和机械设计。', 'active', 4);


-- Supplier Info for "创新科技"
INSERT INTO suppliers (id, full_name, short_name, introduction, region, address, establishment_date, registered_capital, credit_code, contact_person, contact_title, contact_mobile, contact_email) VALUES
(2, '创新科技（深圳）有限公司', '创新科技', '我们是一家专注于研发未来派消费电子产品的公司，致力于将科幻带入现实。', '广东省深圳市', '南山区科技生态园10栋', '2020-01-15', '1000万人民币', '91440300MA5G2F4H1X', '陈经理', '销售总监', '13800138000', 'sales@innovatech.com');

-- Products for "创新科技"
INSERT INTO products (supplier_id, name, category, sku, description, price, purchase_url) VALUES
(2, '时空穿梭手表', '智能穿戴', 'INNO-W-001', '一款结合了复古未来主义设计的智能手表，拥有AR星图功能。', '¥2,999.00', 'http://example.com/purchase/INNO-W-001'),
(2, '反重力盆栽', '智能家居', 'INNO-H-001', '利用磁悬浮技术，让您的植物优雅地漂浮在空中。', '¥899.00', 'http://example.com/purchase/INNO-H-001');


-- Knowledge Base Entries
INSERT INTO knowledge_base_entries (name, category, tags, description, price, panoramic_image, purchase_url) VALUES
('赛博朋克飞行摩托', '交通工具', '{"科幻", "赛博朋克", "载具"}', '一款专为都市夜景设计的单人飞行摩托，采用电能驱动，拥有炫酷的霓虹灯效。', '¥150,000', 'https://placehold.co/600x400.png', 'http://example.com/purchase/cyber-moto'),
('全息个人助理', '智能设备', '{"AI", "全息投影", "生活助手"}', '能够投射出全息影像的个人AI助理，可以进行日程管理、信息查询和智能家居控制。', '¥8,999', 'https://placehold.co/600x400.png', 'http://example.com/purchase/holo-ai'),
('机械变色龙宠物', '仿生机器人', '{"宠物", "机器人", "高科技"}', '一只可以根据环境改变颜色的高仿真机械变色龙，拥有基础的互动能力。', '¥4,500', 'https://placehold.co/600x400.png', 'http://example.com/purchase/mecha-chameleon'),
('星际旅行者背包', '户外装备', '{"旅行", "太空", "探险"}', '设计灵感来源于宇航服，配有太阳能充电板和内置GPS的超大容量背包。', '¥1,299', 'https://placehold.co/600x400.png', 'http://example.com/purchase/space-pack');

-- Demands
INSERT INTO demands (user_id, title, description, budget, category, tags, status) VALUES
(3, '寻找一个特别的生日礼物，送给科幻迷男友', '他非常喜欢《银翼杀手》和《攻壳机动队》，希望礼物能有赛博朋克风格，预算在5000元以内。', '¥5,000以内', '礼品', '{"科幻", "赛博朋克", "生日礼物"}', '开放中'),
(3, '需要定制一个公司吉祥物的3D模型', '我们是一家游戏公司，吉祥物是一只戴着VR眼镜的猫。需要一个高质量的3D模型用于宣传。', '面议', '3D设计', '{"3D建模", "吉祥物", "游戏"}', '开放中'),
(5, '想买一个智能盆栽，可以自动浇水', '我总是忘记给植物浇水，希望有一个智能设备能帮我解决这个问题。', '¥1,000以内', '智能家居', '{"智能家居", "植物", "自动"}', '洽谈中');

-- Demand Responses
INSERT INTO demand_responses (demand_id, supplier_id) VALUES
(3, 2); -- 创新科技 responded to the smart planter demand

-- External Links
INSERT INTO external_links (name, url, description, category) VALUES
('ArtStation', 'https://www.artstation.com/', '全球领先的艺术家展示平台，包含大量游戏、电影、媒体和娱乐领域的艺术作品。', '设计灵感'),
('Behance', 'https://www.behance.net/', 'Adobe旗下的创意作品展示平台，涵盖领域广泛。', '设计灵感'),
('Pinterest', 'https://www.pinterest.com/', '图片分享社交网站，是寻找创意和视觉灵感的好地方。', '设计灵感');

-- API Interfaces
INSERT INTO api_interfaces (name, endpoint, auth_method, status, docs_url) VALUES
('TripoSR API', 'https://api.tripo3d.ai/v2/tripod', 'API Key', 'active', 'https://docs.tripo3d.ai/'),
('DeepL Translate API', 'https://api-free.deepl.com/v2/translate', 'API Key', 'active', 'https://www.deepl.com/docs-api/'),
('OpenWeatherMap API', 'https://api.openweathermap.org/data/2.5/weather', 'API Key', 'inactive', 'https://openweathermap.org/api');
