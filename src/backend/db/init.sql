-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS demand_responses;
DROP TABLE IF EXISTS demands;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS knowledge_base_entries;
DROP TABLE IF EXISTS external_links;
DROP TABLE IF EXISTS api_interfaces;
DROP TABLE IF EXISTS users;

-- Users Table: Stores all user types (admin, supplier, user, creator)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'user', 'creator')),
    avatar VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blacklisted')),
    rating INT NOT NULL DEFAULT 3 CHECK (rating >= 1 AND rating <= 5)
);

-- Knowledge Base Table: Core data source for the AI
CREATE TABLE knowledge_base_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    tags TEXT[],
    description TEXT NOT NULL,
    price VARCHAR(255),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Suppliers Table: Stores supplier-specific information
CREATE TABLE suppliers (
    id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    logo_url VARCHAR(255),
    introduction TEXT,
    region VARCHAR(255),
    address TEXT,
    establishment_date DATE,
    registered_capital VARCHAR(255),
    credit_code VARCHAR(255) UNIQUE,
    business_license_url VARCHAR(255),
    contact_person VARCHAR(255),
    contact_title VARCHAR(255),
    contact_mobile VARCHAR(255),
    contact_phone VARCHAR(255),
    contact_email VARCHAR(255),
    contact_wecom VARCHAR(255),
    custom_fields JSONB, -- For flexible custom fields
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products/Services Table: Linked to suppliers
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price VARCHAR(100),
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    purchase_url VARCHAR(255),
    media_panoramic VARCHAR(255),
    media_top VARCHAR(255),
    media_bottom VARCHAR(255),
    media_left VARCHAR(255),
    media_right VARCHAR(255),
    media_front VARCHAR(255),
    media_back VARCHAR(255),
    custom_fields JSONB, -- For flexible custom fields
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Demands Table: For user-posted requests
CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT '开放中' CHECK (status IN ('开放中', '洽谈中', '已完成')),
    posted_date TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demand Responses Table: Linking suppliers/creators to demands
CREATE TABLE demand_responses (
    id SERIAL PRIMARY KEY,
    demand_id INT NOT NULL,
    supplier_id VARCHAR(255) NOT NULL, -- Can be a supplier or a creator
    response_date TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (demand_id, supplier_id) -- A supplier can only respond once to a demand
);


-- Public Resources: External Links
CREATE TABLE external_links (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Public Resources: API Interfaces
CREATE TABLE api_interfaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    auth_method VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    docs_url VARCHAR(255)
);

-- Insert Mock Data
INSERT INTO users (id, name, email, role, avatar, description, status, rating) VALUES
('1', '李明 (管理员)', 'admin@example.com', 'admin', 'https://placehold.co/100x100.png', '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。', 'active', 5),
('2', '创新科技 (供应商)', 'supplier@example.com', 'supplier', 'https://placehold.co/100x100.png', '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。', 'active', 4),
('3', '张伟 (普通用户)', 'user@example.com', 'user', 'https://placehold.co/100x100.png', '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。', 'active', 3),
('4', '王芳 (创意者)', 'creator@example.com', 'creator', 'https://placehold.co/100x100.png', '可以访问创意工坊，利用AI工具进行内容创作和设计。', 'active', 5),
('5', '问题用户', 'suspended@example.com', 'user', 'https://placehold.co/100x100.png', '这是一个被暂停的用户账户示例。', 'suspended', 1),
('6', 'Alex Johnson', 'alex.j@example.com', 'creator', 'https://placehold.co/100x100.png', '专注于赛博朋克和未来主义风格的3D角色艺术家。', 'active', 5),
('7', 'Emily Chen', 'emily.c@example.com', 'creator', 'https://placehold.co/100x100.png', '擅长有机建模和自然场景渲染，追求照片级真实感。', 'active', 4),
('8', 'David Lee', 'david.l@example.com', 'creator', 'https://placehold.co/100x100.png', '硬表面建模专家，对科幻载具和机械设计充满热情。', 'active', 4),
('9', 'Sophia White', 'sophia.w@example.com', 'creator', 'https://placehold.co/100x100.png', '可爱风格设计师，主要创作潮流玩具和手办原型。', 'active', 5);

INSERT INTO knowledge_base_entries (name, category, tags, description, price) VALUES
('赛博朋克飞行摩托', '载具', '{"未来", "科幻", "交通工具"}', '一辆融合了复古与未来主义设计的单人飞行摩托，配备电磁悬浮引擎和霓虹灯光系统。', '¥15,999.00'),
('全息城市景观生成器', '软件', '{"3D", "城市", "生成艺术"}', '一个可以根据参数实时生成复杂、动态全息城市模型的软件，适用于电影和游戏开发。', '¥8,999.00'),
('智能盆栽 “绿语”', '智能家居', '{"植物", "AI", "装饰"}', '内置AI芯片，能够监测植物状态并通过屏幕显示情感和需求的智能盆栽。', '¥799.00'),
('模块化机械臂套件', 'DIY套件', '{"机器人", "教育", "编程"}', '一个允许用户自由组装和编程的桌面级机械臂套件，支持Python和C++控制。', '¥3,499.00');

INSERT INTO suppliers (id, full_name, short_name, region, address, contact_person, contact_email, custom_fields) VALUES
('2', '创新科技（深圳）有限公司', '创新科技', '广东省深圳市', '南山区科技园1号楼', '王经理', 'contact@innovatech.com', '[{"fieldName": "官方网站", "fieldValue": "https://innovatech.example.com"}]');

INSERT INTO products (supplier_id, name, category, price, description, purchase_url, media_panoramic) VALUES
('2', '智能家庭中枢 Pro', '智能家居', '¥1,299.00', '连接和管理您家中所有智能设备，支持语音控制和自动化场景。', 'https://example.com/product/101', 'https://placehold.co/600x400.png');

INSERT INTO demands (user_id, title, description, budget, category, tags, status) VALUES
('3', '寻找一款适合送给科幻迷的生日礼物', '我的朋友是个铁杆科幻迷，喜欢《银翼杀手》和《攻壳机动队》。我想找一个有设计感、充满未来主义风格的礼物，预算在2000元以内。', '¥2,000以内', '礼品', '{"科幻", "赛博朋克", "生日礼物"}', '开放中'),
('3', '需要定制一个公司Logo的3D动画', '我们需要一个15秒的3D Logo开场动画，用于我们的产品发布会。风格要求简洁、现代，有科技感。', '¥5,000-¥10,000', '设计服务', '{"3D动画", "Logo设计", "品牌"}', '洽谈中'),
('1', '采购一批办公室用智能盆栽', '为新办公室采购50盆智能盆栽，要求能自动浇水并有状态显示功能，以提升办公环境。', '面议', '办公用品', '{"智能家居", "绿植", "办公室"}', '已完成');

INSERT INTO external_links (name, url, description, category) VALUES
('ArtStation', 'https://www.artstation.com', '全球领先的CG艺术家社区和作品展示平台。', '设计灵感'),
('Behance', 'https://www.behance.net', 'Adobe旗下的创意作品分享平台，涵盖领域广泛。', '设计灵感'),
('GitHub', 'https://github.com', '全球最大的代码托管和开源协作平台。', '技术资源');

INSERT INTO api_interfaces (name, endpoint, auth_method, status, docs_url) VALUES
('TripoSR API', 'https://api.tripo3d.ai/v2/high-speed/imagine-to-3d', 'API Key', 'active', 'https://docs.tripo3d.ai/'),
('Stable Diffusion API', 'https://api.stablediffusion.com/v1/generate', 'OAuth 2.0', 'active', 'https://docs.stablediffusion.com/');
