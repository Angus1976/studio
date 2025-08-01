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

-- Suppliers Table
CREATE TABLE suppliers (
    id INT PRIMARY KEY, -- Corresponds to a user ID
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    logo_url VARCHAR(255),
    introduction TEXT,
    region VARCHAR(255),
    address VARCHAR(255),
    establishment_date DATE,
    registered_capital VARCHAR(100),
    credit_code VARCHAR(100),
    business_license_url VARCHAR(255),
    contact_person VARCHAR(255),
    contact_title VARCHAR(100),
    contact_mobile VARCHAR(50),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_wecom VARCHAR(100),
    custom_fields JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products/Services Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
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
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Knowledge Base Table
CREATE TABLE knowledge_base_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    tags TEXT[],
    description TEXT NOT NULL,
    price VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Demands Table
CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(100),
    category VARCHAR(255),
    tags TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT '开放中' CHECK (status IN ('开放中', '洽谈中', '已完成')),
    posted_date TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demand Responses Table
CREATE TABLE demand_responses (
    id SERIAL PRIMARY KEY,
    demand_id INT NOT NULL,
    supplier_id INT NOT NULL,
    response_date TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(demand_id, supplier_id) -- A supplier can only respond once to a demand
);

-- External Links Table (for Public Resources)
CREATE TABLE external_links (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- API Interfaces Table (for Public Resources)
CREATE TABLE api_interfaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    auth_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    docs_url VARCHAR(255),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);


-- Insert mock data

INSERT INTO users (id, name, email, role, avatar, description, status, rating) VALUES
(1, '李明 (管理员)', 'admin@example.com', 'admin', 'https://placehold.co/100x100.png', '拥有所有权限，可以访问所有页面，包括用户管理和供应商数据整合。', 'active', 5),
(2, '创新科技 (供应商)', 'supplier@example.com', 'supplier', 'https://placehold.co/100x100.png', '可以访问供应商整合页面以上传和管理自己的产品数据，并能使用智能搜索。', 'active', 4),
(3, '张伟 (普通用户)', 'user@example.com', 'user', 'https://placehold.co/100x100.png', '可以使用智能匹配和智能搜索功能来发现最适合自己的产品和服务。', 'active', 3),
(4, '王芳 (创意者)', 'creator@example.com', 'creator', 'https://placehold.co/100x100.png', '可以访问创意工坊，利用AI工具进行内容创作和设计。', 'active', 5),
(5, '问题用户', 'suspended@example.com', 'user', 'https://placehold.co/100x100.png', '这是一个被暂停的用户账户示例。', 'suspended', 1),
(6, 'Emily the Creator', 'emily@example.com', 'creator', 'https://placehold.co/100x100.png', 'Specializes in organic modeling and realistic scenes.', 'active', 5),
(7, 'David the Designer', 'david@example.com', 'creator', 'https://placehold.co/100x100.png', 'Hard-surface modeling expert for sci-fi vehicles.', 'active', 4);


INSERT INTO suppliers (id, full_name, short_name, region, address) VALUES
(2, '创新科技（深圳）有限公司', '创新科技', '广东省深圳市', '南山区科技园');

INSERT INTO knowledge_base_entries (id, name, category, tags, description, price) VALUES
(1, '赛博朋克飞行摩托', '载具', '{"未来", "科幻", "交通工具"}', '一款专为未来城市设计的单人飞行载具，采用反重力引擎，外观极具赛博朋克风格。', '¥15,999.00'),
(2, '魔法森林精灵小屋', '场景', '{"奇幻", "自然", "建筑"}', '带有魔法元素的精灵风格小屋模型，细节丰富，适用于游戏或动画场景。', '¥8,999.00'),
(3, 'Q版宇航员手办', '角色', '{"可爱", "科幻", "玩具"}', '可爱的Q版宇航员模型，适合作为3D打印手办或数字藏品。', '¥1,299.00'),
(4, '智能家庭助理机器人', '消费电子产品', '{"智能家居", "AI", "机器人"}', '集成了最新AI技术的家庭助理，能够控制家电、查询信息，并与用户进行自然语言交互。', '¥3,800.00'),
(5, '高端定制化机械键盘', '电脑外设', '{"客制化", "机械键盘", "DIY"}', '提供从轴体、键帽到外壳的完全定制化服务，打造独一无二的输入体验。', '面议');

INSERT INTO products (supplier_id, name, category, sku, description, price, purchase_url, media_panoramic) VALUES
(2, '智能家庭助理机器人V2', '消费电子产品', 'SKU-ROBOT-002', '最新款智能家庭助理，性能提升50%，拥有更人性化的交互体验。', '¥4,500.00', 'https://example.com/purchase', 'https://placehold.co/600x400.png');


INSERT INTO demands (user_id, title, description, budget, category, tags, status) VALUES
(3, '需要设计一款公司logo', '我们是一家新成立的科技公司，需要一个现代、简洁且富有科技感的logo。', '¥5,000 - ¥8,000', '品牌设计', '{"logo", "视觉识别", "科技感"}', '开放中'),
(3, '寻找一款特别的生日礼物', '想给朋友买一个生日礼物，他是个科幻迷，喜欢赛博朋克风格的东西。', '¥2,000以内', '礼品', '{"生日礼物", "科幻", "赛博朋克"}', '开放中'),
(4, '求购一个游戏角色模型', '我需要一个高质量的、适用于UE5引擎的女性精灵法师角色模型。', '¥10,000', '游戏资产', '{"UE5", "角色模型", "法师"}', '洽谈中'),
(3, '寻找婚礼策划服务', '计划在明年春天举办一场小型海岛婚礼，需要专业的策划团队。', '¥50,000以上', '服务', '{"婚礼策划", "海岛婚礼"}', '已完成');

INSERT INTO demand_responses (demand_id, supplier_id) VALUES
(3, 4); -- Creator Wang Fang responded to the game character demand

-- Insert mock data for public resources
INSERT INTO external_links (name, url, description, category) VALUES
('TechCrunch - 最新科技新闻', 'https://techcrunch.com/', '提供技术和创业公司新闻、分析和观点。', '科技新闻'),
('中国家电网', 'http://www.cheaa.com/', '中国家用电器协会主办的官方网站，提供行业动态和数据。', '行业资讯'),
('Statista - 市场数据统计', 'https://www.statista.com/', '全球领先的商业数据平台，提供各类市场和消费者数据。', '数据分析');

INSERT INTO api_interfaces (name, endpoint, auth_method, status, docs_url) VALUES
('天气查询 API', 'https://api.weather.com/v3/weather/...', 'API Key', 'active', 'https://weather.com/dev/docs'),
('地图与地理编码 API', 'https://api.mapbox.com/geocoding/v5/...', 'OAuth 2.0', 'active', 'https://docs.mapbox.com/api/search/geocoding/'),
('内部产品价格查询', 'https://internal.api/products/price', 'JWT', 'inactive', 'https://internal.docs/product-price-api');

    